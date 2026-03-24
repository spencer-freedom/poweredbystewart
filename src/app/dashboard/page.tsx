"use client";

import { useCallback, useEffect, useState } from "react";
import { useUser, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { useTenant } from "@/components/tenant-provider";
import type { KpiMonthly, DealershipContext, UserRole, Lead } from "@/lib/types";

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function fmtPct(value: number | null | undefined): string {
  if (value === null || value === undefined) return "--";
  return `${value.toFixed(1)}%`;
}

function fmtCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return "--";
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function fmtMin(v: number | null | undefined): string {
  if (v === null || v === undefined) return "--";
  if (v < 60) return `${v.toFixed(0)}m`;
  return `${(v / 60).toFixed(1)}h`;
}

function getMonthStart(month: string): string {
  return `${month}-01`;
}

function getMonthEnd(month: string): string {
  const [y, m] = month.split("-").map(Number);
  const lastDay = new Date(y, m, 0).getDate();
  return `${month}-${String(lastDay).padStart(2, "0")}`;
}

type DateMode = "month" | "custom";

function computeKpiFromLeads(leads: Lead[]): KpiMonthly {
  const nonService = leads.filter((l) => l.lead_type !== "service");
  const total = nonService.length;
  const seg = (l: Lead) => (l.segment || "").toLowerCase();
  const isSold = (l: Lead) => (l.status || "").toLowerCase() === "sold";
  const sold = nonService.filter(isSold).length;
  const contacted = nonService.filter((l) => {
    const pa = (l.past_actions || "").toLowerCase();
    return ["contacted", "conacted", "yes", "called", "emailed", "texted"].some((kw) => pa.includes(kw));
  }).length;
  const appts = nonService.filter((l) => !!l.appt).length;
  const shows = nonService.filter((l) => !!l.show).length;
  const turns = nonService.filter((l) => !!l.turn_over).length;

  const newL = nonService.filter((l) => seg(l) === "new");
  const usedL = nonService.filter((l) => seg(l) === "used");
  const cpoL = nonService.filter((l) => seg(l) === "cpo");

  const pct = (n: number, d: number) => d > 0 ? Math.round((n / d) * 1000) / 10 : 0;

  const sourceBreakdown: Record<string, { leads: number; sold: number }> = {};
  for (const l of nonService) {
    const src = l.source || "Unknown";
    if (!sourceBreakdown[src]) sourceBreakdown[src] = { leads: 0, sold: 0 };
    sourceBreakdown[src].leads++;
    if (isSold(l)) sourceBreakdown[src].sold++;
  }

  return {
    tenant_id: "", month: "",
    total_leads: total, total_sold: sold, total_contacted: contacted,
    total_appts: appts, total_shows: shows, total_turns: turns,
    new_leads: newL.length, new_appts: newL.filter((l) => !!l.appt).length,
    new_shows: newL.filter((l) => !!l.show).length, new_sold: newL.filter(isSold).length,
    used_leads: usedL.length, used_appts: usedL.filter((l) => !!l.appt).length,
    used_shows: usedL.filter((l) => !!l.show).length, used_sold: usedL.filter(isSold).length,
    cpo_leads: cpoL.length, cpo_appts: cpoL.filter((l) => !!l.appt).length,
    cpo_shows: cpoL.filter((l) => !!l.show).length, cpo_sold: cpoL.filter(isSold).length,
    appt_showed: shows, new_appt_showed: newL.filter((l) => !!l.show).length,
    used_appt_showed: usedL.filter((l) => !!l.show).length,
    cpo_appt_showed: cpoL.filter((l) => !!l.show).length,
    walk_ins: nonService.filter((l) => l.lead_type === "walkin").length,
    sold_from_appt: 0,
    sold_from_walkin: nonService.filter((l) => l.lead_type === "walkin" && isSold(l)).length,
    pct_contacted: pct(contacted, total), pct_appt_set: pct(appts, total),
    pct_show_set: pct(shows, appts), pct_show_sold: pct(sold, shows),
    pct_overall: pct(sold, total),
    source_breakdown: sourceBreakdown,
    salesperson_breakdown: {},
  } as KpiMonthly;
}

function healthColor(score: number): string {
  if (score >= 80) return "text-green-400";
  if (score >= 60) return "text-yellow-400";
  return "text-red-400";
}

export default function DashboardPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const { tenantId } = useTenant();
  const { user } = useUser();

  const [kpi, setKpi] = useState<KpiMonthly | null>(null);
  const [context, setContext] = useState<DealershipContext | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showSourceBreakdown, setShowSourceBreakdown] = useState(false);
  const [showSoldList, setShowSoldList] = useState(false);
  const [soldLeads, setSoldLeads] = useState<{ customer_name: string; interest: string; source: string; lead_date: string; segment: string }[]>([]);
  const [soldLoading, setSoldLoading] = useState(false);

  const [dateMode, setDateMode] = useState<DateMode>("month");
  const [monthFilter, setMonthFilter] = useState(getCurrentMonth());
  const [startDate, setStartDate] = useState(getMonthStart(getCurrentMonth()));
  const [endDate, setEndDate] = useState(getMonthEnd(getCurrentMonth()));
  const dateLabel = dateMode === "month" ? monthFilter : `${startDate} to ${endDate}`;

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace("/sign-in");
    }
  }, [isLoaded, isSignedIn, router]);

  const load = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    setError(null);
    setSoldLeads([]);
    setShowSoldList(false);
    setShowSourceBreakdown(false);
    try {
      if (dateMode === "month") {
        const [kpiRes, ctxRes] = await Promise.all([
          api.getMarketingKpi(tenantId, monthFilter).catch(() => null),
          api.getDealershipContext(tenantId).catch(() => null),
        ]);
        setKpi(kpiRes);
        setContext(ctxRes);
      } else {
        const [leadsRes, ctxRes] = await Promise.all([
          api.getLeads(tenantId, undefined, undefined, undefined, undefined, 2000, undefined, startDate, endDate).catch(() => []),
          api.getDealershipContext(tenantId).catch(() => null),
        ]);
        setKpi(computeKpiFromLeads(leadsRes as Lead[]));
        setContext(ctxRes);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [tenantId, dateMode, monthFilter, startDate, endDate]);

  useEffect(() => { load(); }, [load]);

  const toggleSoldList = async () => {
    if (showSoldList) {
      setShowSoldList(false);
      return;
    }
    if (soldLeads.length > 0) {
      setShowSoldList(true);
      return;
    }
    if (!tenantId) return;
    setSoldLoading(true);
    try {
      const leads = dateMode === "custom"
        ? await api.getLeads(tenantId, undefined, undefined, undefined, "sold", 500, undefined, startDate, endDate)
        : await api.getLeads(tenantId, monthFilter, undefined, undefined, "sold", 500);
      setSoldLeads(leads.map((l) => ({
        customer_name: l.customer_name,
        interest: l.interest || "--",
        source: l.source || "--",
        lead_date: l.lead_date,
        segment: l.segment || "--",
      })));
      setShowSoldList(true);
    } catch {
      // silent
    } finally {
      setSoldLoading(false);
    }
  };

  // Auth guard — after all hooks
  if (!isLoaded || !isSignedIn) {
    return <div className="text-center text-stewart-muted py-12 text-sm">Loading...</div>;
  }
  const role = (user?.publicMetadata?.role as UserRole) || "rep";
  const greeting = user?.firstName ? `Welcome back, ${user.firstName}` : "Welcome back";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stewart-text">{greeting}</h1>
          <p className="text-sm text-stewart-muted">
            {dateLabel} overview {tenantId && <span className="text-stewart-accent">({tenantId})</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select value={dateMode} onChange={(e) => {
            const mode = e.target.value as DateMode;
            setDateMode(mode);
            if (mode === "month") {
              setStartDate(getMonthStart(monthFilter));
              setEndDate(getMonthEnd(monthFilter));
            }
          }} className="px-2 py-1.5 bg-stewart-card border border-stewart-border rounded-md text-sm text-stewart-text">
            <option value="month">Month</option>
            <option value="custom">Custom</option>
          </select>
          {dateMode === "month" ? (
            <input type="month" value={monthFilter} onChange={(e) => {
              setMonthFilter(e.target.value);
              setStartDate(getMonthStart(e.target.value));
              setEndDate(getMonthEnd(e.target.value));
            }} className="px-3 py-1.5 bg-stewart-card border border-stewart-border rounded-md text-sm text-stewart-text" />
          ) : (
            <>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="px-2 py-1.5 bg-stewart-card border border-stewart-border rounded-md text-sm text-stewart-text" />
              <span className="text-stewart-muted text-xs">to</span>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="px-2 py-1.5 bg-stewart-card border border-stewart-border rounded-md text-sm text-stewart-text" />
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-md text-red-400 text-sm">{error}</div>
      )}

      {loading ? (
        <div className="text-center text-stewart-muted py-12 text-sm">Loading dashboard...</div>
      ) : (
        <>
          {/* Health Score (admin only) */}
          {role === "admin" && context?.context_json?.health?.score !== undefined && (
            <div className="bg-stewart-card border border-stewart-border rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-stewart-muted">Dealership Health Score</p>
                  <p className={`text-4xl font-bold ${healthColor(context.context_json.health.score!)}`}>
                    {context.context_json.health.score}
                  </p>
                </div>
                {context.context_json.health.flags && context.context_json.health.flags.length > 0 && (
                  <div className="text-right">
                    <p className="text-xs text-stewart-muted mb-1">Flags</p>
                    <div className="flex flex-wrap gap-1 justify-end">
                      {context.context_json.health.flags.map((flag, i) => (
                        <span key={i} className="px-2 py-0.5 bg-red-500/10 text-red-400 text-xs rounded">
                          {flag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* KPI Summary Cards */}
          {kpi && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button onClick={() => setShowSourceBreakdown(!showSourceBreakdown)} className="bg-stewart-card border border-stewart-border rounded-lg p-4 text-left hover:border-stewart-accent/50 transition-colors">
                <p className="text-xs text-stewart-muted">Total Leads <span className="text-stewart-accent">(click)</span></p>
                <p className="text-2xl font-bold mt-1 text-stewart-text">{kpi.total_leads}</p>
              </button>
              <button onClick={toggleSoldList} className="bg-stewart-card border border-stewart-border rounded-lg p-4 text-left hover:border-stewart-accent/50 transition-colors">
                <p className="text-xs text-stewart-muted">Sold <span className="text-stewart-accent">(click)</span></p>
                <p className="text-2xl font-bold mt-1 text-stewart-accent">{soldLoading ? "..." : kpi.total_sold}</p>
              </button>
              <StatCard
                label="Close Rate"
                value={fmtPct(kpi.pct_overall)}
                color={kpi.pct_overall >= 15 ? "text-green-400" : "text-red-400"}
              />
              <StatCard
                label="Avg Response"
                value={fmtMin(kpi.avg_response_time_minutes)}
                color={
                  kpi.avg_response_time_minutes !== null && kpi.avg_response_time_minutes !== undefined
                    ? kpi.avg_response_time_minutes <= 15
                      ? "text-green-400"
                      : kpi.avg_response_time_minutes <= 30
                        ? "text-yellow-400"
                        : "text-red-400"
                    : undefined
                }
              />
            </div>
          )}

          {/* Source Breakdown (shown when Total Leads is clicked) */}
          {kpi && showSourceBreakdown && kpi.source_breakdown && (
            <div className="bg-stewart-card border border-stewart-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-medium text-stewart-muted uppercase tracking-wider">
                  Leads by Source — {dateLabel}
                </h2>
                <button onClick={() => setShowSourceBreakdown(false)} className="text-xs text-stewart-muted hover:text-stewart-text">Close</button>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stewart-border text-left">
                    <th className="px-3 py-2 text-xs text-stewart-muted font-medium">Source</th>
                    <th className="px-3 py-2 text-xs text-stewart-muted font-medium text-right">Leads</th>
                    <th className="px-3 py-2 text-xs text-stewart-muted font-medium text-right">Sold</th>
                    <th className="px-3 py-2 text-xs text-stewart-muted font-medium text-right">Close %</th>
                    <th className="px-3 py-2 text-xs text-stewart-muted font-medium text-right">% of Total</th>
                    <th className="px-3 py-2 text-xs text-stewart-muted font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(kpi.source_breakdown)
                    .sort(([, a], [, b]) => b.leads - a.leads)
                    .map(([source, data]) => {
                      const closeRate = data.leads > 0 ? ((data.sold / data.leads) * 100).toFixed(1) : "0.0";
                      const pctOfTotal = kpi.total_leads > 0 ? ((data.leads / kpi.total_leads) * 100).toFixed(1) : "0.0";
                      return (
                        <tr key={source} className="border-b border-stewart-border/50 hover:bg-stewart-card/50">
                          <td className="px-3 py-2 text-stewart-text font-medium">{source}</td>
                          <td className="px-3 py-2 text-right text-stewart-text">{data.leads}</td>
                          <td className="px-3 py-2 text-right text-green-400 font-medium">{data.sold}</td>
                          <td className="px-3 py-2 text-right text-stewart-muted">{closeRate}%</td>
                          <td className="px-3 py-2 text-right text-stewart-muted">{pctOfTotal}%</td>
                          <td className="px-3 py-2 text-right">
                            <Link href={dateMode === "custom"
                              ? `/leads?source=${encodeURIComponent(source)}&start_date=${startDate}&end_date=${endDate}`
                              : `/leads?source=${encodeURIComponent(source)}&month=${monthFilter}`
                            } className="text-xs text-stewart-accent hover:underline">
                              View
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}

          {/* Sold List (shown when Sold card is clicked) */}
          {showSoldList && soldLeads.length > 0 && (
            <div className="bg-stewart-card border border-stewart-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-medium text-stewart-muted uppercase tracking-wider">
                  Sold Deals — {dateLabel} ({soldLeads.length})
                </h2>
                <button onClick={() => setShowSoldList(false)} className="text-xs text-stewart-muted hover:text-stewart-text">Close</button>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stewart-border text-left">
                    <th className="px-3 py-2 text-xs text-stewart-muted font-medium">Date</th>
                    <th className="px-3 py-2 text-xs text-stewart-muted font-medium">Customer</th>
                    <th className="px-3 py-2 text-xs text-stewart-muted font-medium">Vehicle</th>
                    <th className="px-3 py-2 text-xs text-stewart-muted font-medium">Source</th>
                    <th className="px-3 py-2 text-xs text-stewart-muted font-medium">Segment</th>
                  </tr>
                </thead>
                <tbody>
                  {soldLeads.map((lead, i) => (
                    <tr key={i} className="border-b border-stewart-border/50 hover:bg-stewart-card/50">
                      <td className="px-3 py-2 text-xs text-stewart-muted">{lead.lead_date?.slice(5).replace("-", "/")}</td>
                      <td className="px-3 py-2 text-stewart-text font-medium">{lead.customer_name}</td>
                      <td className="px-3 py-2 text-stewart-muted">{lead.interest}</td>
                      <td className="px-3 py-2 text-stewart-muted">{lead.source}</td>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-mono ${
                          lead.segment === "new" || lead.segment === "New" ? "bg-blue-500/20 text-blue-400" :
                          lead.segment === "used" || lead.segment === "Used" ? "bg-green-500/20 text-green-400" :
                          "bg-yellow-500/20 text-yellow-400"
                        }`}>{lead.segment}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Funnel Snapshot */}
          {kpi && (
            <div className="bg-stewart-card border border-stewart-border rounded-lg p-6">
              <h2 className="text-sm font-medium text-stewart-muted uppercase tracking-wider mb-4">
                Funnel Snapshot
              </h2>
              <div className="grid grid-cols-5 gap-4 text-center">
                <FunnelStep label="Leads" value={kpi.total_leads} />
                <FunnelStep label="Contacted" value={kpi.total_contacted} pct={fmtPct(kpi.pct_contacted)} />
                <FunnelStep label="Appts Set" value={kpi.total_appts} pct={fmtPct(kpi.pct_appt_set)} />
                <FunnelStep label="Shows" value={kpi.total_shows} pct={fmtPct(kpi.pct_show_set)} />
                <FunnelStep label="Sold" value={kpi.total_sold} pct={fmtPct(kpi.pct_overall)} highlight />
              </div>
            </div>
          )}

          {/* Segment Breakdown */}
          {kpi && (
            <div className="bg-stewart-card border border-stewart-border rounded-lg p-6">
              <h2 className="text-sm font-medium text-stewart-muted uppercase tracking-wider mb-4">
                By Segment
              </h2>
              <div className="grid grid-cols-3 gap-6">
                <SegmentCard label="New" leads={kpi.new_leads} sold={kpi.new_sold} color="text-blue-400" />
                <SegmentCard label="Used" leads={kpi.used_leads} sold={kpi.used_sold} color="text-green-400" />
                <SegmentCard label="CPO" leads={kpi.cpo_leads} sold={kpi.cpo_sold} color="text-yellow-400" />
              </div>
            </div>
          )}

          {/* Gross Profit (admin only) */}
          {role === "admin" && kpi && (kpi.total_front_gross || kpi.total_back_gross) && (
            <div className="grid grid-cols-3 gap-4">
              <StatCard label="Front Gross" value={fmtCurrency(kpi.total_front_gross)} />
              <StatCard label="Back Gross" value={fmtCurrency(kpi.total_back_gross)} />
              <StatCard label="Total Gross" value={fmtCurrency(kpi.total_total_gross)} accent />
            </div>
          )}

          {/* No Data State */}
          {!kpi && !loading && (
            <div className="bg-stewart-card border border-stewart-border rounded-lg p-12 text-center">
              <p className="text-stewart-muted text-sm">No KPI data for {dateLabel}</p>
              <p className="text-stewart-muted/60 text-xs mt-2">Upload VinSolutions data via VinSync to populate dashboards</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, accent, color }: { label: string; value: string; accent?: boolean; color?: string }) {
  return (
    <div className="bg-stewart-card border border-stewart-border rounded-lg p-4">
      <p className="text-xs text-stewart-muted">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color || (accent ? "text-stewart-accent" : "text-stewart-text")}`}>
        {value}
      </p>
    </div>
  );
}

function FunnelStep({ label, value, pct, highlight }: { label: string; value: number; pct?: string; highlight?: boolean }) {
  return (
    <div>
      <p className={`text-2xl font-bold ${highlight ? "text-stewart-accent" : "text-stewart-text"}`}>{value}</p>
      <p className="text-xs text-stewart-muted">{label}</p>
      {pct && <p className="text-xs text-stewart-muted/70 mt-0.5">{pct}</p>}
    </div>
  );
}

function SegmentCard({ label, leads, sold, color }: { label: string; leads: number; sold: number; color: string }) {
  const closeRate = leads > 0 ? ((sold / leads) * 100).toFixed(1) : "0.0";
  return (
    <div className="text-center">
      <p className={`text-lg font-bold ${color}`}>{label}</p>
      <div className="mt-2 space-y-1 text-sm">
        <p className="text-stewart-muted">{leads} leads</p>
        <p className="text-stewart-text font-medium">{sold} sold</p>
        <p className="text-stewart-muted/70 text-xs">{closeRate}% close</p>
      </div>
    </div>
  );
}
