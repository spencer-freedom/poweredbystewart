const { createClient } = require('@supabase/supabase-js');
const db = createClient(
  'https://iacjfguemajtthjzvupj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhY2pmZ3VlbWFqdHRoanp2dXBqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzAwMjc2MSwiZXhwIjoyMDc4NTc4NzYxfQ.DIa2SqA5FCaB_T-wF0GvI0F4O8-DJbjzfCguTAPYUf0'
);

async function main() {
  // Get ALL March leads with full details
  const { data: leads } = await db.from('leads').select('*')
    .eq('tenant_id', 'santa_fe_kia').like('lead_date', '2026-03%');

  console.log('Total March leads:', leads.length);

  // Group by source to see what's what
  const bySource = {};
  for (const l of leads) {
    const src = l.source || 'Unknown';
    if (!bySource[src]) bySource[src] = { count: 0, sold: 0, samples: [] };
    bySource[src].count++;
    if (l.status === 'sold') bySource[src].sold++;
    if (bySource[src].samples.length < 2) {
      bySource[src].samples.push({
        name: l.customer_name,
        interest: l.interest,
        segment: l.segment,
        status: l.status,
        source_confidence: l.source_confidence
      });
    }
  }

  console.log('\n=== SOURCES (sorted by count) ===');
  const sorted = Object.entries(bySource).sort((a,b) => b[1].count - a[1].count);
  for (const [src, info] of sorted) {
    console.log(`\n${src}: ${info.count} leads, ${info.sold} sold`);
    for (const s of info.samples) {
      console.log(`  sample: ${s.name} | interest: ${s.interest || '-'} | ${s.segment} | ${s.status} | conf: ${s.source_confidence || '-'}`);
    }
  }

  // Check for "lead_type" or similar fields in metadata
  console.log('\n=== CHECKING FOR LEAD TYPE INDICATORS ===');
  const withMeta = leads.filter(l => l.metadata && l.metadata !== '{}' && l.metadata !== '');
  console.log('Leads with metadata:', withMeta.length);
  if (withMeta.length > 0) {
    console.log('Sample metadata:', withMeta.slice(0,3).map(l => l.metadata));
  }

  // Check source_confidence values
  const confValues = {};
  for (const l of leads) {
    const c = l.source_confidence || 'empty';
    confValues[c] = (confValues[c] || 0) + 1;
  }
  console.log('\nSource confidence values:', confValues);

  // Check for service-related keywords in source names
  console.log('\n=== LIKELY SERVICE vs SALES ===');
  const serviceKeywords = ['service', 'parts', 'recall', 'warranty', 'maintenance', 'repair'];
  const salesKeywords = ['internet', 'web', 'autotrader', 'truecar', 'edmunds', 'kia digital', 'facebook', 'dealertrack', 'velocity', 'apollo', 'cargurus', 'carfax'];

  let serviceLike = 0;
  let salesLike = 0;
  let unclear = 0;
  const unclearSources = {};

  for (const l of leads) {
    const src = (l.source || '').toLowerCase();
    const interest = (l.interest || '').toLowerCase();
    if (serviceKeywords.some(k => src.includes(k) || interest.includes(k))) {
      serviceLike++;
    } else if (salesKeywords.some(k => src.includes(k))) {
      salesLike++;
    } else {
      unclear++;
      unclearSources[l.source || 'Unknown'] = (unclearSources[l.source || 'Unknown'] || 0) + 1;
    }
  }

  console.log(`Sales-like: ${salesLike}`);
  console.log(`Service-like: ${serviceLike}`);
  console.log(`Unclear: ${unclear}`);
  console.log('Unclear sources:', JSON.stringify(unclearSources, null, 2));

  // Now compare Jamie's leads (3/16+) vs VinSolutions leads (before 3/16)
  console.log('\n=== JAMIE vs VINSOLUTIONS SPLIT ===');
  const jamie = leads.filter(l => l.lead_date >= '2026-03-16');
  const vin = leads.filter(l => l.lead_date < '2026-03-16');
  console.log(`VinSolutions (before 3/16): ${vin.length} leads`);
  console.log(`Jamie's sheet (3/16+): ${jamie.length} leads`);

  // Jamie's sources
  const jamieSources = {};
  for (const l of jamie) {
    jamieSources[l.source || 'Unknown'] = (jamieSources[l.source || 'Unknown'] || 0) + 1;
  }
  console.log('Jamie sources:', JSON.stringify(jamieSources));

  // VinSolutions sources
  const vinSources = {};
  for (const l of vin) {
    vinSources[l.source || 'Unknown'] = (vinSources[l.source || 'Unknown'] || 0) + 1;
  }
  console.log('Vin sources (top 15):');
  Object.entries(vinSources).sort((a,b) => b[1]-a[1]).slice(0,15).forEach(([s,c]) => console.log(`  ${s}: ${c}`));
}
main().catch(console.error);
