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

// Paginate around Supabase's 1,000-row default cap. Caller passes a factory
// that builds a fresh query each page (query builders are single-use once awaited).
async function fetchAllRows<T>(
  buildQuery: () => { range: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string; code?: string } | null }> },
  batchSize = 1000,
): Promise<{ data: T[]; error: { message: string; code?: string } | null }> {
  const all: T[] = [];
  let offset = 0;
  while (true) {
    const { data, error } = await buildQuery().range(offset, offset + batchSize - 1);
    if (error) return { data: all, error };
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < batchSize) break;
    offset += batchSize;
  }
  return { data: all, error: null };
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
        // Always exclude service/Dealertrack leads unless explicitly requested
        if (!leadType) query = query.neq("lead_type", "service");
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

      // ── Lead Dedup: Summary ──────────────────────────────────────
      case "dedup_summary": {
        const startDate = searchParams.get("start_date") || "";
        const endDate = searchParams.get("end_date") || "";

        const buildQuery = () => {
          let q = supabase
            .from("vin_leads")
            .select("customer, lead_origination_date, lead_source, lead_id")
            .eq("tenant_id", tenantId)
            .not("customer", "in", '("","Name","Wireless")')
            .neq("lead_source_type", "Service");
          if (startDate) q = q.gte("lead_origination_date", startDate);
          if (endDate) q = q.lte("lead_origination_date", endDate + " 23:59:59");
          return q;
        };

        const { data: leads, error } = await fetchAllRows<{ customer: string; lead_origination_date: string; lead_source: string; lead_id: string }>(buildQuery);
        if (error) return errorResponse(error);
        if (!leads.length) return NextResponse.json({ total_leads: 0, unique_customers: 0, windows: {} });

        const uniqueCustomers = new Set(leads.map((l) => l.customer));

        // Compute clusters for both windows
        const windows: Record<string, object> = {};
        for (const [label, windowDays] of [["7d", 7], ["30d", 30]] as const) {
          const windowMs = windowDays * 86400000;
          let sameSourceSpam = 0;
          let allClusters = 0;

          // Group by customer
          const byCustomer: Record<string, typeof leads> = {};
          for (const l of leads) {
            (byCustomer[l.customer] ||= []).push(l);
          }

          for (const custLeads of Object.values(byCustomer)) {
            if (custLeads.length < 2) continue;
            custLeads.sort((a, b) => a.lead_origination_date.localeCompare(b.lead_origination_date));

            for (let i = 1; i < custLeads.length; i++) {
              const curr = new Date(custLeads[i].lead_origination_date).getTime();
              // Check if any earlier lead is within the window
              for (let j = 0; j < i; j++) {
                const prev = new Date(custLeads[j].lead_origination_date).getTime();
                if (Math.abs(curr - prev) < windowMs) {
                  allClusters++;
                  if (custLeads[i].lead_source === custLeads[j].lead_source) {
                    sameSourceSpam++;
                  }
                  break; // Count each lead as clustered at most once
                }
              }
            }
          }

          windows[label] = {
            window_days: windowDays,
            same_source_spam: sameSourceSpam,
            all_clusters: allClusters,
            multi_channel: allClusters - sameSourceSpam,
            clean_leads: leads.length - allClusters,
            spam_pct: leads.length > 0 ? Math.round(sameSourceSpam * 1000 / leads.length) / 10 : 0,
            cluster_pct: leads.length > 0 ? Math.round(allClusters * 1000 / leads.length) / 10 : 0,
          };
        }

        return NextResponse.json({
          total_leads: leads.length,
          unique_customers: uniqueCustomers.size,
          windows,
        });
      }

      // ── Lead Dedup: Spam Sources ───────────────────────────────────
      case "dedup_spam_sources": {
        const startDate = searchParams.get("start_date") || "";
        const endDate = searchParams.get("end_date") || "";
        const windowDays = parseInt(searchParams.get("window_days") || "7");
        const windowMs = windowDays * 86400000;

        const buildQuery = () => {
          let q = supabase
            .from("vin_leads")
            .select("customer, lead_origination_date, lead_source")
            .eq("tenant_id", tenantId)
            .not("customer", "in", '("","Name","Wireless")')
            .neq("lead_source_type", "Service");
          if (startDate) q = q.gte("lead_origination_date", startDate);
          if (endDate) q = q.lte("lead_origination_date", endDate + " 23:59:59");
          return q;
        };

        const { data: leads, error } = await fetchAllRows<{ customer: string; lead_origination_date: string; lead_source: string }>(buildQuery);
        if (error) return errorResponse(error);

        // Group by customer+source, find same-source repeats within window
        const spamMap: Record<string, { excess: number; customers: Set<string> }> = {};
        const byCustomer: Record<string, typeof leads> = {};
        for (const l of leads) {
          (byCustomer[l.customer] ||= []).push(l);
        }

        for (const custLeads of Object.values(byCustomer)) {
          if (custLeads.length < 2) continue;
          custLeads.sort((a, b) => a.lead_origination_date.localeCompare(b.lead_origination_date));

          for (let i = 1; i < custLeads.length; i++) {
            const curr = new Date(custLeads[i].lead_origination_date).getTime();
            for (let j = 0; j < i; j++) {
              const prev = new Date(custLeads[j].lead_origination_date).getTime();
              if (custLeads[i].lead_source === custLeads[j].lead_source && Math.abs(curr - prev) < windowMs) {
                const src = custLeads[i].lead_source;
                if (!spamMap[src]) spamMap[src] = { excess: 0, customers: new Set() };
                spamMap[src].excess++;
                spamMap[src].customers.add(custLeads[i].customer);
                break;
              }
            }
          }
        }

        const sources = Object.entries(spamMap)
          .map(([source, v]) => ({ source, excess_leads: v.excess, affected_customers: v.customers.size }))
          .sort((a, b) => b.excess_leads - a.excess_leads);

        return NextResponse.json({ window_days: windowDays, sources });
      }

      // ── Lead Dedup: Source ROI ─────────────────────────────────────
      case "dedup_source_roi": {
        const startDate = searchParams.get("start_date") || "";
        const endDate = searchParams.get("end_date") || "";

        const buildQuery = () => {
          let q = supabase
            .from("vin_leads")
            .select("customer, lead_source, lead_status_type, lead_origination_date")
            .eq("tenant_id", tenantId)
            .not("customer", "in", '("","Name","Wireless")')
            .neq("lead_source_type", "Service");
          if (startDate) q = q.gte("lead_origination_date", startDate);
          if (endDate) q = q.lte("lead_origination_date", endDate + " 23:59:59");
          return q;
        };

        const { data: leads, error } = await fetchAllRows<{ customer: string; lead_source: string; lead_status_type: string | null; lead_origination_date: string }>(buildQuery);
        if (error) return errorResponse(error);

        const SOLD = new Set(["Sold", "Sold Delivered", "Delivered"]);

        // Source performance
        const srcMap: Record<string, { total: number; customers: Set<string>; sold: Set<string> }> = {};
        for (const l of leads) {
          const src = l.lead_source || "Unknown";
          if (!srcMap[src]) srcMap[src] = { total: 0, customers: new Set(), sold: new Set() };
          srcMap[src].total++;
          srcMap[src].customers.add(l.customer);
          if (SOLD.has(l.lead_status_type || "")) srcMap[src].sold.add(l.customer);
        }

        const sources = Object.entries(srcMap)
          .map(([source, v]) => ({
            source,
            total_leads: v.total,
            unique_customers: v.customers.size,
            excess_leads: v.total - v.customers.size,
            noise_pct: v.total > 0 ? Math.round((v.total - v.customers.size) * 1000 / v.total) / 10 : 0,
            sold: v.sold.size,
            unique_sold: v.sold.size,
            conversion_pct: v.customers.size > 0 ? Math.round(v.sold.size * 1000 / v.customers.size) / 10 : 0,
          }))
          .sort((a, b) => b.total_leads - a.total_leads);

        // First-touch attribution
        const byCustomer: Record<string, typeof leads> = {};
        for (const l of leads) {
          (byCustomer[l.customer] ||= []).push(l);
        }
        const firstTouchMap: Record<string, number> = {};
        const journeyMap: Record<string, number> = {};
        for (const custLeads of Object.values(byCustomer)) {
          custLeads.sort((a, b) => a.lead_origination_date.localeCompare(b.lead_origination_date));
          const first = custLeads[0].lead_source;
          const last = custLeads[custLeads.length - 1].lead_source;
          firstTouchMap[first] = (firstTouchMap[first] || 0) + 1;
          // Only track journeys for sold customers
          if (custLeads.some((l) => SOLD.has(l.lead_status_type || ""))) {
            const key = `${first}|||${last}`;
            journeyMap[key] = (journeyMap[key] || 0) + 1;
          }
        }

        const first_touch_attribution = Object.entries(firstTouchMap)
          .map(([source, first_touches]) => ({ source, first_touches }))
          .sort((a, b) => b.first_touches - a.first_touches)
          .slice(0, 20);

        const journeys = Object.entries(journeyMap)
          .map(([key, conversions]) => {
            const [first_source, last_source] = key.split("|||");
            return { first_source, last_source, conversions };
          })
          .sort((a, b) => b.conversions - a.conversions)
          .slice(0, 20);

        return NextResponse.json({ sources, journeys, first_touch_attribution });
      }

      // ── Lead Dedup: Customer Clusters ──────────────────────────────
      case "dedup_customers": {
        const startDate = searchParams.get("start_date") || "";
        const endDate = searchParams.get("end_date") || "";
        const windowDays = parseInt(searchParams.get("window_days") || "7");
        const windowMs = windowDays * 86400000;
        const limit = parseInt(searchParams.get("limit") || "30");

        const buildQuery = () => {
          let q = supabase
            .from("vin_leads")
            .select("customer, lead_id, lead_origination_date, lead_source, lead_source_type, sales_rep, lead_status_type, year, make, model")
            .eq("tenant_id", tenantId)
            .not("customer", "in", '("","Name","Wireless")')
            .neq("lead_source_type", "Service")
            .order("lead_origination_date", { ascending: false });
          if (startDate) q = q.gte("lead_origination_date", startDate);
          if (endDate) q = q.lte("lead_origination_date", endDate + " 23:59:59");
          return q;
        };

        const { data: leads, error } = await fetchAllRows<{ customer: string; lead_id: string; lead_origination_date: string; lead_source: string; lead_source_type: string | null; sales_rep: string | null; lead_status_type: string | null; year: string | null; make: string | null; model: string | null }>(buildQuery);
        if (error) return errorResponse(error);

        // Group by customer
        const byCustomer: Record<string, typeof leads> = {};
        for (const l of leads) {
          (byCustomer[l.customer] ||= []).push(l);
        }

        // Find customers with clusters
        const clustered: { customer: string; leads: typeof leads; clusterCount: number }[] = [];
        for (const [customer, custLeads] of Object.entries(byCustomer)) {
          if (custLeads.length < 2) continue;
          custLeads.sort((a, b) => b.lead_origination_date.localeCompare(a.lead_origination_date));

          let clusterCount = 0;
          for (let i = 1; i < custLeads.length; i++) {
            const curr = new Date(custLeads[i].lead_origination_date).getTime();
            for (let j = 0; j < i; j++) {
              const prev = new Date(custLeads[j].lead_origination_date).getTime();
              if (Math.abs(curr - prev) < windowMs) { clusterCount++; break; }
            }
          }
          if (clusterCount > 0) {
            clustered.push({ customer, leads: custLeads, clusterCount });
          }
        }

        clustered.sort((a, b) => b.leads.length - a.leads.length);

        const customers = clustered.slice(0, limit).map((c) => {
          const seenSources: Record<string, string> = {};
          const timeline = c.leads.map((l) => {
            const src = l.lead_source;
            const dt = l.lead_origination_date;
            let dupe_type = "unique";
            if (seenSources[src]) {
              const prev = new Date(seenSources[src]).getTime();
              const curr = new Date(dt).getTime();
              dupe_type = Math.abs(curr - prev) / 86400000 <= windowDays ? "same_source_spam" : "re_engagement";
            } else if (Object.keys(seenSources).length > 0) {
              dupe_type = "multi_channel";
            }
            seenSources[src] = dt;
            return {
              lead_id: l.lead_id,
              date: dt,
              source: src,
              source_type: l.lead_source_type,
              sales_rep: l.sales_rep,
              status: l.lead_status_type,
              vehicle: [l.year, l.make, l.model].filter(Boolean).join(" "),
              dupe_type,
            };
          });

          const sources = new Set(c.leads.map((l) => l.lead_source));
          return {
            customer: c.customer,
            lead_count: c.leads.length,
            source_count: sources.size,
            first_lead: c.leads[c.leads.length - 1].lead_origination_date,
            last_lead: c.leads[0].lead_origination_date,
            timeline,
          };
        });

        return NextResponse.json({ window_days: windowDays, customers });
      }

      // ── Lead Dedup: Clean View ─────────────────────────────────────
      case "dedup_clean": {
        const startDate = searchParams.get("start_date") || "";
        const endDate = searchParams.get("end_date") || "";
        const limit = parseInt(searchParams.get("limit") || "200");

        const buildQuery = () => {
          let q = supabase
            .from("vin_leads")
            .select("customer, lead_id, lead_origination_date, lead_source, lead_source_type, sales_rep, lead_status_type, year, make, model")
            .eq("tenant_id", tenantId)
            .not("customer", "in", '("","Name","Wireless")')
            .neq("lead_source_type", "Service")
            .order("lead_origination_date", { ascending: false });
          if (startDate) q = q.gte("lead_origination_date", startDate);
          if (endDate) q = q.lte("lead_origination_date", endDate + " 23:59:59");
          return q;
        };

        type CleanLead = { customer: string; lead_id: string; lead_origination_date: string; lead_source: string; lead_source_type: string | null; sales_rep: string | null; lead_status_type: string | null; year: string | null; make: string | null; model: string | null };
        const { data: leads, error } = await fetchAllRows<CleanLead>(buildQuery);
        if (error) return errorResponse(error);

        // One row per customer — most recent lead wins
        const seen = new Map<string, { lead: CleanLead; total: number; sources: Set<string> }>();
        for (const l of leads) {
          const existing = seen.get(l.customer);
          if (!existing) {
            seen.set(l.customer, { lead: l, total: 1, sources: new Set([l.lead_source]) });
          } else {
            existing.total++;
            existing.sources.add(l.lead_source);
          }
        }

        const clean = Array.from(seen.values())
          .sort((a, b) => b.lead.lead_origination_date.localeCompare(a.lead.lead_origination_date))
          .slice(0, limit)
          .map((v) => ({
            customer: v.lead.customer,
            lead_id: v.lead.lead_id,
            date: v.lead.lead_origination_date,
            source: v.lead.lead_source,
            source_type: v.lead.lead_source_type,
            sales_rep: v.lead.sales_rep,
            status: v.lead.lead_status_type,
            vehicle: [v.lead.year, v.lead.make, v.lead.model].filter(Boolean).join(" "),
            total_leads: v.total,
            source_count: v.sources.size,
          }));

        return NextResponse.json({ count: clean.length, leads: clean });
      }

      // ── Lead Dedup: Customer Behavior / Time-Gap Histogram ─────────
      case "dedup_time_gaps": {
        const startDate = searchParams.get("start_date") || "";
        const endDate = searchParams.get("end_date") || "";

        const buildQuery = () => {
          let q = supabase
            .from("vin_leads")
            .select("customer, lead_origination_date, lead_source, lead_status_type")
            .eq("tenant_id", tenantId)
            .not("customer", "in", '("","Name","Wireless")')
            .neq("lead_source_type", "Service");
          if (startDate) q = q.gte("lead_origination_date", startDate);
          if (endDate) q = q.lte("lead_origination_date", endDate + " 23:59:59");
          return q;
        };

        const { data: leads, error } = await fetchAllRows<{ customer: string; lead_origination_date: string; lead_source: string; lead_status_type: string | null }>(buildQuery);
        if (error) return errorResponse(error);

        const buckets = [
          { key: "lt_1h",     label: "Under 1 hour",      floorHours: 0,     ceilHours: 1 },
          { key: "1_6h",      label: "1–6 hours",         floorHours: 1,     ceilHours: 6 },
          { key: "6_24h",     label: "6–24 hours",        floorHours: 6,     ceilHours: 24 },
          { key: "1_3d",      label: "1–3 days",          floorHours: 24,    ceilHours: 72 },
          { key: "3_7d",      label: "3–7 days",          floorHours: 72,    ceilHours: 168 },
          { key: "7_14d",     label: "7–14 days",         floorHours: 168,   ceilHours: 336 },
          { key: "14_30d",    label: "14–30 days",        floorHours: 336,   ceilHours: 720 },
          { key: "30_90d",    label: "30–90 days",        floorHours: 720,   ceilHours: 2160 },
          { key: "90_180d",   label: "90–180 days",       floorHours: 2160,  ceilHours: 4320 },
          { key: "gt_180d",   label: "180+ days",         floorHours: 4320,  ceilHours: Infinity },
        ];

        const bucketStats = buckets.map((b) => ({
          ...b,
          gap_count: 0,
          customers: new Set<string>(),
          same_source_count: 0,
        }));

        // Group by customer
        const byCustomer: Record<string, typeof leads> = {};
        for (const l of leads) {
          (byCustomer[l.customer] ||= []).push(l);
        }

        let totalGaps = 0;
        let customersWithGaps = 0;
        const uniqueCustomers = Object.keys(byCustomer).length;

        // Leads-per-customer distribution (+ intent proxy via sold conversion)
        const SOLD = new Set(["Sold", "Sold Delivered", "Delivered"]);
        const leadCountBins = [
          { key: "1",      label: "1 lead",       min: 1,  max: 1 },
          { key: "2",      label: "2 leads",      min: 2,  max: 2 },
          { key: "3",      label: "3 leads",      min: 3,  max: 3 },
          { key: "4",      label: "4 leads",      min: 4,  max: 4 },
          { key: "5",      label: "5 leads",      min: 5,  max: 5 },
          { key: "6_10",   label: "6–10 leads",   min: 6,  max: 10 },
          { key: "11_20",  label: "11–20 leads",  min: 11, max: 20 },
          { key: "21plus", label: "21+ leads",    min: 21, max: Infinity },
        ];
        const leadCountDist = leadCountBins.map((b) => ({ ...b, customer_count: 0, sold_count: 0 }));

        for (const custLeads of Object.values(byCustomer)) {
          const n = custLeads.length;
          const wasSold = custLeads.some((l) => SOLD.has(l.lead_status_type || ""));
          for (const b of leadCountDist) {
            if (n >= b.min && n <= b.max) {
              b.customer_count++;
              if (wasSold) b.sold_count++;
              break;
            }
          }
          if (n < 2) continue;
          customersWithGaps++;
          custLeads.sort((a, b) => a.lead_origination_date.localeCompare(b.lead_origination_date));

          for (let i = 1; i < custLeads.length; i++) {
            const gapMs = new Date(custLeads[i].lead_origination_date).getTime() - new Date(custLeads[i - 1].lead_origination_date).getTime();
            const gapHours = gapMs / 3600000;
            const sameSource = custLeads[i].lead_source === custLeads[i - 1].lead_source;

            for (const b of bucketStats) {
              if (gapHours >= b.floorHours && gapHours < b.ceilHours) {
                b.gap_count++;
                b.customers.add(custLeads[i].customer);
                if (sameSource) b.same_source_count++;
                totalGaps++;
                break;
              }
            }
          }
        }

        const histogram = bucketStats.map((b) => ({
          key: b.key,
          label: b.label,
          gap_count: b.gap_count,
          affected_customers: b.customers.size,
          same_source_count: b.same_source_count,
          multi_channel_count: b.gap_count - b.same_source_count,
          pct_of_gaps: totalGaps > 0 ? Math.round((b.gap_count / totalGaps) * 1000) / 10 : 0,
        }));

        const leads_per_customer = leadCountDist.map((b) => ({
          key: b.key,
          label: b.label,
          min: b.min,
          max: b.max === Infinity ? null : b.max,
          customer_count: b.customer_count,
          sold_count: b.sold_count,
          pct_of_customers: uniqueCustomers > 0 ? Math.round((b.customer_count / uniqueCustomers) * 1000) / 10 : 0,
          sold_pct: b.customer_count > 0 ? Math.round((b.sold_count / b.customer_count) * 1000) / 10 : 0,
        }));

        return NextResponse.json({
          total_leads: leads.length,
          unique_customers: uniqueCustomers,
          customers_with_repeats: customersWithGaps,
          total_gaps: totalGaps,
          histogram,
          leads_per_customer,
        });
      }

      // ── Lead Dedup: Action Window — first-hour intensity and outcome ───
      case "dedup_action_window": {
        const startDate = searchParams.get("start_date") || "";
        const endDate = searchParams.get("end_date") || "";

        const buildQuery = () => {
          let q = supabase
            .from("vin_leads")
            .select("customer, lead_origination_date, lead_source, lead_status_type")
            .eq("tenant_id", tenantId)
            .not("customer", "in", '("","Name","Wireless")')
            .neq("lead_source_type", "Service");
          if (startDate) q = q.gte("lead_origination_date", startDate);
          if (endDate) q = q.lte("lead_origination_date", endDate + " 23:59:59");
          return q;
        };

        const { data: leads, error } = await fetchAllRows<{ customer: string; lead_origination_date: string; lead_source: string; lead_status_type: string | null }>(buildQuery);
        if (error) return errorResponse(error);

        const SOLD = new Set(["Sold", "Sold Delivered", "Delivered"]);
        const HOUR = 3600000;

        // Group by customer, compute per-customer profile
        const byCustomer: Record<string, typeof leads> = {};
        for (const l of leads) (byCustomer[l.customer] ||= []).push(l);

        interface Profile {
          firstHourLeads: number;
          firstHourSources: Set<string>;
          sold: boolean;
          hoursToSale: number | null;
          returnedAfterSession: "no" | "0_24h" | "1_3d" | "3_7d" | "7_30d" | "30d_plus";
        }
        const profiles: Profile[] = [];

        for (const custLeads of Object.values(byCustomer)) {
          custLeads.sort((a, b) => a.lead_origination_date.localeCompare(b.lead_origination_date));
          const firstTs = new Date(custLeads[0].lead_origination_date).getTime();

          // Session = leads within 1 hour of the first lead
          const session = custLeads.filter((l) => new Date(l.lead_origination_date).getTime() - firstTs < HOUR);
          const sessionEnd = new Date(session[session.length - 1].lead_origination_date).getTime();
          const postSession = custLeads.slice(session.length);

          const sold = custLeads.some((l) => SOLD.has(l.lead_status_type || ""));
          let hoursToSale: number | null = null;
          if (sold) {
            const firstSold = custLeads.find((l) => SOLD.has(l.lead_status_type || ""));
            if (firstSold) {
              hoursToSale = (new Date(firstSold.lead_origination_date).getTime() - firstTs) / HOUR;
            }
          }

          let returned: Profile["returnedAfterSession"] = "no";
          if (postSession.length > 0) {
            const gapHours = (new Date(postSession[0].lead_origination_date).getTime() - sessionEnd) / HOUR;
            if (gapHours < 24) returned = "0_24h";
            else if (gapHours < 72) returned = "1_3d";
            else if (gapHours < 168) returned = "3_7d";
            else if (gapHours < 720) returned = "7_30d";
            else returned = "30d_plus";
          }

          profiles.push({
            firstHourLeads: session.length,
            firstHourSources: new Set(session.map((l) => l.lead_source)),
            sold,
            hoursToSale,
            returnedAfterSession: returned,
          });
        }

        // Intensity buckets
        const intensityBins = [
          { key: "1",   label: "1 lead",        min: 1, max: 1 },
          { key: "2",   label: "2 leads",       min: 2, max: 2 },
          { key: "3",   label: "3 leads",       min: 3, max: 3 },
          { key: "4",   label: "4 leads",       min: 4, max: 4 },
          { key: "5p",  label: "5+ leads",      min: 5, max: Infinity },
        ];
        const intensity = intensityBins.map((b) => {
          const matched = profiles.filter((p) => p.firstHourLeads >= b.min && p.firstHourLeads <= b.max);
          const sold = matched.filter((p) => p.sold).length;
          const soldTimes = matched.map((p) => p.hoursToSale).filter((h): h is number => h !== null);
          const multiSource = matched.filter((p) => p.firstHourSources.size >= 2).length;
          return {
            key: b.key,
            label: b.label,
            customer_count: matched.length,
            sold_count: sold,
            sold_pct: matched.length > 0 ? Math.round((sold / matched.length) * 1000) / 10 : 0,
            multi_source_count: multiSource,
            multi_source_pct: matched.length > 0 ? Math.round((multiSource / matched.length) * 1000) / 10 : 0,
            avg_hours_to_sale: soldTimes.length > 0 ? Math.round((soldTimes.reduce((a, b) => a + b, 0) / soldTimes.length) * 10) / 10 : null,
          };
        });

        // Dropout fate — unsold customers only
        const unsold = profiles.filter((p) => !p.sold);
        const dropoutBins = [
          { key: "no",       label: "Never returned" },
          { key: "0_24h",    label: "Returned within 24h" },
          { key: "1_3d",     label: "Returned 1–3 days later" },
          { key: "3_7d",     label: "Returned 3–7 days later" },
          { key: "7_30d",    label: "Returned 7–30 days later" },
          { key: "30d_plus", label: "Returned 30+ days later" },
        ];
        const dropout = dropoutBins.map((b) => {
          const count = unsold.filter((p) => p.returnedAfterSession === b.key).length;
          return {
            key: b.key,
            label: b.label,
            count,
            pct: unsold.length > 0 ? Math.round((count / unsold.length) * 1000) / 10 : 0,
          };
        });

        // Baseline conversion across everyone
        const baselineSold = profiles.filter((p) => p.sold).length;
        const baselineSoldPct = profiles.length > 0 ? Math.round((baselineSold / profiles.length) * 1000) / 10 : 0;

        return NextResponse.json({
          total_leads: leads.length,
          total_customers: profiles.length,
          baseline_sold_pct: baselineSoldPct,
          unsold_count: unsold.length,
          intensity,
          dropout,
        });
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
