import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { computeKpi, type KpiLeadRow } from "@/lib/kpi";

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

// ─── KPI Computation from leads (shared module) ──────────────────────────

type LeadRow = KpiLeadRow;

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
