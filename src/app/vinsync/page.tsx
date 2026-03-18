"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { useTenant } from "@/components/tenant-provider";
import { PageInfo } from "@/components/page-info";
import type { VinSyncRun, VinSyncResult, VinSummary } from "@/lib/types";

function fmtDuration(seconds: number): string {
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  return `${Math.floor(seconds / 60)}m ${(seconds % 60).toFixed(0)}s`;
}

function fmtNumber(n: number | null | undefined): string {
  if (n === null || n === undefined) return "--";
  return n.toLocaleString();
}

function StatusBadge({ status }: { status: string }) {
  const color = status === "complete" ? "bg-green-500/20 text-green-400" : status === "running" ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-400";
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${color}`}>{status}</span>;
}

export default function VinSyncPage() {
  const { tenantId } = useTenant();
  const [summary, setSummary] = useState<VinSummary | null>(null);
  const [history, setHistory] = useState<VinSyncRun[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<VinSyncResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    setError(null);
    try {
      const [summaryRes, historyRes] = await Promise.all([
        api.vinSummary(tenantId),
        api.vinSyncHistory(tenantId),
      ]);
      setSummary(summaryRes);
      setHistory(historyRes.runs);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load VinSolutions data");
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleUpload = async (file: File) => {
    if (!tenantId) return;
    setUploading(true);
    setUploadResult(null);
    setError(null);
    try {
      const result = await api.vinUpload(tenantId, file);
      setUploadResult(result);
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); const file = e.dataTransfer.files[0]; if (file) handleUpload(file); };
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) handleUpload(file); };

  if (!tenantId) return <div className="p-8 text-center text-stewart-muted text-sm">No client configured.</div>;
  if (loading && !summary) return <p className="text-sm text-stewart-muted py-8 text-center">Loading VinSolutions data...</p>;

  return (
    <div className="space-y-6">
      <PageInfo pageId="vinsync" title="Import VinSolutions CRM data and view sync history">
        <p>Upload VinSolutions exports to sync leads, appointments, sales, visits, and trade-ins. Data flows into KPI calculations automatically.</p>
      </PageInfo>

      {/* Upload Zone */}
      <div onDragOver={(e) => e.preventDefault()} onDrop={handleDrop} className="border-2 border-dashed border-stewart-border rounded-lg p-8 text-center hover:border-stewart-accent/50 transition-colors">
        <div className="text-sm text-stewart-muted mb-2">
          {uploading ? <span className="text-yellow-400">Importing... this may take 30-60 seconds.</span> : "Drop a VinSolutions .xlsx or .csv export here, or click to browse"}
        </div>
        <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFileSelect} className="hidden" />
        <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="px-4 py-2 bg-stewart-accent/10 text-stewart-accent rounded-md text-sm hover:bg-stewart-accent/20 disabled:opacity-50">
          {uploading ? "Importing..." : "Select File"}
        </button>
      </div>

      {/* Upload Result */}
      {uploadResult && (
        <div className={`p-4 rounded-lg border ${uploadResult.success ? "border-green-500/30 bg-green-500/10" : "border-red-500/30 bg-red-500/10"}`}>
          {uploadResult.success ? (
            <div className="space-y-2">
              <div className="text-sm font-medium text-green-400">Import complete in {fmtDuration(uploadResult.duration_seconds || 0)}</div>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3 text-xs">
                <div><span className="text-stewart-muted">Leads:</span> <span className="text-stewart-text font-medium">{fmtNumber(uploadResult.leads_upserted)}</span></div>
                <div><span className="text-stewart-muted">Appts:</span> <span className="text-stewart-text font-medium">{fmtNumber(uploadResult.appointments_upserted)}</span></div>
                <div><span className="text-stewart-muted">CRM Sales:</span> <span className="text-stewart-text font-medium">{fmtNumber(uploadResult.crm_sales_upserted)}</span></div>
                <div><span className="text-stewart-muted">DMS Deals:</span> <span className="text-stewart-text font-medium">{fmtNumber(uploadResult.dms_sales_upserted)}</span></div>
                <div><span className="text-stewart-muted">Visits:</span> <span className="text-stewart-text font-medium">{fmtNumber(uploadResult.visits_upserted)}</span></div>
                <div><span className="text-stewart-muted">Trades:</span> <span className="text-stewart-text font-medium">{fmtNumber(uploadResult.trade_ins_upserted)}</span></div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-red-400">{uploadResult.error}</div>
          )}
        </div>
      )}

      {error && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-md text-red-400 text-sm">{error}</div>}

      {/* Summary Cards */}
      {summary && (
        <div>
          <h2 className="text-sm font-medium text-stewart-muted uppercase tracking-wider mb-3">Data Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            {[
              { label: "Leads", value: summary.total_leads },
              { label: "Appointments", value: summary.total_appointments },
              { label: "CRM Sales", value: summary.total_crm_sales },
              { label: "DMS Deals", value: summary.total_dms_sales },
              { label: "Visits", value: summary.total_showroom_visits },
              { label: "Trade-Ins", value: summary.total_trade_ins },
            ].map((c) => (
              <div key={c.label} className="p-4 bg-stewart-card rounded-lg border border-stewart-border">
                <div className="text-xs text-stewart-muted">{c.label}</div>
                <div className="text-2xl font-bold text-stewart-text mt-1">{c.value.toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Last Sync */}
      {summary?.last_sync && (
        <div className="p-4 bg-stewart-card rounded-lg border border-stewart-border">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-stewart-muted">Last sync: </span>
              <span className="text-sm text-stewart-text">{summary.last_sync.file_name}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-stewart-muted">{new Date(summary.last_sync.created_at).toLocaleString()}</span>
              <StatusBadge status={summary.last_sync.status} />
            </div>
          </div>
        </div>
      )}

      {/* Sync History */}
      {history.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-stewart-muted uppercase tracking-wider mb-3">Sync History</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stewart-border text-left">
                  <th className="px-3 py-2 text-xs text-stewart-muted font-medium">Date</th>
                  <th className="px-3 py-2 text-xs text-stewart-muted font-medium">File</th>
                  <th className="px-3 py-2 text-xs text-stewart-muted font-medium">Type</th>
                  <th className="px-3 py-2 text-xs text-stewart-muted font-medium text-right">Leads</th>
                  <th className="px-3 py-2 text-xs text-stewart-muted font-medium text-right">Appts</th>
                  <th className="px-3 py-2 text-xs text-stewart-muted font-medium text-right">Sales</th>
                  <th className="px-3 py-2 text-xs text-stewart-muted font-medium text-right">Duration</th>
                  <th className="px-3 py-2 text-xs text-stewart-muted font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {history.map((run) => (
                  <tr key={run.id} className="border-b border-stewart-border/50 hover:bg-stewart-card/50">
                    <td className="px-3 py-2 text-xs text-stewart-text">{new Date(run.created_at).toLocaleString()}</td>
                    <td className="px-3 py-2 text-xs text-stewart-text truncate max-w-[200px]">{run.file_name}</td>
                    <td className="px-3 py-2 text-xs text-stewart-muted capitalize">{run.sync_type}</td>
                    <td className="px-3 py-2 text-xs text-stewart-text text-right">{fmtNumber(run.leads_upserted)}</td>
                    <td className="px-3 py-2 text-xs text-stewart-text text-right">{fmtNumber(run.appointments_upserted)}</td>
                    <td className="px-3 py-2 text-xs text-stewart-text text-right">{fmtNumber(run.crm_sales_upserted + run.dms_sales_upserted)}</td>
                    <td className="px-3 py-2 text-xs text-stewart-text text-right">{fmtDuration(run.duration_seconds)}</td>
                    <td className="px-3 py-2"><StatusBadge status={run.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
