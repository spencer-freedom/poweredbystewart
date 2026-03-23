import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { recomputeKpiForMonth } from "@/lib/kpi";
import { pushLeadToSheet } from "@/lib/sheets-push";

// Server-side Supabase client — uses service key when available
// Uses placeholder URL at build time to avoid crash; real URL is used at runtime
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key"
);

// Allowed tenants — prevents querying arbitrary data
const ALLOWED_TENANTS = new Set(["santa_fe_kia", "kia_santa_fe"]);

function tenantGuard(tenantId: string) {
  if (!ALLOWED_TENANTS.has(tenantId)) {
    return NextResponse.json({ error: "Unauthorized tenant" }, { status: 403 });
  }
  return null;
}

function errorResponse(error: { message: string; code?: string }, status = 500) {
  return NextResponse.json({ error: error.message }, { status });
}

// ─── GET handler ───────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action") || "";
  const tenantId = searchParams.get("tenant") || "santa_fe_kia";
  const month = searchParams.get("month") || "";

  // Tenant guard (skip for actions that list all tenants)
  if (action !== "clients") {
    const guard = tenantGuard(tenantId);
    if (guard) return guard;
  }

  try {
    switch (action) {
      // ── Clients ──────────────────────────────────────────────────
      case "clients": {
        const { data, error } = await supabase
          .from("marketing_clients")
          .select("*");
        if (error) return errorResponse(error);
        return NextResponse.json(data);
      }

      case "client": {
        const { data, error } = await supabase
          .from("marketing_clients")
          .select("*")
          .eq("tenant_id", tenantId)
          .single();
        if (error && error.code !== "PGRST116") return errorResponse(error);
        return NextResponse.json(data);
      }

      // ── Leads ────────────────────────────────────────────────────
      case "leads": {
        const source = searchParams.get("source") || "";
        const segment = searchParams.get("segment") || "";
        const status = searchParams.get("status") || "";
        const leadType = searchParams.get("lead_type") || "";
        const startDate = searchParams.get("start_date") || "";
        const endDate = searchParams.get("end_date") || "";
        const limit = parseInt(searchParams.get("limit") || "200", 10);

        let query = supabase
          .from("leads")
          .select("*")
          .eq("tenant_id", tenantId);
        if (startDate && endDate) {
          query = query.gte("lead_date", startDate).lte("lead_date", endDate);
        } else if (month) {
          query = query.like("lead_date", `${month}%`);
        }
        if (source) query = query.eq("source", source);
        if (segment) query = query.eq("segment", segment);
        if (status) query = query.eq("status", status);
        if (leadType) query = query.eq("lead_type", leadType);
        query = query.order("lead_date", { ascending: false }).limit(limit);

        const { data, error } = await query;
        if (error) return errorResponse(error);
        return NextResponse.json(data);
      }

      // ── KPI ──────────────────────────────────────────────────────
      case "kpi": {
        let query = supabase
          .from("kpi_monthly")
          .select("*")
          .eq("tenant_id", tenantId);
        if (month) {
          query = query.eq("month", month);
          const { data, error } = await query.single();
          if (error && error.code !== "PGRST116") return errorResponse(error);
          return NextResponse.json(data);
        }
        // No month — return latest
        const { data, error } = await query
          .order("month", { ascending: false })
          .limit(1)
          .single();
        if (error && error.code !== "PGRST116") return errorResponse(error);
        return NextResponse.json(data);
      }

      case "kpi_trend": {
        const months = parseInt(searchParams.get("months") || "6", 10);
        const { data, error } = await supabase
          .from("kpi_monthly")
          .select("*")
          .eq("tenant_id", tenantId)
          .order("month", { ascending: false })
          .limit(months);
        if (error) return errorResponse(error);
        return NextResponse.json(data);
      }

      case "months": {
        const { data, error } = await supabase
          .from("kpi_monthly")
          .select("month")
          .eq("tenant_id", tenantId)
          .order("month", { ascending: false });
        if (error) return errorResponse(error);
        return NextResponse.json(data);
      }

      // ── Source Attribution ────────────────────────────────────────
      case "source_attribution": {
        const startMonth = searchParams.get("start_month") || "";
        const endMonth = searchParams.get("end_month") || "";

        // Source attribution is computed from kpi_monthly source_breakdown
        // Fetch all KPI rows for the tenant in range, then aggregate
        let query = supabase
          .from("kpi_monthly")
          .select("month, source_breakdown")
          .eq("tenant_id", tenantId);
        if (startMonth) query = query.gte("month", startMonth);
        if (endMonth) query = query.lte("month", endMonth);

        const { data: kpiRows, error } = await query.order("month", { ascending: false });
        if (error) return errorResponse(error);

        // Also fetch vendor budgets for cost data
        const { data: vendors } = await supabase
          .from("vendor_budgets")
          .select("vendor_name, monthly_budget, coop_amount")
          .eq("tenant_id", tenantId)
          .eq("is_active", 1);

        const budgetBySource: Record<string, number> = {};
        if (vendors) {
          for (const v of vendors) {
            budgetBySource[v.vendor_name.toLowerCase()] =
              (v.monthly_budget || 0) - (v.coop_amount || 0);
          }
        }

        // Aggregate source breakdowns across months
        const agg: Record<string, { leads: number; sold: number }> = {};
        const monthCount = kpiRows?.length || 0;
        for (const row of kpiRows || []) {
          const sb = row.source_breakdown as Record<string, { leads: number; sold: number }> | null;
          if (!sb) continue;
          for (const [src, vals] of Object.entries(sb)) {
            if (!agg[src]) agg[src] = { leads: 0, sold: 0 };
            agg[src].leads += vals.leads || 0;
            agg[src].sold += vals.sold || 0;
          }
        }

        const result = Object.entries(agg).map(([source, vals]) => {
          const budget = (budgetBySource[source.toLowerCase()] || 0) * monthCount;
          return {
            source,
            leads: vals.leads,
            new_leads: 0,
            used_leads: 0,
            cpo_leads: 0,
            sold: vals.sold,
            pct_of_sold: 0,
            budget,
            cost_per_lead: budget > 0 && vals.leads > 0 ? budget / vals.leads : null,
            cost_per_sold: budget > 0 && vals.sold > 0 ? budget / vals.sold : null,
          };
        });

        // Compute pct_of_sold
        const totalSold = result.reduce((s, r) => s + r.sold, 0);
        for (const r of result) {
          r.pct_of_sold = totalSold > 0 ? Math.round((r.sold / totalSold) * 10000) / 100 : 0;
        }

        return NextResponse.json(result);
      }

      // ── Vendors ──────────────────────────────────────────────────
      case "vendors": {
        const { data, error } = await supabase
          .from("vendor_budgets")
          .select("*")
          .eq("tenant_id", tenantId)
          .eq("is_active", true);
        if (error) return errorResponse(error);
        return NextResponse.json(data);
      }

      // ── Lead Sources ─────────────────────────────────────────────
      case "lead_sources": {
        const { data, error } = await supabase
          .from("lead_sources")
          .select("*")
          .eq("tenant_id", tenantId);
        if (error) return errorResponse(error);
        return NextResponse.json(data);
      }

      // ── VinSolutions ─────────────────────────────────────────────
      case "vin_sync_history": {
        const limit = parseInt(searchParams.get("limit") || "20", 10);
        const { data, error, count } = await supabase
          .from("vin_sync_runs")
          .select("*", { count: "exact" })
          .eq("tenant_id", tenantId)
          .order("created_at", { ascending: false })
          .limit(limit);
        if (error) return errorResponse(error);
        return NextResponse.json({ runs: data, count: count || data?.length || 0 });
      }

      case "vin_source_breakdown": {
        let query = supabase
          .from("vin_leads")
          .select("lead_source, id, lead_status_type, response_time_minutes")
          .eq("tenant_id", tenantId);
        if (month) query = query.like("lead_origination_date", `${month}%`);

        const { data: leads, error } = await query;
        if (error) return errorResponse(error);

        const sourceMap: Record<string, {
          leads: number; sold: number; response_sum: number; response_count: number;
        }> = {};
        for (const l of leads || []) {
          const src = l.lead_source || "Unknown";
          if (!sourceMap[src]) {
            sourceMap[src] = { leads: 0, sold: 0, response_sum: 0, response_count: 0 };
          }
          sourceMap[src].leads++;
          if (l.lead_status_type === "Sold") sourceMap[src].sold++;
          if (l.response_time_minutes != null) {
            sourceMap[src].response_sum += l.response_time_minutes;
            sourceMap[src].response_count++;
          }
        }

        const sources = Object.entries(sourceMap).map(([lead_source, v]) => ({
          lead_source,
          leads: v.leads,
          appointments: 0,
          shows: 0,
          sold: v.sold,
          total_gross: null,
          avg_response_min: v.response_count > 0
            ? Math.round(v.response_sum / v.response_count * 10) / 10
            : null,
        }));

        return NextResponse.json({ sources, count: sources.length });
      }

      case "vin_salesperson_breakdown": {
        let query = supabase
          .from("vin_leads")
          .select("sales_rep, id, lead_origination_date, first_customer_contact, lead_status_type, response_time_minutes")
          .eq("tenant_id", tenantId);
        if (month) query = query.like("lead_origination_date", `${month}%`);

        const { data: leads, error } = await query;
        if (error) return errorResponse(error);

        const repMap: Record<string, {
          leads: number; contacted: number; sold: number;
          response_sum: number; response_count: number;
        }> = {};
        for (const l of leads || []) {
          const rep = l.sales_rep || "Unassigned";
          if (!repMap[rep]) {
            repMap[rep] = {
              leads: 0, contacted: 0, sold: 0,
              response_sum: 0, response_count: 0,
            };
          }
          repMap[rep].leads++;
          if (l.first_customer_contact) repMap[rep].contacted++;
          if (l.lead_status_type === "Sold") repMap[rep].sold++;
          if (l.response_time_minutes != null) {
            repMap[rep].response_sum += l.response_time_minutes;
            repMap[rep].response_count++;
          }
        }

        const reps = Object.entries(repMap).map(([sales_rep, v]) => ({
          sales_rep,
          leads: v.leads,
          contacted: v.contacted,
          avg_response_min: v.response_count > 0
            ? Math.round(v.response_sum / v.response_count * 10) / 10
            : null,
          appointments: 0,
          shows: 0,
          sold: v.sold,
          front_gross: null,
          back_gross: null,
          total_gross: null,
          test_drives: 0,
          write_ups: 0,
        }));

        return NextResponse.json({ reps, count: reps.length });
      }

      case "vin_response_times": {
        let query = supabase
          .from("vin_leads")
          .select("lead_source, sales_rep, response_time_minutes")
          .eq("tenant_id", tenantId)
          .not("response_time_minutes", "is", null);
        if (month) query = query.like("lead_origination_date", `${month}%`);

        const { data: leads, error } = await query;
        if (error) return errorResponse(error);

        const all = (leads || []).map((l) => l.response_time_minutes as number);
        const overall = {
          avg_minutes: all.length > 0 ? Math.round(all.reduce((a, b) => a + b, 0) / all.length * 10) / 10 : null,
          min_minutes: all.length > 0 ? Math.min(...all) : null,
          max_minutes: all.length > 0 ? Math.max(...all) : null,
          total_with_response: all.length,
        };

        // By source
        const bySourceMap: Record<string, { sum: number; count: number }> = {};
        for (const l of leads || []) {
          const src = l.lead_source || "Unknown";
          if (!bySourceMap[src]) bySourceMap[src] = { sum: 0, count: 0 };
          bySourceMap[src].sum += l.response_time_minutes as number;
          bySourceMap[src].count++;
        }
        const by_source = Object.entries(bySourceMap).map(([lead_source, v]) => ({
          lead_source,
          avg_minutes: Math.round(v.sum / v.count * 10) / 10,
          count: v.count,
        }));

        // By rep
        const byRepMap: Record<string, { sum: number; count: number }> = {};
        for (const l of leads || []) {
          const rep = l.sales_rep || "Unassigned";
          if (!byRepMap[rep]) byRepMap[rep] = { sum: 0, count: 0 };
          byRepMap[rep].sum += l.response_time_minutes as number;
          byRepMap[rep].count++;
        }
        const by_rep = Object.entries(byRepMap).map(([sales_rep, v]) => ({
          sales_rep,
          avg_minutes: Math.round(v.sum / v.count * 10) / 10,
          count: v.count,
        }));

        return NextResponse.json({ overall, by_source, by_rep });
      }

      case "vin_summary": {
        // Aggregate counts from vin_leads
        const { count: totalLeads } = await supabase
          .from("vin_leads")
          .select("id", { count: "exact", head: true })
          .eq("tenant_id", tenantId);

        const { count: totalAppts } = await supabase
          .from("vin_leads")
          .select("id", { count: "exact", head: true })
          .eq("tenant_id", tenantId)
          .not("first_customer_contact", "is", null);

        const { count: totalCrmSales } = await supabase
          .from("vin_leads")
          .select("id", { count: "exact", head: true })
          .eq("tenant_id", tenantId)
          .eq("lead_status_type", "Sold");

        const { count: totalVisits } = await supabase
          .from("vin_showroom_visits")
          .select("id", { count: "exact", head: true })
          .eq("tenant_id", tenantId);

        // Last sync
        const { data: lastSync } = await supabase
          .from("vin_sync_runs")
          .select("*")
          .eq("tenant_id", tenantId)
          .eq("status", "success")
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        return NextResponse.json({
          total_leads: totalLeads || 0,
          total_appointments: totalAppts || 0,
          total_crm_sales: totalCrmSales || 0,
          total_dms_sales: 0,
          total_showroom_visits: totalVisits || 0,
          total_trade_ins: 0,
          last_sync: lastSync || null,
        });
      }

      // ── Last Sync (freshness check) ─────────────────────────────
      case "last_sync": {
        const { data, error } = await supabase
          .from("vin_sync_runs")
          .select("created_at, status, leads_upserted, visits_upserted, kpi_months_recomputed")
          .eq("tenant_id", tenantId)
          .eq("status", "success")
          .order("created_at", { ascending: false })
          .limit(1)
          .single();
        if (error && error.code !== "PGRST116") return errorResponse(error);
        if (!data) {
          // Fallback: check most recent updated_at across kpi
          const { data: fallback } = await supabase
            .from("kpi_monthly")
            .select("updated_at")
            .eq("tenant_id", tenantId)
            .order("updated_at", { ascending: false })
            .limit(1)
            .single();
          return NextResponse.json({ last_sync: fallback?.updated_at || null });
        }
        return NextResponse.json({ last_sync: data.created_at, ...data });
      }

      // ── Dealership Context ───────────────────────────────────────
      case "dealership_context": {
        // This was a computed endpoint — return data from a summary table
        // or compute on the fly from KPI + vendor data
        const { data: kpi } = await supabase
          .from("kpi_monthly")
          .select("*")
          .eq("tenant_id", tenantId)
          .order("month", { ascending: false })
          .limit(1)
          .single();

        const { data: vendors } = await supabase
          .from("vendor_budgets")
          .select("*")
          .eq("tenant_id", tenantId)
          .eq("is_active", true);

        const totalBudget = (vendors || []).reduce((s, v) => s + ((v.monthly_budget || 0) - (v.coop_amount || 0)), 0);

        const context = {
          tenant_id: tenantId,
          context_text: "",
          context_json: {
            funnel: kpi ? {
              leads: kpi.total_leads,
              sold: kpi.total_sold,
              close_rate: kpi.pct_overall,
            } : {},
            response: { avg_minutes: kpi?.avg_response_time_minutes ?? null },
            budget: {
              total: totalBudget,
              spent: 0,
              utilization_pct: 0,
              days_remaining: 0,
            },
            gross: kpi ? {
              total: kpi.total_total_gross,
              per_deal: kpi.total_sold > 0 && kpi.total_total_gross
                ? Math.round(kpi.total_total_gross / kpi.total_sold)
                : 0,
            } : {},
          },
          token_estimate: 0,
          current_month: kpi?.month || "",
          months_included: kpi ? [kpi.month] : [],
          computed_at: new Date().toISOString(),
          tier1_freshness: null,
          source_freshness: null,
          version: 1,
        };

        return NextResponse.json(context);
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// ─── POST handler ──────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action") || "";
  const tenantId = searchParams.get("tenant") || "santa_fe_kia";

  const guard = tenantGuard(tenantId);
  if (guard) return guard;

  try {
    const body = await req.json().catch(() => ({}));

    switch (action) {
      case "create_lead": {
        const { data, error } = await supabase
          .from("leads")
          .insert({ ...body, tenant_id: tenantId })
          .select()
          .single();
        if (error) return errorResponse(error);
        // Recompute KPI for the affected month
        const createMonth = data.lead_date?.slice(0, 7);
        if (createMonth) {
          await recomputeKpiForMonth(supabase, tenantId, createMonth).catch(console.error);
        }
        // Push to Google Sheet (fire-and-forget)
        void pushLeadToSheet("create", data);
        return NextResponse.json(data);
      }

      case "create_vendor": {
        const trueBudget = (body.monthly_budget || 0) - (body.coop_amount || 0);
        const { data, error } = await supabase
          .from("vendor_budgets")
          .insert({ ...body, tenant_id: tenantId, true_budget: trueBudget, is_active: 1 })
          .select()
          .single();
        if (error) return errorResponse(error);
        return NextResponse.json(data);
      }

      case "create_lead_source": {
        const { data, error } = await supabase
          .from("lead_sources")
          .insert({ ...body, tenant_id: tenantId, is_active: 1 })
          .select()
          .single();
        if (error) return errorResponse(error);
        return NextResponse.json(data);
      }

      case "vin_sync_gmail": {
        // Placeholder — requires edge function or external service
        return NextResponse.json(
          { success: false, error: "Gmail sync requires edge function — not yet migrated" },
          { status: 501 }
        );
      }

      case "vin_upload": {
        // Placeholder — file upload requires edge function
        return NextResponse.json(
          { success: false, error: "VIN file upload requires edge function — not yet migrated" },
          { status: 501 }
        );
      }

      case "compute_summaries": {
        const month = searchParams.get("month") || "";
        // Placeholder — compute summaries was a server-side heavy operation
        // Return basic info from existing KPI data
        const { data: kpi } = await supabase
          .from("kpi_monthly")
          .select("*")
          .eq("tenant_id", tenantId)
          .order("month", { ascending: false })
          .limit(1)
          .single();

        return NextResponse.json({
          tenant_id: tenantId,
          month: month || kpi?.month || "",
          salesperson_rows: 0,
          source_rows: 0,
          health_score: null,
          token_estimate: null,
          version: null,
        });
      }

      default:
        return NextResponse.json({ error: `Unknown POST action: ${action}` }, { status: 400 });
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// ─── PATCH handler ─────────────────────────────────────────────────────────

export async function PATCH(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action") || "";
  const tenantId = searchParams.get("tenant") || "santa_fe_kia";
  const id = searchParams.get("id") || "";

  const guard = tenantGuard(tenantId);
  if (guard) return guard;

  if (!id) {
    return NextResponse.json({ error: "Missing id parameter" }, { status: 400 });
  }

  try {
    const body = await req.json().catch(() => ({}));

    switch (action) {
      case "update_lead": {
        const { data, error } = await supabase
          .from("leads")
          .update(body)
          .eq("id", parseInt(id, 10))
          .eq("tenant_id", tenantId)
          .select()
          .single();
        if (error) return errorResponse(error);
        // Recompute KPI for the affected month
        const updateMonth = data.lead_date?.slice(0, 7);
        if (updateMonth) {
          await recomputeKpiForMonth(supabase, tenantId, updateMonth).catch(console.error);
        }
        // Push to Google Sheet (fire-and-forget)
        void pushLeadToSheet("update", data);
        return NextResponse.json(data);
      }

      case "update_vendor": {
        // Recalculate true_budget if budget fields are being updated
        const updates = { ...body };
        if (updates.monthly_budget !== undefined || updates.coop_amount !== undefined) {
          // Fetch current values if not all provided
          if (updates.monthly_budget === undefined || updates.coop_amount === undefined) {
            const { data: current } = await supabase
              .from("vendor_budgets")
              .select("monthly_budget, coop_amount")
              .eq("id", parseInt(id, 10))
              .single();
            if (current) {
              updates.true_budget =
                (updates.monthly_budget ?? current.monthly_budget ?? 0) -
                (updates.coop_amount ?? current.coop_amount ?? 0);
            }
          } else {
            updates.true_budget = (updates.monthly_budget || 0) - (updates.coop_amount || 0);
          }
        }

        const { data, error } = await supabase
          .from("vendor_budgets")
          .update(updates)
          .eq("id", parseInt(id, 10))
          .eq("tenant_id", tenantId)
          .select()
          .single();
        if (error) return errorResponse(error);
        return NextResponse.json(data);
      }

      default:
        return NextResponse.json({ error: `Unknown PATCH action: ${action}` }, { status: 400 });
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// ─── DELETE handler ────────────────────────────────────────────────────────

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action") || "";
  const tenantId = searchParams.get("tenant") || "santa_fe_kia";
  const id = searchParams.get("id") || "";

  const guard = tenantGuard(tenantId);
  if (guard) return guard;

  if (!id) {
    return NextResponse.json({ error: "Missing id parameter" }, { status: 400 });
  }

  try {
    switch (action) {
      case "delete_lead": {
        // Fetch lead before deleting (need month for KPI recompute + sheet push)
        const { data: leadToDelete } = await supabase
          .from("leads")
          .select("lead_date, customer_name")
          .eq("id", parseInt(id, 10))
          .eq("tenant_id", tenantId)
          .single();
        const { error } = await supabase
          .from("leads")
          .delete()
          .eq("id", parseInt(id, 10))
          .eq("tenant_id", tenantId);
        if (error) return errorResponse(error);
        // Recompute KPI for the affected month
        if (leadToDelete?.lead_date) {
          const delMonth = leadToDelete.lead_date.slice(0, 7);
          await recomputeKpiForMonth(supabase, tenantId, delMonth).catch(console.error);
          void pushLeadToSheet("delete", leadToDelete);
        }
        return NextResponse.json({ success: true });
      }

      case "delete_vendor": {
        const { error } = await supabase
          .from("vendor_budgets")
          .delete()
          .eq("id", parseInt(id, 10))
          .eq("tenant_id", tenantId);
        if (error) return errorResponse(error);
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: `Unknown DELETE action: ${action}` }, { status: 400 });
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
