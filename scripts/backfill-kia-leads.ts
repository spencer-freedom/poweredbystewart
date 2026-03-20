/**
 * Phase 1: Backfill KIA leads from Jamie's Excel/Google Sheet export
 *
 * Usage:
 *   npx tsx scripts/backfill-kia-leads.ts [path-to-xlsx]
 *
 * Defaults to: C:\Users\spenc\Downloads\Sales KPI Report  (1).xlsx
 *
 * Requires env vars (reads from .env.local):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)
 */

import { createClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";
import * as fs from "fs";
import * as path from "path";

// Load env vars from SpencerOS .env (primary) and local .env.local (overrides)
const envFiles = [
  "C:\\Users\\spenc\\OneDrive\\Desktop\\spenceros\\.env",
  path.resolve(process.cwd(), ".env.local"),
];
for (const envPath of envFiles) {
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8");
    for (const line of envContent.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

const TENANT_ID = "santa_fe_kia";

// KIA data lives in SpencerOS DB (iacjfguemajtthjzvupj)
// Map DATABASE_URL to Supabase URL if NEXT_PUBLIC_SUPABASE_URL not set
let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
if (!supabaseUrl && process.env.DATABASE_URL) {
  const match = process.env.DATABASE_URL.match(/db\.([a-z]+)\.supabase\.co/);
  if (match) supabaseUrl = `https://${match[1]}.supabase.co`;
}
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseKey) {
  // Fallback: hardcode the SpencerOS DB (same as usefulwax-v3)
  console.log("Using hardcoded SpencerOS DB credentials");
}

const supabase = createClient(
  supabaseUrl || "https://iacjfguemajtthjzvupj.supabase.co",
  supabaseKey || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhY2pmZ3VlbWFqdHRoanp2dXBqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzAwMjc2MSwiZXhwIjoyMDc4NTc4NzYxfQ.DIa2SqA5FCaB_T-wF0GvI0F4O8-DJbjzfCguTAPYUf0"
);

// ─── Source normalization ─────────────────────────────────────────────────

const SOURCE_MAP: Record<string, string> = {
  edmunds: "Edmunds",
  "true car": "TrueCar",
  truecar: "TrueCar",
  web: "Website",
  "web event": "Website",
  wed: "Website", // typo in sheet
  "team velocity": "Velocity",
  velocity: "Velocity",
  apollo: "Apollo",
  autotrader: "AutoTrader",
  "auto-trader": "AutoTrader",
  "auto trader": "AutoTrader",
  ksl: "KSL",
  "car gurus": "CarGurus",
  cargurus: "CarGurus",
  carfax: "CarFax",
  "cars.com": "Cars.com",
  acura: "Acura",
  facebook: "Facebook",
  "hutton media": "Hutton Media",
  "dealer inspire": "Dealer Inspire",
  kia: "Kia",
};

function normalizeSource(raw: string): string {
  const key = raw.trim().toLowerCase();
  return SOURCE_MAP[key] || raw.trim();
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function isX(val: unknown): boolean {
  if (!val) return false;
  return String(val).trim().toLowerCase() === "x";
}

function determineSegment(newCol: unknown, usedCol: unknown, certCol: unknown, interest: string): string {
  if (isX(newCol)) return "new";
  if (isX(usedCol)) return "used";
  if (isX(certCol)) return "cpo";
  const lower = interest.toLowerCase();
  if (lower.includes("pre owned") || lower.includes("pre-owned")) return "used";
  if (lower.includes("2026") || lower.includes("2027") || lower.includes("new")) return "new";
  return "new";
}

function determineStatus(workingCol: unknown, deadCol: unknown, soldCol: unknown): string {
  if (isX(soldCol)) return "sold";
  if (isX(deadCol)) return "dead";
  if (isX(workingCol)) return "working";
  return "working";
}

function parseExcelDate(val: unknown): string | null {
  if (!val) return null;
  if (typeof val === "number") {
    // Excel serial date number
    const d = new Date((val - 25569) * 86400 * 1000);
    if (!isNaN(d.getTime())) {
      return d.toISOString().split("T")[0];
    }
    return null;
  }
  const str = String(val).trim();
  if (!str) return null;
  // Handle "2026-03-16 00:00:00" format
  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split("T")[0];
  }
  return null;
}

// ─── Sheet Parsing ────────────────────────────────────────────────────────

interface ParsedLead {
  tenant_id: string;
  lead_date: string;
  customer_name: string;
  source: string;
  interest: string;
  segment: string;
  past_actions: string;
  appt: number;
  show: number;
  turn_over: number;
  to_date: string | null;
  to_salesperson: string;
  status: string;
  future_actions: string;
}

function parseMonthSheet(sheet: XLSX.WorkSheet): ParsedLead[] {
  const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true });
  const leads: ParsedLead[] = [];

  // Skip header row (row 0)
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    // Columns: 0=Date, 1=Name, 2=Source, 3=Interest, 4=New, 5=Used, 6=Certified,
    // 7=Past Actions, 8=Appt, 9=Show, 10=T/O, 11=T/O Date, 12=T/O Sales Person,
    // 13=Working, 14=Dead, 15=Future Actions, 16=Sold

    const date = parseExcelDate(row[0]);
    const name = String(row[1] || "").trim();

    // Skip rows without a date or name (summary rows, empty rows)
    if (!date || !name) continue;

    const source = normalizeSource(String(row[2] || ""));
    const interest = String(row[3] || "").trim();
    const segment = determineSegment(row[4], row[5], row[6], interest);
    const pastActions = String(row[7] || "").trim();
    const appt = isX(row[8]) ? 1 : 0;
    const show = isX(row[9]) ? 1 : 0;
    const turnOver = isX(row[10]) ? 1 : 0;
    const toDate = parseExcelDate(row[11]);
    const toSalesperson = String(row[12] || "").trim();
    const status = determineStatus(row[13], row[14], row[16]);
    const futureActions = String(row[15] || "").trim();

    leads.push({
      tenant_id: TENANT_ID,
      lead_date: date,
      customer_name: name,
      source,
      interest,
      segment,
      past_actions: pastActions,
      appt,
      show,
      turn_over: turnOver,
      to_date: toDate,
      to_salesperson: toSalesperson,
      status,
      future_actions: futureActions,
    });
  }

  return leads;
}

// ─── Vendor Budget Parsing ────────────────────────────────────────────────

interface ParsedVendor {
  tenant_id: string;
  vendor_name: string;
  service: string;
  monthly_budget: number;
  coop_amount: number;
  true_budget: number;
  is_active: number;
  notes: string;
}

function parseVendorSheet(sheet: XLSX.WorkSheet): ParsedVendor[] {
  const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true });
  const vendors: ParsedVendor[] = [];

  // Find the header row (Vendor Name, Service, Monthly Budget, Co-Op, ...)
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row) continue;
    if (String(row[0] || "").includes("Vendor Name")) {
      // Data rows follow
      for (let j = i + 1; j < rows.length; j++) {
        const r = rows[j];
        if (!r) continue;
        const vendorName = String(r[0] || "").trim();
        if (!vendorName || vendorName.includes("Total")) break;

        const service = String(r[1] || "").trim();
        const monthlyBudget = Number(r[2]) || 0;
        const coopAmount = Number(r[3]) || 0;
        const trueBudget = monthlyBudget - coopAmount;
        const notes = String(r[5] || "").trim();

        vendors.push({
          tenant_id: TENANT_ID,
          vendor_name: vendorName,
          service,
          monthly_budget: monthlyBudget,
          coop_amount: coopAmount,
          true_budget: trueBudget,
          is_active: 1,
          notes,
        });
      }
      break;
    }
  }

  return vendors;
}

// ─── KPI Computation ──────────────────────────────────────────────────────

function computeKpiFromLeads(leads: ParsedLead[], month: string) {
  const monthLeads = leads.filter((l) => l.lead_date.startsWith(month));

  const total_leads = monthLeads.length;
  const new_leads = monthLeads.filter((l) => l.segment === "new").length;
  const used_leads = monthLeads.filter((l) => l.segment === "used").length;
  const cpo_leads = monthLeads.filter((l) => l.segment === "cpo").length;

  const total_appts = monthLeads.filter((l) => l.appt === 1).length;
  const new_appts = monthLeads.filter((l) => l.segment === "new" && l.appt === 1).length;
  const used_appts = monthLeads.filter((l) => l.segment === "used" && l.appt === 1).length;
  const cpo_appts = monthLeads.filter((l) => l.segment === "cpo" && l.appt === 1).length;

  const total_shows = monthLeads.filter((l) => l.show === 1).length;
  const new_shows = monthLeads.filter((l) => l.segment === "new" && l.show === 1).length;
  const used_shows = monthLeads.filter((l) => l.segment === "used" && l.show === 1).length;
  const cpo_shows = monthLeads.filter((l) => l.segment === "cpo" && l.show === 1).length;

  const total_sold = monthLeads.filter((l) => l.status === "sold").length;
  const new_sold = monthLeads.filter((l) => l.segment === "new" && l.status === "sold").length;
  const used_sold = monthLeads.filter((l) => l.segment === "used" && l.status === "sold").length;
  const cpo_sold = monthLeads.filter((l) => l.segment === "cpo" && l.status === "sold").length;

  const total_turns = monthLeads.filter((l) => l.turn_over === 1).length;

  const contacted = monthLeads.filter((l) =>
    l.past_actions.toLowerCase().includes("contacted") ||
    l.past_actions.toLowerCase().includes("conacted")
  ).length;
  const total_contacted = contacted;

  // Percentages
  const pct_contacted = total_leads > 0 ? (total_contacted / total_leads) * 100 : 0;
  const pct_appt_set = total_leads > 0 ? (total_appts / total_leads) * 100 : 0;
  const pct_show_set = total_appts > 0 ? (total_shows / total_appts) * 100 : 0;
  const pct_show_sold = total_shows > 0 ? (total_sold / total_shows) * 100 : 0;
  const pct_overall = total_leads > 0 ? (total_sold / total_leads) * 100 : 0;

  // Source breakdown
  const source_breakdown: Record<string, { leads: number; sold: number }> = {};
  for (const lead of monthLeads) {
    const src = lead.source || "Unknown";
    if (!source_breakdown[src]) source_breakdown[src] = { leads: 0, sold: 0 };
    source_breakdown[src].leads++;
    if (lead.status === "sold") source_breakdown[src].sold++;
  }

  // Salesperson breakdown (from T/O salesperson)
  const salesperson_breakdown: Record<string, { leads: number; sold: number }> = {};
  for (const lead of monthLeads) {
    if (lead.to_salesperson) {
      const rep = lead.to_salesperson;
      if (!salesperson_breakdown[rep]) salesperson_breakdown[rep] = { leads: 0, sold: 0 };
      salesperson_breakdown[rep].leads++;
      if (lead.status === "sold") salesperson_breakdown[rep].sold++;
    }
  }

  return {
    tenant_id: TENANT_ID,
    month,
    total_leads,
    total_contacted,
    total_appts,
    total_shows,
    total_sold,
    total_turns,
    new_leads,
    new_appts,
    new_shows,
    new_sold,
    used_leads,
    used_appts,
    used_shows,
    used_sold,
    cpo_leads,
    cpo_appts,
    cpo_shows,
    cpo_sold,
    appt_showed: total_shows,
    new_appt_showed: new_shows,
    used_appt_showed: used_shows,
    cpo_appt_showed: cpo_shows,
    walk_ins: 0,
    sold_from_appt: 0,
    sold_from_walkin: 0,
    pct_contacted: Math.round(pct_contacted * 10) / 10,
    pct_appt_set: Math.round(pct_appt_set * 10) / 10,
    pct_show_set: Math.round(pct_show_set * 10) / 10,
    pct_show_sold: Math.round(pct_show_sold * 10) / 10,
    pct_overall: Math.round(pct_overall * 10) / 10,
    source_breakdown,
    salesperson_breakdown,
  };
}

// ─── Main ─────────────────────────────────────────────────────────────────

async function main() {
  const xlsxPath = process.argv[2] || "C:\\Users\\spenc\\Downloads\\Sales KPI Report  (1).xlsx";

  if (!fs.existsSync(xlsxPath)) {
    console.error(`File not found: ${xlsxPath}`);
    process.exit(1);
  }

  console.log(`Reading: ${xlsxPath}`);
  const workbook = XLSX.readFile(xlsxPath);
  console.log(`Sheets: ${workbook.SheetNames.join(", ")}`);

  // ── Parse month sheets ──
  const monthSheets = workbook.SheetNames.filter((name) =>
    /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\.\s*\d{4}$/i.test(name)
  );

  console.log(`\nMonth sheets found: ${monthSheets.join(", ")}`);

  const allLeads: ParsedLead[] = [];

  for (const sheetName of monthSheets) {
    const sheet = workbook.Sheets[sheetName];
    const leads = parseMonthSheet(sheet);
    console.log(`  ${sheetName}: ${leads.length} leads parsed`);
    allLeads.push(...leads);
  }

  if (allLeads.length === 0) {
    console.log("No leads found in any sheet.");
    process.exit(0);
  }

  // ── Deduplicate by (lead_date, customer_name) ──
  const seen = new Set<string>();
  const uniqueLeads: ParsedLead[] = [];
  for (const lead of allLeads) {
    const key = `${lead.lead_date}|${lead.customer_name.toLowerCase()}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueLeads.push(lead);
    }
  }
  console.log(`\nTotal unique leads: ${uniqueLeads.length}`);

  // ── Preview ──
  console.log("\nSample leads:");
  for (const lead of uniqueLeads.slice(0, 5)) {
    console.log(`  ${lead.lead_date} | ${lead.customer_name} | ${lead.source} | ${lead.segment} | ${lead.status}`);
  }

  // ── Source summary ──
  const sourceCounts: Record<string, number> = {};
  for (const l of uniqueLeads) {
    sourceCounts[l.source] = (sourceCounts[l.source] || 0) + 1;
  }
  console.log("\nSource breakdown:");
  for (const [src, count] of Object.entries(sourceCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${src}: ${count}`);
  }

  // ── Insert leads into Supabase ──
  console.log("\nInserting leads into Supabase...");

  // Batch insert in chunks of 50
  const BATCH_SIZE = 50;
  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < uniqueLeads.length; i += BATCH_SIZE) {
    const batch = uniqueLeads.slice(i, i + BATCH_SIZE);
    const { data, error } = await supabase
      .from("leads")
      .upsert(batch, { onConflict: "tenant_id,lead_date,customer_name", ignoreDuplicates: false })
      .select("id");

    if (error) {
      console.error(`  Batch ${Math.floor(i / BATCH_SIZE) + 1} error:`, error.message);
      // Fallback: insert one by one
      for (const lead of batch) {
        const { error: singleErr } = await supabase.from("leads").upsert(lead, {
          onConflict: "tenant_id,lead_date,customer_name",
          ignoreDuplicates: false,
        });
        if (singleErr) {
          console.error(`    Failed: ${lead.customer_name} - ${singleErr.message}`);
          errors++;
        } else {
          inserted++;
        }
      }
    } else {
      inserted += data?.length || batch.length;
    }
  }

  console.log(`Inserted/updated: ${inserted}, Errors: ${errors}`);

  // ── Compute and upsert KPI monthly ──
  const months = [...new Set(uniqueLeads.map((l) => l.lead_date.slice(0, 7)))];
  console.log(`\nComputing KPI for months: ${months.join(", ")}`);

  for (const month of months) {
    const kpi = computeKpiFromLeads(uniqueLeads, month);
    console.log(`  ${month}: ${kpi.total_leads} leads, ${kpi.total_sold} sold, ${kpi.pct_overall}% close`);

    const { error } = await supabase
      .from("kpi_monthly")
      .upsert(kpi, { onConflict: "tenant_id,month" });

    if (error) {
      console.error(`    KPI upsert error: ${error.message}`);
    } else {
      console.log(`    KPI upserted successfully`);
    }
  }

  // ── Parse and insert vendor budgets ──
  const vendorSheet = workbook.Sheets["Digital Vendor & Budget List"];
  if (vendorSheet) {
    const vendors = parseVendorSheet(vendorSheet);
    console.log(`\nVendor budgets found: ${vendors.length}`);
    for (const v of vendors) {
      console.log(`  ${v.vendor_name}: $${v.monthly_budget}/mo (${v.service})`);
    }

    if (vendors.length > 0) {
      const { error } = await supabase
        .from("vendor_budgets")
        .upsert(vendors, { onConflict: "tenant_id,vendor_name" });

      if (error) {
        console.error(`  Vendor upsert error: ${error.message}`);
      } else {
        console.log("  Vendors upserted successfully");
      }
    }
  }

  console.log("\nBackfill complete!");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
