"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useTenant } from "@/components/tenant-provider";
import { PageInfo } from "@/components/page-info";
import { cn } from "@/lib/utils";
import type { SourceAttribution } from "@/lib/types";

function fmtPct(value: number | null | undefined): string {
  if (value === null || value === undefined) return "--";
  return `${value.toFixed(1)}%`;
}

function fmtCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return "--";
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function titleCase(str: string): string {
  return str.split(/[_\s-]+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
}

function getMonthRange(months: number): { start: string; end: string } {
  const now = new Date();
  const end = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const startDate = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);
  const start = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, "0")}`;
  return { start, end };
}

export default function SourcesPage() {
  const { tenantId } = useTenant();
  const [sources, setSources] = useState<SourceAttribution[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [months, setMonths] = useState(6);

  const loadData = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    setError(null);
    try {
      const { start, end } = getMonthRange(months);
      const res = await api.getSourceAttribution(tenantId, start, end);
      setSources(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load source data");
    } finally {
      setLoading(false);
    }
  }, [tenantId, months]);

  useEffect(() => { loadData(); }, [loadData]);

  const totalLeads = sources.reduce((s, x) => s + x.leads, 0);
  const totalNew = sources.reduce((s, x) => s + x.new_leads, 0);
  const totalUsed = sources.reduce((s, x) => s + x.used_leads, 0);
  const totalCpo = sources.reduce((s, x) => s + x.cpo_leads, 0);
  const totalSold = sources.reduce((s, x) => s + x.sold, 0);
  const totalBudget = sources.reduce((s, x) => s + (x.budget || 0), 0);

  if (!tenantId) return <div className="p-8 text-center text-stewart-muted text-sm">No client configured.</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-stewart-muted uppercase tracking-wider">Source Attribution</h2>
        <div className="flex gap-1">
          {[3, 6, 12].map((m) => (
            <button key={m} onClick={() => setMonths(m)} className={cn("px-3 py-1.5 rounded-md text-sm transition-colors", months === m ? "bg-stewart-accent/10 text-stewart-accent" : "text-stewart-muted hover:text-stewart-text")}>{m}mo</button>
          ))}
        </div>
      </div>

      <PageInfo pageId="sources" title="Lead source attribution and cost analysis">
        <p>View lead volume, sold units, and cost-per-lead/sold for every lead source over a configurable time range.</p>
      </PageInfo>

      {error && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-md text-red-400 text-sm">{error}</div>}

      {loading && sources.length === 0 ? (
        <p className="text-sm text-stewart-muted text-center py-8">Loading source data...</p>
      ) : sources.length === 0 ? (
        <p className="text-sm text-stewart-muted text-center py-8">No source data available for this period.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stewart-border text-left">
                <th className="px-3 py-2 text-xs text-stewart-muted font-medium">Source</th>
                <th className="px-3 py-2 text-xs text-stewart-muted font-medium text-right">Leads</th>
                <th className="px-3 py-2 text-xs text-stewart-muted font-medium text-right">New</th>
                <th className="px-3 py-2 text-xs text-stewart-muted font-medium text-right">Used</th>
                <th className="px-3 py-2 text-xs text-stewart-muted font-medium text-right">CPO</th>
                <th className="px-3 py-2 text-xs text-stewart-muted font-medium text-right">Sold</th>
                <th className="px-3 py-2 text-xs text-stewart-muted font-medium text-right">% of Sold</th>
                <th className="px-3 py-2 text-xs text-stewart-muted font-medium text-right">Budget</th>
                <th className="px-3 py-2 text-xs text-stewart-muted font-medium text-right">Cost/Lead</th>
                <th className="px-3 py-2 text-xs text-stewart-muted font-medium text-right">Cost/Sold</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((s) => (
                <tr key={s.source} className="border-b border-stewart-border/50 hover:bg-stewart-card/50 transition-colors">
                  <td className="px-3 py-2 text-sm text-stewart-text font-medium">{titleCase(s.source)}</td>
                  <td className="px-3 py-2 text-xs text-stewart-text text-right">{s.leads}</td>
                  <td className="px-3 py-2 text-xs text-blue-400 text-right">{s.new_leads}</td>
                  <td className="px-3 py-2 text-xs text-green-400 text-right">{s.used_leads}</td>
                  <td className="px-3 py-2 text-xs text-yellow-400 text-right">{s.cpo_leads}</td>
                  <td className="px-3 py-2 text-xs text-stewart-text text-right font-medium">{s.sold}</td>
                  <td className="px-3 py-2 text-xs text-stewart-text text-right">{fmtPct(s.pct_of_sold)}</td>
                  <td className="px-3 py-2 text-xs text-stewart-text text-right">{fmtCurrency(s.budget)}</td>
                  <td className="px-3 py-2 text-xs text-stewart-text text-right">{fmtCurrency(s.cost_per_lead)}</td>
                  <td className="px-3 py-2 text-xs text-stewart-text text-right">{fmtCurrency(s.cost_per_sold)}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-stewart-border bg-stewart-card/30">
                <td className="px-3 py-2 text-xs text-stewart-text font-bold">Totals</td>
                <td className="px-3 py-2 text-xs text-stewart-text text-right font-bold">{totalLeads}</td>
                <td className="px-3 py-2 text-xs text-blue-400 text-right font-bold">{totalNew}</td>
                <td className="px-3 py-2 text-xs text-green-400 text-right font-bold">{totalUsed}</td>
                <td className="px-3 py-2 text-xs text-yellow-400 text-right font-bold">{totalCpo}</td>
                <td className="px-3 py-2 text-xs text-stewart-text text-right font-bold">{totalSold}</td>
                <td className="px-3 py-2 text-xs text-stewart-text text-right font-bold">{totalSold > 0 ? "100.0%" : "--"}</td>
                <td className="px-3 py-2 text-xs text-stewart-accent text-right font-bold">{fmtCurrency(totalBudget)}</td>
                <td className="px-3 py-2 text-xs text-stewart-text text-right font-bold">{totalLeads > 0 ? fmtCurrency(totalBudget / totalLeads) : "--"}</td>
                <td className="px-3 py-2 text-xs text-stewart-text text-right font-bold">{totalSold > 0 ? fmtCurrency(totalBudget / totalSold) : "--"}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
