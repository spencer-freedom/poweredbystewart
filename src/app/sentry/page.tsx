"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useTenant } from "@/components/tenant-provider";
import { PageInfo } from "@/components/page-info";
import type { VinSourceRow, VendorBudget } from "@/lib/types";

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

export default function SentryPage() {
  const { tenantId } = useTenant();
  const [month, setMonth] = useState(getCurrentMonth());
  const [sources, setSources] = useState<VinSourceRow[]>([]);
  const [vendors, setVendors] = useState<VendorBudget[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    setError(null);
    try {
      const [srcData, vendorData] = await Promise.all([
        api.vinSourceBreakdown(tenantId, month),
        api.getVendors(tenantId),
      ]);
      setSources(srcData.sources || []);
      setVendors(vendorData || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [tenantId, month]);

  useEffect(() => { load(); }, [load]);

  const vendorCostMap: Record<string, number> = {};
  for (const v of vendors) {
    vendorCostMap[v.vendor_name.toLowerCase()] = v.monthly_budget - v.coop_amount;
  }

  const enriched = sources.map((s) => {
    const cost = vendorCostMap[s.lead_source.toLowerCase()] || 0;
    const costPerLead = s.leads > 0 && cost > 0 ? cost / s.leads : null;
    const costPerSold = s.sold > 0 && cost > 0 ? cost / s.sold : null;
    const closeRate = s.leads > 0 ? (s.sold / s.leads * 100) : 0;
    const showRate = s.appointments > 0 ? (s.shows / s.appointments * 100) : 0;
    const roiFlag = costPerSold !== null && costPerSold > 1500;
    const volumeFlag = s.leads > 10 && s.sold === 0;
    return { ...s, cost, costPerLead, costPerSold, closeRate, showRate, roiFlag, volumeFlag };
  });

  const flaggedSources = enriched.filter((s) => s.roiFlag || s.volumeFlag);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-stewart-text">Sentry — Source ROI Monitor</h2>
          <p className="text-xs text-stewart-muted">Lead source performance vs spend</p>
        </div>
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="bg-stewart-bg border border-stewart-border rounded px-3 py-1.5 text-sm text-stewart-text" />
      </div>

      <PageInfo pageId="sentry" title="Source ROI analysis with spend-vs-performance flagging">
        <p>Combines lead source performance with vendor budget data. Red flags for cost-per-sold over $1,500 or sources with leads but zero sold.</p>
      </PageInfo>

      {error && <div className="bg-red-500/10 border border-red-500/30 rounded p-3 text-sm text-red-400">{error}</div>}

      {loading ? (
        <div className="text-center text-stewart-muted py-8 text-sm">Loading source ROI...</div>
      ) : sources.length === 0 ? (
        <div className="text-center text-stewart-muted py-8 text-sm">No source data for {month}</div>
      ) : (
        <>
          {flaggedSources.length > 0 && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <h3 className="text-sm font-bold text-red-400 mb-2">Sentry Alert: {flaggedSources.length} source{flaggedSources.length > 1 ? "s" : ""} flagged</h3>
              <ul className="space-y-1 text-sm text-red-300">
                {flaggedSources.map((s) => (
                  <li key={s.lead_source}>
                    <span className="font-medium">{s.lead_source}</span>
                    {s.roiFlag && ` — cost/sold ${fmtCurrency(s.costPerSold)} (exceeds $1,500 threshold)`}
                    {s.volumeFlag && ` — ${s.leads} leads, 0 sold (money burning)`}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-4 gap-3">
            <div className="bg-stewart-card border border-stewart-border rounded-lg p-4">
              <p className="text-xs text-stewart-muted">Sources Active</p>
              <p className="text-2xl font-bold text-stewart-text">{sources.length}</p>
            </div>
            <div className="bg-stewart-card border border-stewart-border rounded-lg p-4">
              <p className="text-xs text-stewart-muted">Total Leads</p>
              <p className="text-2xl font-bold text-blue-400">{sources.reduce((a, s) => a + s.leads, 0)}</p>
            </div>
            <div className="bg-stewart-card border border-stewart-border rounded-lg p-4">
              <p className="text-xs text-stewart-muted">Total Sold</p>
              <p className="text-2xl font-bold text-green-400">{sources.reduce((a, s) => a + s.sold, 0)}</p>
            </div>
            <div className="bg-stewart-card border border-stewart-border rounded-lg p-4">
              <p className="text-xs text-stewart-muted">Total Spend</p>
              <p className="text-2xl font-bold text-stewart-accent">{fmtCurrency(vendors.reduce((a, v) => a + v.monthly_budget - v.coop_amount, 0))}</p>
            </div>
          </div>

          <div className="bg-stewart-card border border-stewart-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-stewart-bg text-stewart-muted">
                <tr>
                  <th className="text-left px-4 py-2">Source</th>
                  <th className="text-right px-3 py-2">Leads</th>
                  <th className="text-right px-3 py-2">Appts</th>
                  <th className="text-right px-3 py-2">Shows</th>
                  <th className="text-right px-3 py-2">Show %</th>
                  <th className="text-right px-3 py-2">Sold</th>
                  <th className="text-right px-3 py-2">Close %</th>
                  <th className="text-right px-3 py-2">Gross</th>
                  <th className="text-right px-3 py-2">Avg Resp</th>
                  <th className="text-right px-3 py-2">Spend</th>
                  <th className="text-right px-3 py-2">$/Lead</th>
                  <th className="text-right px-3 py-2">$/Sold</th>
                  <th className="text-center px-3 py-2">Flag</th>
                </tr>
              </thead>
              <tbody>
                {enriched.sort((a, b) => b.leads - a.leads).map((s) => (
                  <tr key={s.lead_source} className={`border-t border-stewart-border ${(s.roiFlag || s.volumeFlag) ? "bg-red-500/5" : "hover:bg-stewart-bg/50"}`}>
                    <td className="px-4 py-2 font-medium text-stewart-text">{s.lead_source}</td>
                    <td className="text-right px-3 py-2 text-stewart-muted">{s.leads}</td>
                    <td className="text-right px-3 py-2 text-stewart-muted">{s.appointments}</td>
                    <td className="text-right px-3 py-2 text-stewart-muted">{s.shows}</td>
                    <td className="text-right px-3 py-2 text-stewart-muted">{s.showRate.toFixed(0)}%</td>
                    <td className="text-right px-3 py-2 font-bold text-green-400">{s.sold}</td>
                    <td className={`text-right px-3 py-2 ${s.closeRate >= 15 ? "text-green-400" : s.closeRate >= 8 ? "text-yellow-400" : "text-red-400"}`}>{s.closeRate.toFixed(1)}%</td>
                    <td className="text-right px-3 py-2 text-stewart-accent">{fmtCurrency(s.total_gross)}</td>
                    <td className="text-right px-3 py-2 text-stewart-muted">{fmtMin(s.avg_response_min)}</td>
                    <td className="text-right px-3 py-2 text-stewart-muted">{s.cost > 0 ? fmtCurrency(s.cost) : "--"}</td>
                    <td className="text-right px-3 py-2 text-stewart-muted">{s.costPerLead ? fmtCurrency(s.costPerLead) : "--"}</td>
                    <td className={`text-right px-3 py-2 font-medium ${s.roiFlag ? "text-red-400" : "text-stewart-muted"}`}>{s.costPerSold ? fmtCurrency(s.costPerSold) : "--"}</td>
                    <td className="text-center px-3 py-2">
                      {s.roiFlag && <span className="text-red-400 text-xs font-bold">ROI</span>}
                      {s.volumeFlag && <span className="text-red-400 text-xs font-bold">BURN</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
