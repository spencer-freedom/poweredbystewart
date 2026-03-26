"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import type { EmailSend, EmailCampaign } from "@/lib/types";
import { statusBadge } from "@/lib/ui/badges";
import { t, type Lang } from "./i18n";

interface Props {
  tenantId: string;
  lang?: Lang;
}

export function SendsTab({ tenantId, lang = "en" }: Props) {
  const [sends, setSends] = useState<EmailSend[]>([]);
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [sendTypeFilter, setSendTypeFilter] = useState("");
  const [campaignFilter, setCampaignFilter] = useState("");
  const [error, setError] = useState("");

  const loadCampaigns = useCallback(async () => {
    try {
      setCampaigns(await api.emailListCampaigns(tenantId, undefined, 50));
    } catch { /* degrade gracefully */ }
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
      <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
        {error}
        <button onClick={() => { setError(""); loadSends(); }} className="ml-3 underline">{t(lang, "Retry")}</button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-stewart-muted uppercase tracking-wide">{t(lang, "Send Log")}</h2>
        <div className="flex gap-3 items-center">
          <select
            value={sendTypeFilter}
            onChange={(e) => setSendTypeFilter(e.target.value)}
            className="bg-stewart-card border border-stewart-border rounded-lg px-3 py-1.5 text-xs text-stewart-text appearance-none cursor-pointer"
          >
            <option value="">{t(lang, "All Types")}</option>
            <option value="campaign">{t(lang, "Campaign")}</option>
            <option value="transactional">{t(lang, "Transactional")}</option>
          </select>
          <select
            value={campaignFilter}
            onChange={(e) => setCampaignFilter(e.target.value)}
            className="bg-stewart-card border border-stewart-border rounded-lg px-3 py-1.5 text-xs text-stewart-text appearance-none cursor-pointer"
          >
            <option value="">{t(lang, "All Campaigns")}</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>{c.campaign_name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex gap-2">
        {["", "sent", "failed", "bounced"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
              statusFilter === s
                ? "bg-stewart-accent/20 text-stewart-accent border border-stewart-accent/30"
                : "bg-stewart-card border border-stewart-border text-stewart-muted hover:text-stewart-text"
            }`}
          >
            {s ? t(lang, s) : t(lang, "All")}
          </button>
        ))}
      </div>

      <div className="bg-stewart-card border border-stewart-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stewart-border">
              <th className="text-left px-4 py-2.5 text-stewart-muted font-medium">{t(lang, "Email")}</th>
              <th className="text-left px-4 py-2.5 text-stewart-muted font-medium">{t(lang, "Name")}</th>
              <th className="text-left px-4 py-2.5 text-stewart-muted font-medium">{t(lang, "Subject")}</th>
              <th className="text-center px-4 py-2.5 text-stewart-muted font-medium">{t(lang, "Type")}</th>
              <th className="text-center px-4 py-2.5 text-stewart-muted font-medium">{t(lang, "Status")}</th>
              <th className="text-right px-4 py-2.5 text-stewart-muted font-medium">{t(lang, "Sent")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stewart-border/30">
            {sends.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-stewart-muted">
                  {t(lang, "No sends yet.")}
                </td>
              </tr>
            ) : (
              sends.map((s) => (
                <tr key={s.id} className="hover:bg-stewart-border/20">
                  <td className="px-4 py-2.5 text-xs font-mono text-stewart-text">{s.email}</td>
                  <td className="px-4 py-2.5 text-xs text-stewart-muted">{s.customer_name || "\u2014"}</td>
                  <td className="px-4 py-2.5 text-xs max-w-[200px] truncate text-stewart-muted">{s.subject}</td>
                  <td className="px-4 py-2.5 text-center">{statusBadge(s.send_type)}</td>
                  <td className="px-4 py-2.5 text-center">{statusBadge(s.status)}</td>
                  <td className="px-4 py-2.5 text-right text-xs text-stewart-muted">{s.sent_at?.slice(0, 16).replace("T", " ") || "\u2014"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
