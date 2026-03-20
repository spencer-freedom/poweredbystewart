const { createClient } = require('@supabase/supabase-js');

// DB 1: SpencerOS (iacjfguemajtthjzvupj) — where usefulwax-v3 points
const db1 = createClient(
  'https://iacjfguemajtthjzvupj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhY2pmZ3VlbWFqdHRoanp2dXBqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwMDI3NjEsImV4cCI6MjA3ODU3ODc2MX0.1_2l_TG2ICUK2a-AnV9ynHRx3G3L8XY4GIObSFz43rc'
);

// DB 2: Clients DB (cyggcgbvprmpzzwkqtyd) — where inventory doc says KIA should be
const db2 = createClient(
  'https://cyggcgbvprmpzzwkqtyd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5Z2djZ2J2cHJtcHp6d2txdHlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0MzQ3NzgsImV4cCI6MjA3OTAxMDc3OH0.HWlJgRHdi8nlhFBZSi5B7tYMDLA1uhUPjVRNbxrv7y4'
);

async function check(name, client) {
  console.log(`\n=== ${name} ===`);

  // Check for leads table
  const { data: leads, error: leadsErr, count: leadsCount } = await client
    .from('leads')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', 'santa_fe_kia');

  if (leadsErr) {
    // Try alternate tenant_id
    const { data: leads2, error: leadsErr2, count: leadsCount2 } = await client
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', 'kia_santa_fe');

    if (leadsErr2) {
      console.log('  leads table: ERROR or NOT FOUND -', leadsErr.message);
    } else {
      console.log('  leads (kia_santa_fe):', leadsCount2, 'rows');
    }
  } else {
    console.log('  leads (santa_fe_kia):', leadsCount, 'rows');
  }

  // Also try kia_santa_fe
  const { count: altCount } = await client
    .from('leads')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', 'kia_santa_fe');
  if (altCount > 0) {
    console.log('  leads (kia_santa_fe):', altCount, 'rows');
  }

  // Check kpi_monthly
  const { data: kpi, error: kpiErr } = await client
    .from('kpi_monthly')
    .select('tenant_id, month')
    .or('tenant_id.eq.santa_fe_kia,tenant_id.eq.kia_santa_fe')
    .order('month', { ascending: false })
    .limit(5);

  if (kpiErr) {
    console.log('  kpi_monthly: ERROR -', kpiErr.message);
  } else {
    console.log('  kpi_monthly:', kpi?.length || 0, 'rows');
    if (kpi) kpi.forEach(r => console.log('    ', r.tenant_id, r.month));
  }

  // Check vin_leads
  const { count: vinCount, error: vinErr } = await client
    .from('vin_leads')
    .select('id', { count: 'exact', head: true })
    .or('tenant_id.eq.santa_fe_kia,tenant_id.eq.kia_santa_fe');

  if (vinErr) {
    console.log('  vin_leads: ERROR -', vinErr.message);
  } else {
    console.log('  vin_leads:', vinCount, 'rows');
  }

  // Check vendor_budgets
  const { count: vendorCount, error: vendorErr } = await client
    .from('vendor_budgets')
    .select('id', { count: 'exact', head: true })
    .or('tenant_id.eq.santa_fe_kia,tenant_id.eq.kia_santa_fe');

  if (vendorErr) {
    console.log('  vendor_budgets: ERROR -', vendorErr.message);
  } else {
    console.log('  vendor_budgets:', vendorCount, 'rows');
  }

  // Check marketing_clients
  const { data: clients, error: clientsErr } = await client
    .from('marketing_clients')
    .select('tenant_id, display_name')
    .limit(10);

  if (clientsErr) {
    console.log('  marketing_clients: ERROR -', clientsErr.message);
  } else {
    console.log('  marketing_clients:', clients?.length || 0, 'rows');
    if (clients) clients.forEach(r => console.log('    ', r.tenant_id, '-', r.display_name));
  }
}

async function main() {
  await check('SpencerOS DB (iacjfguemajtthjzvupj)', db1);
  await check('Clients DB (cyggcgbvprmpzzwkqtyd)', db2);
}

main().catch(console.error);
