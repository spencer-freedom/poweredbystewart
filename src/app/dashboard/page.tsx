"use client";

import { useCallback, useEffect, useState } from "react";
// Safe import — returns null when Clerk isn't active
let useUser: () => { user: { firstName?: string; publicMetadata?: Record<string, unknown> } | null | undefined };
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  useUser = require("@clerk/nextjs").useUser;
} catch {
  useUser = () => ({ user: null });
}
import { api } from "@/lib/api";
import { useTenant } from "@/components/tenant-provider";
import type { KpiMonthly, DealershipContext, UserRole } from "@/lib/types";

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

function healthColor(score: number): string {
  if (score >= 80) return "text-green-400";
  if (score >= 60) return "text-yellow-400";
  return "text-red-400";
}

export default function DashboardPage() {
  const { tenantId } = useTenant();
  const { user } = useUser();
  const role = (user?.publicMetadata?.role as UserRole) || "rep";

  const [kpi, setKpi] = useState<KpiMonthly | null>(null);
  const [context, setContext] = useState<DealershipContext | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const month = getCurrentMonth();

  const load = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    setError(null);
    try {
      const [kpiRes, ctxRes] = await Promise.all([
        api.getMarketingKpi(tenantId, month).catch(() => null),
        api.getDealershipContext(tenantId).catch(() => null),
      ]);
      setKpi(kpiRes);
      setContext(ctxRes);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [tenantId, month]);

  useEffect(() => { load(); }, [load]);

  const greeting = user?.firstName ? `Welcome back, ${user.firstName}` : "Welcome back";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-stewart-text">{greeting}</h1>
        <p className="text-sm text-stewart-muted">
          {month} overview {tenantId && <span className="text-stewart-accent">({tenantId})</span>}
        </p>
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
              <StatCard label="Total Leads" value={String(kpi.total_leads)} />
              <StatCard label="Sold" value={String(kpi.total_sold)} accent />
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
              <p className="text-stewart-muted text-sm">No KPI data for {month}</p>
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
