const { createClient } = require('@supabase/supabase-js');
const db = createClient(
  'https://iacjfguemajtthjzvupj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhY2pmZ3VlbWFqdHRoanp2dXBqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwMDI3NjEsImV4cCI6MjA3ODU3ODc2MX0.1_2l_TG2ICUK2a-AnV9ynHRx3G3L8XY4GIObSFz43rc'
);

async function main() {
  // Count March 2026 leads already in DB
  const { count } = await db.from('leads').select('id', { count: 'exact', head: true })
    .eq('tenant_id', 'santa_fe_kia').like('lead_date', '2026-03%');
  console.log('March 2026 leads in DB:', count);

  // Show a few
  const { data } = await db.from('leads').select('lead_date, customer_name, source, segment, status')
    .eq('tenant_id', 'santa_fe_kia').like('lead_date', '2026-03%')
    .order('lead_date', { ascending: false }).limit(10);
  if (data) {
    console.log('\nLatest March leads in DB:');
    data.forEach(r => console.log(' ', r.lead_date, '|', r.customer_name, '|', r.source, '|', r.segment, '|', r.status));
  }

  // What's the latest date in the DB overall?
  const { data: latest } = await db.from('leads').select('lead_date')
    .eq('tenant_id', 'santa_fe_kia').order('lead_date', { ascending: false }).limit(1);
  if (latest && latest[0]) console.log('\nMost recent lead in DB:', latest[0].lead_date);

  // KPI for March
  const { data: kpi } = await db.from('kpi_monthly').select('month, total_leads, total_sold, pct_overall')
    .eq('tenant_id', 'santa_fe_kia').eq('month', '2026-03');
  if (kpi && kpi[0]) console.log('\nMarch KPI:', JSON.stringify(kpi[0]));
  else console.log('\nNo March KPI row found');
}
main().catch(console.error);
