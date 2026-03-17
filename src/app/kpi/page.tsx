"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useTenant } from "@/components/tenant-provider";
import { PageInfo } from "@/components/page-info";
import type { KpiMonthly, SourceAttribution, DealershipContext } from "@/lib/types";

const BENCHMARKS: Record<string, number> = {
  pct_contacted: 45,
  pct_appt_set: 25,
  pct_show_set: 50,
  pct_show_sold: 50,
  pct_overall: 15,
};

function pctColor(value: number, benchmarkKey: string): string {
  const benchmark = BENCHMARKS[benchmarkKey];
  if (!benchmark) return "text-stewart-text";
  return value >= benchmark ? "text-green-400" : "text-red-400";
}

function fmtPct(value: number | null | undefined): string {
  if (value === null || value === undefined) return "--";
  return `${value.toFixed(1)}%`;
}

function fmtCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return "--";
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

type ViewMode = "month" | "quarter" | "year";

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function getCurrentQuarter(): string {
  const now = new Date();
  return `${now.getFullYear()}-Q${Math.ceil((now.getMonth() + 1) / 3)}`;
}

function getCurrentYear(): string {
  return `${new Date().getFullYear()}`;
}

function quarterToMonths(q: string): string[] {
  const [y, qp] = q.split("-Q");
  const qn = parseInt(qp, 10);
  const startMonth = (qn - 1) * 3 + 1;
  return [0, 1, 2].map((i) => `${y}-${String(startMonth + i).padStart(2, "0")}`);
}

export default function KpiPage() {
  const { tenantId } = useTenant();
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [selectedQuarter, setSelectedQuarter] = useState(getCurrentQuarter());
  const [selectedYear, setSelectedYear] = useState(getCurrentYear());
  const [kpi, setKpi] = useState<KpiMonthly | null>(null);
  const [trend, setTrend] = useState<KpiMonthly[]>([]);
  const [sources, setSources] = useState<SourceAttribution[]>([]);
  const [context, setContext] = useState<DealershipContext | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    setError(null);
    try {
      const month = viewMode === "month" ? selectedMonth : viewMode === "quarter" ? quarterToMonths(selectedQuarter)[0] : `${selectedYear}-01`;
      const [kpiRes, trendRes, srcRes, ctxRes] = await Promise.all([
        api.getMarketingKpi(tenantId, month).catch(() => null),
        api.getKpiTrend(tenantId, 6).catch(() => []),
        api.getSourceAttribution(tenantId).catch(() => []),
        api.getDealershipContext(tenantId).catch(() => null),
      ]);
      setKpi(kpiRes);
      setTrend(trendRes);
      setSources(srcRes);
      setContext(ctxRes);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [tenantId, viewMode, selectedMonth, selectedQuarter, selectedYear]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-stewart-text">KPI Dashboard</h2>
          <p className="text-xs text-stewart-muted">Monthly performance metrics and benchmarks</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            {(["month", "quarter", "year"] as ViewMode[]).map((mode) => (
              <button key={mode} onClick={() => setViewMode(mode)} className={`px-3 py-1.5 rounded-md text-sm capitalize ${viewMode === mode ? "bg-stewart-accent/10 text-stewart-accent" : "text-stewart-muted hover:text-stewart-text"}`}>
                {mode}
              </button>
            ))}
          </div>
          {viewMode === "month" && (
            <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="bg-stewart-bg border border-stewart-border rounded px-3 py-1.5 text-sm text-stewart-text" />
          )}
          {viewMode === "quarter" && (
            <select value={selectedQuarter} onChange={(e) => setSelectedQuarter(e.target.value)} className="bg-stewart-bg border border-stewart-border rounded px-3 py-1.5 text-sm text-stewart-text">
              {[1, 2, 3, 4].map((q) => <option key={q} value={`${new Date().getFullYear()}-Q${q}`}>{new Date().getFullYear()} Q{q}</option>)}
            </select>
          )}
          {viewMode === "year" && (
            <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="bg-stewart-bg border border-stewart-border rounded px-3 py-1.5 text-sm text-stewart-text">
              {[2024, 2025, 2026].map((y) => <option key={y} value={String(y)}>{y}</option>)}
            </select>
          )}
        </div>
      </div>

      <PageInfo pageId="kpi" title="Monthly KPI metrics with benchmarks and trend data">
        <p>View key performance indicators against industry benchmarks. Green means meeting or exceeding benchmark, red means below.</p>
      </PageInfo>

      {error && <div className="bg-red-500/10 border border-red-500/30 rounded p-3 text-sm text-red-400">{error}</div>}

      {loading ? (
        <div className="text-center text-stewart-muted py-8 text-sm">Loading KPI data...</div>
      ) : !kpi ? (
        <div className="text-center text-stewart-muted py-8 text-sm">No KPI data available</div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-stewart-card border border-stewart-border rounded-lg p-4">
              <p className="text-xs text-stewart-muted">Total Leads</p>
              <p className="text-2xl font-bold text-stewart-text">{kpi.total_leads}</p>
            </div>
            <div className="bg-stewart-card border border-stewart-border rounded-lg p-4">
              <p className="text-xs text-stewart-muted">Total Sold</p>
              <p className="text-2xl font-bold text-green-400">{kpi.total_sold}</p>
            </div>
            <div className="bg-stewart-card border border-stewart-border rounded-lg p-4">
              <p className="text-xs text-stewart-muted">Close Rate</p>
              <p className={`text-2xl font-bold ${pctColor(kpi.pct_overall, "pct_overall")}`}>{fmtPct(kpi.pct_overall)}</p>
            </div>
            <div className="bg-stewart-card border border-stewart-border rounded-lg p-4">
              <p className="text-xs text-stewart-muted">Avg Response</p>
              <p className="text-2xl font-bold text-stewart-text">{kpi.avg_response_time_minutes != null ? `${kpi.avg_response_time_minutes.toFixed(0)}m` : "--"}</p>
            </div>
          </div>

          {/* Funnel Metrics Table */}
          <div className="bg-stewart-card border border-stewart-border rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-stewart-border">
              <h3 className="text-sm font-semibold text-stewart-text">Funnel Metrics</h3>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-stewart-bg text-stewart-muted">
                <tr>
                  <th className="text-left px-4 py-2">Metric</th>
                  <th className="text-right px-3 py-2">Value</th>
                  <th className="text-right px-3 py-2">Benchmark</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: "Contacted %", key: "pct_contacted", value: kpi.pct_contacted },
                  { label: "Appt Set %", key: "pct_appt_set", value: kpi.pct_appt_set },
                  { label: "Show Rate %", key: "pct_show_set", value: kpi.pct_show_set },
                  { label: "Show-to-Sold %", key: "pct_show_sold", value: kpi.pct_show_sold },
                  { label: "Overall Close %", key: "pct_overall", value: kpi.pct_overall },
                ].map((row) => (
                  <tr key={row.key} className="border-t border-stewart-border">
                    <td className="px-4 py-2 text-stewart-text">{row.label}</td>
                    <td className={`text-right px-3 py-2 font-bold ${pctColor(row.value, row.key)}`}>{fmtPct(row.value)}</td>
                    <td className="text-right px-3 py-2 text-stewart-muted">{BENCHMARKS[row.key]}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Segment Breakdown */}
          <div className="bg-stewart-card border border-stewart-border rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-stewart-border">
              <h3 className="text-sm font-semibold text-stewart-text">Segment Breakdown</h3>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-stewart-bg text-stewart-muted">
                <tr>
                  <th className="text-left px-4 py-2">Segment</th>
                  <th className="text-right px-3 py-2">Leads</th>
                  <th className="text-right px-3 py-2">Appts</th>
                  <th className="text-right px-3 py-2">Shows</th>
                  <th className="text-right px-3 py-2">Sold</th>
                  <th className="text-right px-3 py-2">Close %</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: "New", leads: kpi.new_leads, appts: kpi.new_appts, shows: kpi.new_shows, sold: kpi.new_sold, color: "text-blue-400" },
                  { label: "Used", leads: kpi.used_leads, appts: kpi.used_appts, shows: kpi.used_shows, sold: kpi.used_sold, color: "text-green-400" },
                  { label: "CPO", leads: kpi.cpo_leads, appts: kpi.cpo_appts, shows: kpi.cpo_shows, sold: kpi.cpo_sold, color: "text-yellow-400" },
                ].map((seg) => (
                  <tr key={seg.label} className="border-t border-stewart-border">
                    <td className={`px-4 py-2 font-medium ${seg.color}`}>{seg.label}</td>
                    <td className="text-right px-3 py-2 text-stewart-text">{seg.leads}</td>
                    <td className="text-right px-3 py-2 text-stewart-muted">{seg.appts}</td>
                    <td className="text-right px-3 py-2 text-stewart-muted">{seg.shows}</td>
                    <td className="text-right px-3 py-2 font-bold text-stewart-text">{seg.sold}</td>
                    <td className="text-right px-3 py-2 text-stewart-muted">{seg.leads > 0 ? `${((seg.sold / seg.leads) * 100).toFixed(1)}%` : "--"}</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-stewart-border bg-stewart-bg/30">
                  <td className="px-4 py-2 font-bold text-stewart-text">Total</td>
                  <td className="text-right px-3 py-2 font-bold text-stewart-text">{kpi.total_leads}</td>
                  <td className="text-right px-3 py-2 font-bold text-stewart-muted">{kpi.total_appts}</td>
                  <td className="text-right px-3 py-2 font-bold text-stewart-muted">{kpi.total_shows}</td>
                  <td className="text-right px-3 py-2 font-bold text-stewart-accent">{kpi.total_sold}</td>
                  <td className="text-right px-3 py-2 font-bold text-stewart-muted">{fmtPct(kpi.pct_overall)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Traffic Breakdown */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-stewart-card border border-stewart-border rounded-lg p-4">
              <p className="text-xs text-stewart-muted">Walk-Ins</p>
              <p className="text-2xl font-bold text-stewart-text">{kpi.walk_ins}</p>
            </div>
            <div className="bg-stewart-card border border-stewart-border rounded-lg p-4">
              <p className="text-xs text-stewart-muted">Sold from Appt</p>
              <p className="text-2xl font-bold text-stewart-text">{kpi.sold_from_appt}</p>
            </div>
            <div className="bg-stewart-card border border-stewart-border rounded-lg p-4">
              <p className="text-xs text-stewart-muted">Sold from Walk-In</p>
              <p className="text-2xl font-bold text-stewart-text">{kpi.sold_from_walkin}</p>
            </div>
          </div>

          {/* Gross Profit (if VinSolutions data) */}
          {(kpi.total_front_gross || kpi.total_back_gross) && (
            <div className="bg-stewart-card border border-stewart-border rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-stewart-border">
                <h3 className="text-sm font-semibold text-stewart-text">Gross Profit</h3>
              </div>
              <div className="grid grid-cols-4 gap-4 p-4">
                <div>
                  <p className="text-xs text-stewart-muted">Front Gross</p>
                  <p className="text-xl font-bold text-stewart-text">{fmtCurrency(kpi.total_front_gross)}</p>
                </div>
                <div>
                  <p className="text-xs text-stewart-muted">Back Gross</p>
                  <p className="text-xl font-bold text-stewart-text">{fmtCurrency(kpi.total_back_gross)}</p>
                </div>
                <div>
                  <p className="text-xs text-stewart-muted">Total Gross</p>
                  <p className="text-xl font-bold text-stewart-accent">{fmtCurrency(kpi.total_total_gross)}</p>
                </div>
                <div>
                  <p className="text-xs text-stewart-muted">Avg Per Deal</p>
                  <p className="text-xl font-bold text-stewart-text">{kpi.total_sold > 0 && kpi.total_total_gross ? fmtCurrency(kpi.total_total_gross / kpi.total_sold) : "--"}</p>
                </div>
              </div>
            </div>
          )}

          {/* Source Breakdown */}
          {sources.length > 0 && (
            <div className="bg-stewart-card border border-stewart-border rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-stewart-border">
                <h3 className="text-sm font-semibold text-stewart-text">Source Breakdown</h3>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-stewart-bg text-stewart-muted">
                  <tr>
                    <th className="text-left px-4 py-2">Source</th>
                    <th className="text-right px-3 py-2">Leads</th>
                    <th className="text-right px-3 py-2">Sold</th>
                    <th className="text-right px-3 py-2">% of Sold</th>
                    <th className="text-right px-3 py-2">CPL</th>
                    <th className="text-right px-3 py-2">CPS</th>
                  </tr>
                </thead>
                <tbody>
                  {sources.sort((a, b) => b.leads - a.leads).map((s) => (
                    <tr key={s.source} className="border-t border-stewart-border">
                      <td className="px-4 py-2 text-stewart-text">{s.source}</td>
                      <td className="text-right px-3 py-2 text-stewart-muted">{s.leads}</td>
                      <td className="text-right px-3 py-2 font-bold text-green-400">{s.sold}</td>
                      <td className="text-right px-3 py-2 text-stewart-muted">{fmtPct(s.pct_of_sold)}</td>
                      <td className="text-right px-3 py-2 text-stewart-muted">{fmtCurrency(s.cost_per_lead)}</td>
                      <td className="text-right px-3 py-2 text-stewart-muted">{fmtCurrency(s.cost_per_sold)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Trend (6 month) */}
          {trend.length > 1 && (
            <div className="bg-stewart-card border border-stewart-border rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-stewart-border">
                <h3 className="text-sm font-semibold text-stewart-text">6-Month Trend</h3>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-stewart-bg text-stewart-muted">
                  <tr>
                    <th className="text-left px-4 py-2">Month</th>
                    <th className="text-right px-3 py-2">Leads</th>
                    <th className="text-right px-3 py-2">Sold</th>
                    <th className="text-right px-3 py-2">Close %</th>
                    <th className="text-right px-3 py-2">Contacted %</th>
                  </tr>
                </thead>
                <tbody>
                  {trend.map((t) => (
                    <tr key={t.month} className="border-t border-stewart-border">
                      <td className="px-4 py-2 text-stewart-text">{t.month}</td>
                      <td className="text-right px-3 py-2 text-stewart-muted">{t.total_leads}</td>
                      <td className="text-right px-3 py-2 font-bold text-green-400">{t.total_sold}</td>
                      <td className={`text-right px-3 py-2 ${pctColor(t.pct_overall, "pct_overall")}`}>{fmtPct(t.pct_overall)}</td>
                      <td className={`text-right px-3 py-2 ${pctColor(t.pct_contacted, "pct_contacted")}`}>{fmtPct(t.pct_contacted)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
