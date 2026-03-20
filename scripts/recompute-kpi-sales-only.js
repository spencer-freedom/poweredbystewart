const { createClient } = require('@supabase/supabase-js');
const db = createClient(
  'https://iacjfguemajtthjzvupj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhY2pmZ3VlbWFqdHRoanp2dXBqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzAwMjc2MSwiZXhwIjoyMDc4NTc4NzYxfQ.DIa2SqA5FCaB_T-wF0GvI0F4O8-DJbjzfCguTAPYUf0'
);

async function recomputeMonth(tenantId, month) {
  // Fetch only sales leads (exclude service)
  const { data: leads } = await db.from('leads').select('*')
    .eq('tenant_id', tenantId).like('lead_date', month + '%')
    .neq('lead_type', 'service');

  if (!leads || leads.length === 0) {
    console.log(`  ${month}: no sales leads found`);
    return;
  }

  const count = (fn) => leads.filter(fn).length;
  const pct = (n, d) => d > 0 ? Math.round((n / d) * 1000) / 10 : 0;

  const total_leads = leads.length;
  const new_leads = count(l => l.segment === 'new');
  const used_leads = count(l => l.segment === 'used');
  const cpo_leads = count(l => l.segment === 'cpo');
  const total_appts = count(l => l.appt === 1 || l.appt === true);
  const total_shows = count(l => l.show === 1 || l.show === true);
  const total_sold = count(l => l.status === 'sold');
  const total_turns = count(l => l.turn_over === 1 || l.turn_over === true);
  const total_contacted = count(l => {
    const pa = (l.past_actions || '').toLowerCase();
    return pa.includes('contacted') || pa.includes('conacted') || pa.includes('yes');
  });

  const source_breakdown = {};
  for (const l of leads) {
    const src = l.source || 'Unknown';
    if (!source_breakdown[src]) source_breakdown[src] = { leads: 0, sold: 0 };
    source_breakdown[src].leads++;
    if (l.status === 'sold') source_breakdown[src].sold++;
  }

  const salesperson_breakdown = {};
  for (const l of leads) {
    const rep = l.to_salesperson || l.salesperson;
    if (rep) {
      if (!salesperson_breakdown[rep]) salesperson_breakdown[rep] = { leads: 0, sold: 0 };
      salesperson_breakdown[rep].leads++;
      if (l.status === 'sold') salesperson_breakdown[rep].sold++;
    }
  }

  const kpi = {
    tenant_id: tenantId, month,
    total_leads, total_contacted,
    total_appts, total_shows, total_sold, total_turns,
    new_leads,
    new_appts: count(l => l.segment === 'new' && (l.appt === 1 || l.appt === true)),
    new_shows: count(l => l.segment === 'new' && (l.show === 1 || l.show === true)),
    new_sold: count(l => l.segment === 'new' && l.status === 'sold'),
    used_leads,
    used_appts: count(l => l.segment === 'used' && (l.appt === 1 || l.appt === true)),
    used_shows: count(l => l.segment === 'used' && (l.show === 1 || l.show === true)),
    used_sold: count(l => l.segment === 'used' && l.status === 'sold'),
    cpo_leads,
    cpo_appts: count(l => l.segment === 'cpo' && (l.appt === 1 || l.appt === true)),
    cpo_shows: count(l => l.segment === 'cpo' && (l.show === 1 || l.show === true)),
    cpo_sold: count(l => l.segment === 'cpo' && l.status === 'sold'),
    appt_showed: total_shows,
    new_appt_showed: count(l => l.segment === 'new' && (l.show === 1 || l.show === true)),
    used_appt_showed: count(l => l.segment === 'used' && (l.show === 1 || l.show === true)),
    cpo_appt_showed: count(l => l.segment === 'cpo' && (l.show === 1 || l.show === true)),
    walk_ins: count(l => l.lead_type === 'walkin'),
    sold_from_appt: 0, sold_from_walkin: count(l => l.lead_type === 'walkin' && l.status === 'sold'),
    pct_contacted: pct(total_contacted, total_leads),
    pct_appt_set: pct(total_appts, total_leads),
    pct_show_set: pct(total_shows, total_appts),
    pct_show_sold: pct(total_sold, total_shows),
    pct_overall: pct(total_sold, total_leads),
    source_breakdown, salesperson_breakdown,
  };

  console.log(`  ${month}: ${total_leads} sales leads (excl service), ${total_sold} sold, ${kpi.pct_overall}% close`);
  console.log(`    new: ${new_leads}, used: ${used_leads}, cpo: ${cpo_leads}`);
  console.log(`    walk-ins: ${kpi.walk_ins}, internet: ${count(l => l.lead_type === 'internet')}, phone: ${count(l => l.lead_type === 'phone')}`);

  const { error } = await db.from('kpi_monthly')
    .upsert(kpi, { onConflict: 'tenant_id,month' });

  if (error) console.error('    Upsert error:', error.message);
  else console.log('    KPI upserted');
}

async function main() {
  const tenantId = 'santa_fe_kia';

  // First, classify leads that don't have lead_type set yet
  console.log('Classifying leads by type...');

  const { count: svcCount } = await db.from('leads')
    .update({ lead_type: 'service' })
    .eq('tenant_id', tenantId)
    .ilike('source', '%dealertrack%')
    .select('id', { count: 'exact', head: true });
  console.log('  Service (Dealertrack):', svcCount || 'updated');

  const { count: walkCount } = await db.from('leads')
    .update({ lead_type: 'walkin' })
    .eq('tenant_id', tenantId)
    .or('source.ilike.%walk-in%,source.ilike.%walk in%,source.ilike.%fresh up%')
    .select('id', { count: 'exact', head: true });
  console.log('  Walk-in:', walkCount || 'updated');

  const { count: phoneCount } = await db.from('leads')
    .update({ lead_type: 'phone' })
    .eq('tenant_id', tenantId)
    .ilike('source', '%phone%')
    .select('id', { count: 'exact', head: true });
  console.log('  Phone:', phoneCount || 'updated');

  // Get months to recompute
  const { data: months } = await db.from('kpi_monthly')
    .select('month').eq('tenant_id', tenantId).order('month', { ascending: false });

  console.log('\nRecomputing KPI (sales leads only)...');
  for (const { month } of (months || [])) {
    await recomputeMonth(tenantId, month);
  }

  // Verify final counts
  const types = {};
  const { data: all } = await db.from('leads').select('lead_type')
    .eq('tenant_id', tenantId).like('lead_date', '2026-03%');
  for (const l of (all || [])) {
    const t = l.lead_type || 'internet';
    types[t] = (types[t] || 0) + 1;
  }
  console.log('\nMarch 2026 lead types:', JSON.stringify(types));
}
main().catch(console.error);
