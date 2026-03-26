"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import type { EmailSend, EmailCampaign } from "@/lib/types";
import { statusBadge } from "@/lib/ui/badges";

interface Props {
  tenantId: string;
}

export function SendsTab({ tenantId }: Props) {
  const [sends, setSends] = useState<EmailSend[]>([]);
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [sendTypeFilter, setSendTypeFilter] = useState("");
  const [campaignFilter, setCampaignFilter] = useState("");
  const [error, setError] = useState("");

  const loadCampaigns = useCallback(async () => {
    try {
      setCampaigns(await api.emailListCampaigns(tenantId, undefined, 50));
    } catch { /* campaign list is for dropdown only — degrade gracefully */ }
  }, [tenantId]);

  const loadSends = useCallback(async () => {
    try {
      setSends(
        await api.emailListSends(
          tenantId,
          campaignFilter || undefined,
          sendTypeFilter || undefined,
          statusFilter || undefined,
          100,
        ),
      );
    } catch {
      setError("Failed to load send log");
    }
  }, [tenantId, campaignFilter, sendTypeFilter, statusFilter]);

  useEffect(() => { loadCampaigns(); }, [loadCampaigns]);
  useEffect(() => { loadSends(); }, [loadSends]);

  if (error) {
    return (
      <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-md text-red-400 text-sm">
        {error}
        <button onClick={() => { setError(""); loadSends(); }} className="ml-3 underline">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-3 items-center">
        <div className="flex gap-2">
          {["", "sent", "failed", "bounced"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                statusFilter === s
                  ? "bg-stewart-accent/20 text-stewart-accent"
                  : "bg-stewart-card border border-stewart-border text-stewart-muted hover:text-stewart-text"
              }`}
            >
              {s || "All"}
            </button>
          ))}
        </div>
        <select
          value={sendTypeFilter}
          onChange={(e) => setSendTypeFilter(e.target.value)}
          className="bg-stewart-card border border-stewart-border rounded px-2 py-1 text-sm"
        >
          <option value="">All Types</option>
          <option value="campaign">Campaign</option>
          <option value="transactional">Transactional</option>
        </select>
        <select
          value={campaignFilter}
          onChange={(e) => setCampaignFilter(e.target.value)}
          className="bg-stewart-card border border-stewart-border rounded px-2 py-1 text-sm"
        >
          <option value="">All Campaigns</option>
          {campaigns.map((c) => (
            <option key={c.id} value={c.id}>{c.campaign_name}</option>
          ))}
        </select>
      </div>

      <div className="bg-stewart-card border border-stewart-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stewart-border bg-stewart-bg/50">
              <th className="text-left px-3 py-2 text-xs text-stewart-muted">Email</th>
              <th className="text-left px-3 py-2 text-xs text-stewart-muted">Name</th>
              <th className="text-left px-3 py-2 text-xs text-stewart-muted">Subject</th>
              <th className="text-center px-3 py-2 text-xs text-stewart-muted">Type</th>
              <th className="text-center px-3 py-2 text-xs text-stewart-muted">Status</th>
              <th className="text-left px-3 py-2 text-xs text-stewart-muted">Sent</th>
              <th className="text-left px-3 py-2 text-xs text-stewart-muted">Error</th>
            </tr>
          </thead>
          <tbody>
            {sends.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-stewart-muted">
                  No sends yet.
                </td>
              </tr>
            ) : (
              sends.map((s) => (
                <tr key={s.id} className="border-b border-stewart-border/50 hover:bg-stewart-border/20">
                  <td className="px-3 py-2 text-xs font-mono">{s.email}</td>
                  <td className="px-3 py-2 text-xs">{s.customer_name || "\u2014"}</td>
                  <td className="px-3 py-2 text-xs max-w-[200px] truncate">{s.subject}</td>
                  <td className="px-3 py-2 text-center">{statusBadge(s.send_type)}</td>
                  <td className="px-3 py-2 text-center">{statusBadge(s.status)}</td>
                  <td className="px-3 py-2 text-xs text-stewart-muted">{s.sent_at?.slice(0, 16) || "\u2014"}</td>
                  <td className="px-3 py-2 text-xs text-red-400 max-w-[150px] truncate">{s.error || ""}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
