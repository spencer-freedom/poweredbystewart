"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useTenant } from "@/components/tenant-provider";
import { PageInfo } from "@/components/page-info";
import type { VinRepRow } from "@/lib/types";

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function fmtCurrency(v: number | null): string {
  if (v === null || v === undefined) return "--";
  return `$${v.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function fmtMin(v: number | null): string {
  if (v === null || v === undefined) return "--";
  if (v < 60) return `${v.toFixed(0)}m`;
  return `${(v / 60).toFixed(1)}h`;
}

function tierColor(sold: number, benchmark: number): string {
  if (sold >= benchmark * 1.2) return "text-green-400";
  if (sold >= benchmark) return "text-blue-400";
  if (sold >= benchmark * 0.7) return "text-yellow-400";
  return "text-red-400";
}

export default function CompassPage() {
  const { tenantId } = useTenant();
  const [month, setMonth] = useState(getCurrentMonth());
  const [reps, setReps] = useState<VinRepRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.vinSalespersonBreakdown(tenantId, month);
      setReps(data.reps || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [tenantId, month]);

  useEffect(() => { load(); }, [load]);

  const avgSold = reps.length > 0 ? reps.reduce((a, r) => a + r.sold, 0) / reps.length : 0;
  const benchmark = Math.max(avgSold, 8);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-stewart-text">Compass — Rep Scorecards</h2>
          <p className="text-xs text-stewart-muted">Individual salesperson performance</p>
        </div>
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="bg-stewart-bg border border-stewart-border rounded px-3 py-1.5 text-sm text-stewart-text" />
      </div>

      <PageInfo pageId="compass" title="Salesperson scorecards with funnel and gross metrics">
        <p>Individual rep performance showing the full funnel from leads through sold plus gross profit. Reps falling below benchmarks are flagged for coaching.</p>
      </PageInfo>

      {error && <div className="bg-red-500/10 border border-red-500/30 rounded p-3 text-sm text-red-400">{error}</div>}

      {loading ? (
        <div className="text-center text-stewart-muted py-8 text-sm">Loading scorecards...</div>
      ) : reps.length === 0 ? (
        <div className="text-center text-stewart-muted py-8 text-sm">No salesperson data for {month}</div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-stewart-card border border-stewart-border rounded-lg p-4">
              <p className="text-xs text-stewart-muted">Reps Active</p>
              <p className="text-2xl font-bold text-stewart-text">{reps.length}</p>
            </div>
            <div className="bg-stewart-card border border-stewart-border rounded-lg p-4">
              <p className="text-xs text-stewart-muted">Total Sold</p>
              <p className="text-2xl font-bold text-green-400">{reps.reduce((a, r) => a + r.sold, 0)}</p>
            </div>
            <div className="bg-stewart-card border border-stewart-border rounded-lg p-4">
              <p className="text-xs text-stewart-muted">Total Gross</p>
              <p className="text-2xl font-bold text-stewart-accent">
                {fmtCurrency(reps.reduce((a, r) => a + (r.total_gross || 0), 0))}
              </p>
            </div>
            <div className="bg-stewart-card border border-stewart-border rounded-lg p-4">
              <p className="text-xs text-stewart-muted">Avg Response</p>
              <p className="text-2xl font-bold text-stewart-text">
                {fmtMin(reps.filter(r => r.avg_response_min !== null).reduce((a, r) => a + (r.avg_response_min || 0), 0) / Math.max(reps.filter(r => r.avg_response_min !== null).length, 1))}
              </p>
            </div>
          </div>

          {/* Scorecard Table */}
          <div className="bg-stewart-card border border-stewart-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-stewart-bg text-stewart-muted">
                <tr>
                  <th className="text-left px-4 py-2">Rep</th>
                  <th className="text-right px-3 py-2">Leads</th>
                  <th className="text-right px-3 py-2">Contacted</th>
                  <th className="text-right px-3 py-2">Response</th>
                  <th className="text-right px-3 py-2">Appts</th>
                  <th className="text-right px-3 py-2">Shows</th>
                  <th className="text-right px-3 py-2">Sold</th>
                  <th className="text-right px-3 py-2">Close %</th>
                  <th className="text-right px-3 py-2">Front $</th>
                  <th className="text-right px-3 py-2">Back $</th>
                  <th className="text-right px-3 py-2">Total $</th>
                  <th className="text-center px-3 py-2">Flag</th>
                </tr>
              </thead>
              <tbody>
                {reps.sort((a, b) => b.sold - a.sold).map((r) => {
                  const closeRate = r.leads > 0 ? (r.sold / r.leads * 100) : 0;
                  const contactRate = r.leads > 0 ? (r.contacted / r.leads * 100) : 0;
                  const needsCoaching = r.sold < benchmark * 0.7 || contactRate < 40 || (r.avg_response_min != null && r.avg_response_min > 60);
                  return (
                    <tr key={r.sales_rep} className="border-t border-stewart-border hover:bg-stewart-bg/50">
                      <td className="px-4 py-2 font-medium text-stewart-text">{r.sales_rep || "Unknown"}</td>
                      <td className="text-right px-3 py-2 text-stewart-muted">{r.leads}</td>
                      <td className={`text-right px-3 py-2 ${contactRate >= 40 ? "text-stewart-text" : "text-red-400"}`}>
                        {r.contacted} ({contactRate.toFixed(0)}%)
                      </td>
                      <td className={`text-right px-3 py-2 ${(r.avg_response_min || 999) <= 30 ? "text-green-400" : (r.avg_response_min || 999) <= 60 ? "text-yellow-400" : "text-red-400"}`}>
                        {fmtMin(r.avg_response_min)}
                      </td>
                      <td className="text-right px-3 py-2 text-stewart-muted">{r.appointments}</td>
                      <td className="text-right px-3 py-2 text-stewart-muted">{r.shows}</td>
                      <td className={`text-right px-3 py-2 font-bold ${tierColor(r.sold, benchmark)}`}>{r.sold}</td>
                      <td className="text-right px-3 py-2 text-stewart-muted">{closeRate.toFixed(1)}%</td>
                      <td className="text-right px-3 py-2 text-stewart-muted">{fmtCurrency(r.front_gross)}</td>
                      <td className="text-right px-3 py-2 text-stewart-muted">{fmtCurrency(r.back_gross)}</td>
                      <td className="text-right px-3 py-2 font-medium text-stewart-accent">{fmtCurrency(r.total_gross)}</td>
                      <td className="text-center px-3 py-2">
                        {needsCoaching && <span className="text-red-400 text-xs font-bold">COACH</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
