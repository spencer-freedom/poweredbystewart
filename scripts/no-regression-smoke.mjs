#!/usr/bin/env node
// Pre-merge smoke: hit every existing surface, confirm 200 + no error markers.
// Run against http://localhost:3000 (dev server) or BASE_URL env.
//
//   node scripts/no-regression-smoke.mjs
//   BASE_URL=https://poweredbystewart.com node scripts/no-regression-smoke.mjs

const BASE = process.env.BASE_URL || "http://localhost:3000";
const KENNY_TOKEN =
  process.env.KENNY_TOKEN ||
  "eyJleHBpcmVzX2F0IjoxNzg1MTc3MDEyLCJpc3N1ZWRfYXQiOjE3NzczMTQ2MTIsImtpbmQiOiJrZW5ueV9kZW1vIiwic2NvcGUiOlsiZGFzaGJvYXJkOnJlYWQiLCJ1cGxvYWQ6YXVkaW8iXSwidGVuYW50X2lkIjoiaW9uX3NvbGFyIiwidiI6MX0.NLJRP-gbR4wVzBJGWu29fe78tbVPpmNINUl8vAmUHcE";

// Routes that must keep working. Jamie's Kia surfaces + the Kenny demo.
// `mustContain` strings are case-sensitive substrings checked against HTML.
// `mustNotContain` catches stack traces / 500-page tells.
const ROUTES = [
  { path: "/",                      label: "PBS landing",    mustContain: ["Powered by Stewart"] },
  { path: "/dashboard",             label: "Kia dashboard",  mustContain: [], gated: true },
  { path: "/leads",                 label: "Kia leads",      mustContain: [], gated: true },
  { path: "/lead-dedup",            label: "Lead dedup",     mustContain: [], gated: true },
  { path: "/compass",               label: "Compass",        mustContain: [], gated: true },
  { path: "/gauge",                 label: "Gauge",          mustContain: [], gated: true },
  { path: "/sentry",                label: "Sentry",         mustContain: [], gated: true },
  { path: "/vinsync",               label: "Vinsync",        mustContain: [], gated: true },
  { path: `/ion/k/${KENNY_TOKEN}`,            label: "Kenny landing",  mustContain: ["Stewart is running deeper analysis"] },
  { path: `/ion/k/${KENNY_TOKEN}/tree`,       label: "Kenny tree",     mustContain: ["Decision Tree"] },
  { path: `/ion/k/${KENNY_TOKEN}/next-steps`, label: "Kenny next-steps", mustContain: ["Salesforce report"] },
  { path: `/ion/k/${KENNY_TOKEN}/preview`,    label: "Kenny preview",  mustContain: ["each of your 35 setters"] },
  { path: `/ion/k/${KENNY_TOKEN}/rep/rep_alex`, label: "Rep daily", mustContain: ["Today's focus", "Stewart noticed"] },
  { path: `/ion/k/${KENNY_TOKEN}/manager`,    label: "Stub: manager",   mustContain: ["Stewart's still working"] },
  { path: `/ion/k/${KENNY_TOKEN}/manager/rep_alex/20000054949`, label: "Coaching prep", mustContain: ["Session ready", "Stewart noticed"] },
  { path: `/ion/k/${KENNY_TOKEN}/leader`,     label: "Sales leader",    mustContain: ["Floor-wide patterns", "Pipeline funnel"] },
  { path: `/ion/k/${KENNY_TOKEN}/wiki`,       label: "Wiki page", mustContain: ["Pattern Wiki", "Archivist"] },
  // Brain page: passes if either the brain renders OR the denial page does.
  // No content-marker requirement; just 200 + no error markers. Local dev
  // with NEXT_PUBLIC_BRAIN_DEV_BYPASS=1 gets the brain; production deploys
  // (no bypass + non-system_owner token) get the denial.
  { path: `/ion/k/${KENNY_TOKEN}/wiki/brain`, label: "Brain page",  mustContain: [] },
  { path: `/ion/k/${KENNY_TOKEN}/owner`,      label: "Stub: owner",     mustContain: ["Stewart's still working"] },
];

const ERROR_MARKERS = [
  "Internal Server Error",
  "Application error: a client-side exception",
  "Cannot find module",
  "TypeError:",
  "ReferenceError:",
];

let pass = 0;
let fail = 0;
const failures = [];

for (const r of ROUTES) {
  const url = `${BASE}${r.path}`;
  try {
    const res = await fetch(url, { redirect: "manual" });
    const html = await res.text().catch(() => "");
    const status = res.status;
    const ok = status === 200 || (r.gated && (status >= 300 && status < 400));
    const missing = (r.mustContain || []).filter((s) => !html.includes(s));
    const hasError = ERROR_MARKERS.find((m) => html.includes(m));

    if (!ok) {
      fail++;
      failures.push(`${r.label} → HTTP ${status}`);
      console.log(`  ✗ ${r.label.padEnd(28)} HTTP ${status}`);
    } else if (missing.length) {
      fail++;
      failures.push(`${r.label} → missing: ${missing.join(", ")}`);
      console.log(`  ✗ ${r.label.padEnd(28)} HTTP ${status} · missing: ${missing.join(", ")}`);
    } else if (hasError) {
      fail++;
      failures.push(`${r.label} → error marker: ${hasError}`);
      console.log(`  ✗ ${r.label.padEnd(28)} HTTP ${status} · ${hasError}`);
    } else {
      pass++;
      console.log(`  ✓ ${r.label.padEnd(28)} HTTP ${status}`);
    }
  } catch (e) {
    fail++;
    failures.push(`${r.label} → ${e.message}`);
    console.log(`  ✗ ${r.label.padEnd(28)} ${e.message}`);
  }
}

console.log(`\n${pass} passed, ${fail} failed against ${BASE}`);
if (fail > 0) {
  console.log("\nFailures:");
  for (const f of failures) console.log(`  · ${f}`);
  process.exit(1);
}
