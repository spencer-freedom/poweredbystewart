import type { SupabaseClient } from "@supabase/supabase-js";

// ─── Shared KPI computation — used by both dealeros and sheets-sync routes ──

export interface KpiLeadRow {
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

export function computeKpi(leads: KpiLeadRow[], tenantId: string, month: string) {
  // Filter to the target month and exclude service leads
  const ml = leads
    .filter((l) => l.lead_date.startsWith(month))
    .filter((l) => l.lead_type !== "service");

  const count = (fn: (l: KpiLeadRow) => boolean) => ml.filter(fn).length;
  const pct = (num: number, den: number) => den > 0 ? Math.round((num / den) * 1000) / 10 : 0;
  const seg = (l: KpiLeadRow) => (l.segment || "").toLowerCase();

  const total_leads = ml.length;
  const new_leads = count((l) => seg(l) === "new");
  const used_leads = count((l) => seg(l) === "used");
  const cpo_leads = count((l) => seg(l) === "cpo");

  const total_appts = count((l) => !!l.appt);
  const new_appts = count((l) => seg(l) === "new" && !!l.appt);
  const used_appts = count((l) => seg(l) === "used" && !!l.appt);
  const cpo_appts = count((l) => seg(l) === "cpo" && !!l.appt);

  const total_shows = count((l) => !!l.show);
  const new_shows = count((l) => seg(l) === "new" && !!l.show);
  const used_shows = count((l) => seg(l) === "used" && !!l.show);
  const cpo_shows = count((l) => seg(l) === "cpo" && !!l.show);

  const isSold = (l: KpiLeadRow) => (l.status || "").toLowerCase() === "sold";
  const total_sold = count(isSold);
  const new_sold = count((l) => seg(l) === "new" && isSold(l));
  const used_sold = count((l) => seg(l) === "used" && isSold(l));
  const cpo_sold = count((l) => seg(l) === "cpo" && isSold(l));

  const total_turns = count((l) => !!l.turn_over);
  const total_contacted = count((l) => {
    const pa = (l.past_actions || "").toLowerCase();
    return pa.includes("contacted") || pa.includes("conacted") || pa.includes("yes");
  });

  const source_breakdown: Record<string, { leads: number; sold: number }> = {};
  for (const l of ml) {
    const src = l.source || "Unknown";
    if (!source_breakdown[src]) source_breakdown[src] = { leads: 0, sold: 0 };
    source_breakdown[src].leads++;
    if (isSold(l)) source_breakdown[src].sold++;
  }

  const salesperson_breakdown: Record<string, { leads: number; sold: number }> = {};
  for (const l of ml) {
    const rep = l.to_salesperson;
    if (rep) {
      if (!salesperson_breakdown[rep]) salesperson_breakdown[rep] = { leads: 0, sold: 0 };
      salesperson_breakdown[rep].leads++;
      if (isSold(l)) salesperson_breakdown[rep].sold++;
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
    walk_ins: count((l) => l.lead_type === "walkin"),
    sold_from_appt: 0,
    sold_from_walkin: count((l) => l.lead_type === "walkin" && isSold(l)),
    pct_contacted: pct(total_contacted, total_leads),
    pct_appt_set: pct(total_appts, total_leads),
    pct_show_set: pct(total_shows, total_appts),
    pct_show_sold: pct(total_sold, total_shows),
    pct_overall: pct(total_sold, total_leads),
    source_breakdown,
    salesperson_breakdown,
  };
}

/** Fetch all leads for a tenant+month, recompute KPI, upsert to kpi_monthly */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function recomputeKpiForMonth(supabase: SupabaseClient<any, any, any>, tenantId: string, month: string) {
  const { data: allLeads } = await supabase
    .from("leads")
    .select("*")
    .eq("tenant_id", tenantId)
    .like("lead_date", `${month}%`);

  if (allLeads && allLeads.length > 0) {
    const kpi = computeKpi(allLeads as KpiLeadRow[], tenantId, month);
    await supabase
      .from("kpi_monthly")
      .upsert(kpi, { onConflict: "tenant_id,month" });
  }
}
