import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key"
);

const ALLOWED_TENANTS = new Set(["santa_fe_kia", "kia_santa_fe"]);

// ─── API Key auth for Apps Script ─────────────────────────────────────────

function checkApiKey(req: NextRequest): boolean {
  const key = req.headers.get("x-api-key") || "";
  const expected = process.env.SHEETS_SYNC_API_KEY || "";
  if (!expected) return false;
  return key === expected;
}

// ─── KPI Computation from leads ───────────────────────────────────────────

interface LeadRow {
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
  lead_type?: string;
}

function computeKpi(leads: LeadRow[], tenantId: string, month: string) {
  const ml = leads.filter((l) => l.lead_date.startsWith(month));

  const count = (fn: (l: LeadRow) => boolean) => ml.filter(fn).length;
  const pct = (num: number, den: number) => den > 0 ? Math.round((num / den) * 1000) / 10 : 0;

  const total_leads = ml.length;
  const new_leads = count((l) => l.segment === "new");
  const used_leads = count((l) => l.segment === "used");
  const cpo_leads = count((l) => l.segment === "cpo");

  const total_appts = count((l) => l.appt === 1);
  const new_appts = count((l) => l.segment === "new" && l.appt === 1);
  const used_appts = count((l) => l.segment === "used" && l.appt === 1);
  const cpo_appts = count((l) => l.segment === "cpo" && l.appt === 1);

  const total_shows = count((l) => l.show === 1);
  const new_shows = count((l) => l.segment === "new" && l.show === 1);
  const used_shows = count((l) => l.segment === "used" && l.show === 1);
  const cpo_shows = count((l) => l.segment === "cpo" && l.show === 1);

  const total_sold = count((l) => l.status === "sold");
  const new_sold = count((l) => l.segment === "new" && l.status === "sold");
  const used_sold = count((l) => l.segment === "used" && l.status === "sold");
  const cpo_sold = count((l) => l.segment === "cpo" && l.status === "sold");

  const total_turns = count((l) => l.turn_over === 1);
  const total_contacted = count((l) => {
    const pa = (l.past_actions || "").toLowerCase();
    return pa.includes("contacted") || pa.includes("conacted");
  });

  // Source breakdown
  const source_breakdown: Record<string, { leads: number; sold: number }> = {};
  for (const l of ml) {
    const src = l.source || "Unknown";
    if (!source_breakdown[src]) source_breakdown[src] = { leads: 0, sold: 0 };
    source_breakdown[src].leads++;
    if (l.status === "sold") source_breakdown[src].sold++;
  }

  // Salesperson breakdown
  const salesperson_breakdown: Record<string, { leads: number; sold: number }> = {};
  for (const l of ml) {
    if (l.to_salesperson) {
      const rep = l.to_salesperson;
      if (!salesperson_breakdown[rep]) salesperson_breakdown[rep] = { leads: 0, sold: 0 };
      salesperson_breakdown[rep].leads++;
      if (l.status === "sold") salesperson_breakdown[rep].sold++;
    }
  }

  return {
    tenant_id: tenantId,
    month,
    total_leads,
    total_contacted,
    total_appts,
    total_shows,
    total_sold,
    total_turns,
    new_leads, new_appts, new_shows, new_sold,
    used_leads, used_appts, used_shows, used_sold,
    cpo_leads, cpo_appts, cpo_shows, cpo_sold,
    appt_showed: total_shows,
    new_appt_showed: new_shows,
    used_appt_showed: used_shows,
    cpo_appt_showed: cpo_shows,
    walk_ins: 0,
    sold_from_appt: 0,
    sold_from_walkin: 0,
    pct_contacted: pct(total_contacted, total_leads),
    pct_appt_set: pct(total_appts, total_leads),
    pct_show_set: pct(total_shows, total_appts),
    pct_show_sold: pct(total_sold, total_shows),
    pct_overall: pct(total_sold, total_leads),
    source_breakdown,
    salesperson_breakdown,
  };
}

// ─── POST handler ─────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // Auth check
  if (!checkApiKey(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const tenantId = body.tenant_id || "santa_fe_kia";
    const leads: LeadRow[] = body.leads || [];
    const recomputeKpi = body.recompute_kpi !== false;

    if (!ALLOWED_TENANTS.has(tenantId)) {
      return NextResponse.json({ error: "Unauthorized tenant" }, { status: 403 });
    }

    if (!leads.length) {
      return NextResponse.json({ error: "No leads provided" }, { status: 400 });
    }

    // Tag each lead with tenant_id and default lead_type to internet
    const taggedLeads = leads.map((l) => ({ ...l, tenant_id: tenantId, lead_type: l.lead_type || "internet" }));

    // Upsert leads in batches
    let inserted = 0;
    let updated = 0;
    let errors = 0;
    const BATCH = 50;

    for (let i = 0; i < taggedLeads.length; i += BATCH) {
      const batch = taggedLeads.slice(i, i + BATCH);

      // Try upsert (requires unique constraint on tenant_id, lead_date, customer_name)
      const { data, error } = await supabase
        .from("leads")
        .upsert(batch, {
          onConflict: "tenant_id,lead_date,customer_name",
          ignoreDuplicates: false,
        })
        .select("id");

      if (error) {
        // Fallback: one by one
        for (const lead of batch) {
          // Check if exists
          const { data: existing } = await supabase
            .from("leads")
            .select("id")
            .eq("tenant_id", tenantId)
            .eq("lead_date", lead.lead_date)
            .eq("customer_name", lead.customer_name)
            .limit(1)
            .single();

          if (existing) {
            const { error: upErr } = await supabase
              .from("leads")
              .update(lead)
              .eq("id", existing.id);
            if (upErr) errors++;
            else updated++;
          } else {
            const { error: insErr } = await supabase
              .from("leads")
              .insert(lead);
            if (insErr) errors++;
            else inserted++;
          }
        }
      } else {
        inserted += data?.length || batch.length;
      }
    }

    // Recompute KPI for affected months
    let kpiMonths: string[] = [];
    if (recomputeKpi) {
      const months = [...new Set(leads.map((l) => l.lead_date?.slice(0, 7)).filter(Boolean))];
      kpiMonths = months;

      for (const month of months) {
        // Fetch ALL leads for this month from DB (not just the ones we just synced)
        const { data: allLeads } = await supabase
          .from("leads")
          .select("*")
          .eq("tenant_id", tenantId)
          .like("lead_date", `${month}%`);

        if (allLeads && allLeads.length > 0) {
          const kpi = computeKpi(allLeads as LeadRow[], tenantId, month);
          await supabase
            .from("kpi_monthly")
            .upsert(kpi, { onConflict: "tenant_id,month" });
        }
      }
    }

    return NextResponse.json({
      success: true,
      inserted,
      updated,
      errors,
      total: leads.length,
      kpi_months_recomputed: kpiMonths,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
