"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useTenant } from "@/components/tenant-provider";
import { PageInfo } from "@/components/page-info";
import type { VinResponseTimeStats } from "@/lib/types";

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function fmtMin(v: number | null | undefined): string {
  if (v === null || v === undefined) return "--";
  if (v < 60) return `${v.toFixed(0)}m`;
  return `${(v / 60).toFixed(1)}h`;
}

function responseColor(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined) return "text-stewart-muted";
  if (minutes <= 15) return "text-green-400";
  if (minutes <= 30) return "text-yellow-400";
  if (minutes <= 60) return "text-orange-400";
  return "text-red-400";
}

function responseGrade(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined) return "--";
  if (minutes <= 5) return "A+";
  if (minutes <= 15) return "A";
  if (minutes <= 30) return "B";
  if (minutes <= 60) return "C";
  if (minutes <= 120) return "D";
  return "F";
}

export default function GaugePage() {
  const { tenantId } = useTenant();
  const [month, setMonth] = useState(getCurrentMonth());
  const [stats, setStats] = useState<VinResponseTimeStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.vinResponseTimes(tenantId, month);
      setStats(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [tenantId, month]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-stewart-text">Gauge — Response Time Watchdog</h2>
          <p className="text-xs text-stewart-muted">Lead response monitoring</p>
        </div>
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="bg-stewart-bg border border-stewart-border rounded px-3 py-1.5 text-sm text-stewart-text" />
      </div>

      <PageInfo pageId="gauge" title="Lead response time monitoring by source and rep">
        <p>Tracks how fast salespeople respond to incoming leads, graded A+ through F.</p>
      </PageInfo>

      {error && <div className="bg-red-500/10 border border-red-500/30 rounded p-3 text-sm text-red-400">{error}</div>}

      {loading ? (
        <div className="text-center text-stewart-muted py-8 text-sm">Loading response times...</div>
      ) : !stats ? (
        <div className="text-center text-stewart-muted py-8 text-sm">No response data for {month}</div>
      ) : (
        <>
          {/* Overall Stats */}
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-stewart-card border border-stewart-border rounded-lg p-4">
              <p className="text-xs text-stewart-muted">Avg Response</p>
              <p className={`text-2xl font-bold ${responseColor(stats.overall.avg_minutes)}`}>{fmtMin(stats.overall.avg_minutes)}</p>
              <p className="text-xs text-stewart-muted mt-1">Grade: {responseGrade(stats.overall.avg_minutes)}</p>
            </div>
            <div className="bg-stewart-card border border-stewart-border rounded-lg p-4">
              <p className="text-xs text-stewart-muted">Fastest</p>
              <p className="text-2xl font-bold text-green-400">{fmtMin(stats.overall.min_minutes)}</p>
            </div>
            <div className="bg-stewart-card border border-stewart-border rounded-lg p-4">
              <p className="text-xs text-stewart-muted">Slowest</p>
              <p className={`text-2xl font-bold ${responseColor(stats.overall.max_minutes)}`}>{fmtMin(stats.overall.max_minutes)}</p>
            </div>
            <div className="bg-stewart-card border border-stewart-border rounded-lg p-4">
              <p className="text-xs text-stewart-muted">Leads w/ Response</p>
              <p className="text-2xl font-bold text-stewart-text">{stats.overall.total_with_response}</p>
            </div>
          </div>

          {/* Thresholds */}
          <div className="bg-stewart-card border border-stewart-border rounded-lg p-4">
            <p className="text-xs text-stewart-muted mb-2">Alert Thresholds</p>
            <div className="flex gap-6 text-sm">
              <span className="text-green-400">Internet leads: &le;15 min</span>
              <span className="text-yellow-400">Phone/Walk-in: &le;60 min</span>
              <span className="text-red-400">Critical: &gt;60 min</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* By Source */}
            <div className="bg-stewart-card border border-stewart-border rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-stewart-border">
                <h3 className="text-sm font-semibold text-stewart-text">By Lead Source</h3>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-stewart-bg text-stewart-muted">
                  <tr>
                    <th className="text-left px-4 py-2">Source</th>
                    <th className="text-right px-3 py-2">Avg</th>
                    <th className="text-right px-3 py-2">Count</th>
                    <th className="text-center px-3 py-2">Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {(stats.by_source || []).sort((a, b) => b.avg_minutes - a.avg_minutes).map((s) => (
                    <tr key={s.lead_source} className="border-t border-stewart-border">
                      <td className="px-4 py-2 text-stewart-text">{s.lead_source}</td>
                      <td className={`text-right px-3 py-2 font-medium ${responseColor(s.avg_minutes)}`}>{fmtMin(s.avg_minutes)}</td>
                      <td className="text-right px-3 py-2 text-stewart-muted">{s.count}</td>
                      <td className={`text-center px-3 py-2 font-bold ${responseColor(s.avg_minutes)}`}>{responseGrade(s.avg_minutes)}</td>
                    </tr>
                  ))}
                  {(!stats.by_source || stats.by_source.length === 0) && (
                    <tr><td colSpan={4} className="px-4 py-4 text-center text-stewart-muted">No data</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* By Rep */}
            <div className="bg-stewart-card border border-stewart-border rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-stewart-border">
                <h3 className="text-sm font-semibold text-stewart-text">By Salesperson</h3>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-stewart-bg text-stewart-muted">
                  <tr>
                    <th className="text-left px-4 py-2">Rep</th>
                    <th className="text-right px-3 py-2">Avg</th>
                    <th className="text-right px-3 py-2">Count</th>
                    <th className="text-center px-3 py-2">Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {(stats.by_rep || []).sort((a, b) => b.avg_minutes - a.avg_minutes).map((r) => (
                    <tr key={r.sales_rep} className="border-t border-stewart-border">
                      <td className="px-4 py-2 text-stewart-text">{r.sales_rep}</td>
                      <td className={`text-right px-3 py-2 font-medium ${responseColor(r.avg_minutes)}`}>{fmtMin(r.avg_minutes)}</td>
                      <td className="text-right px-3 py-2 text-stewart-muted">{r.count}</td>
                      <td className={`text-center px-3 py-2 font-bold ${responseColor(r.avg_minutes)}`}>{responseGrade(r.avg_minutes)}</td>
                    </tr>
                  ))}
                  {(!stats.by_rep || stats.by_rep.length === 0) && (
                    <tr><td colSpan={4} className="px-4 py-4 text-center text-stewart-muted">No data</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
