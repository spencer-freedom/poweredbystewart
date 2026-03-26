"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import type { EmailSummary } from "@/lib/types";
import { CampaignsTab } from "./CampaignsTab";
import { TemplatesTab } from "./TemplatesTab";
import { SendsTab } from "./SendsTab";
import { UnsubscribesTab } from "./UnsubscribesTab";

const TENANT_ID = "sisel";
type PlatformTab = "campaigns" | "templates" | "sends" | "unsubscribes";

const TABS: { key: PlatformTab; label: string }[] = [
  { key: "campaigns", label: "Campaigns" },
  { key: "templates", label: "Templates" },
  { key: "sends", label: "Send Log" },
  { key: "unsubscribes", label: "Unsubscribes" },
];

export default function SiselPostOfficePage() {
  const [tab, setTab] = useState<PlatformTab>("campaigns");
  const [summary, setSummary] = useState<EmailSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSummary = useCallback(async () => {
    try {
      setSummary(await api.emailSummary(TENANT_ID));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadSummary(); }, [loadSummary]);

  return (
    <div className="min-h-screen bg-stewart-bg">
      {/* Header */}
      <div className="border-b border-stewart-border bg-stewart-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="/sisel-logo.png" alt="Sisel International" className="h-10" />
            <div>
              <h1 className="text-xl font-bold text-stewart-text">The Post Office</h1>
              <p className="text-sm text-stewart-muted">Sisel International — Email Marketing & Automation</p>
            </div>
          </div>
          <a
            href="/sisel"
            className="px-4 py-2 text-sm font-medium text-stewart-muted hover:text-stewart-text transition-colors"
          >
            &larr; Back to Proposal
          </a>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {loading && <div className="py-12 text-center text-stewart-muted">Loading platform...</div>}

        {!loading && (
          <>
            {/* Summary Cards */}
            {summary && (
              <div className="grid grid-cols-4 gap-3">
                <button onClick={() => setTab("campaigns")} className="bg-stewart-card border border-stewart-border rounded-lg p-4 text-left hover:border-stewart-accent transition-colors cursor-pointer">
                  <p className="text-xs text-stewart-muted">Total Campaigns</p>
                  <p className="text-2xl font-bold text-stewart-text">{summary.campaigns.total}</p>
                </button>
                <button onClick={() => setTab("templates")} className="bg-stewart-card border border-stewart-border rounded-lg p-4 text-left hover:border-stewart-accent transition-colors cursor-pointer">
                  <p className="text-xs text-stewart-muted">Templates</p>
                  <p className="text-2xl font-bold text-stewart-text">{summary.templates}</p>
                </button>
                <button onClick={() => setTab("sends")} className="bg-stewart-card border border-stewart-border rounded-lg p-4 text-left hover:border-stewart-accent transition-colors cursor-pointer">
                  <p className="text-xs text-stewart-muted">Emails Sent</p>
                  <p className="text-2xl font-bold text-green-400">{summary.sends.total}</p>
                </button>
                <button onClick={() => setTab("unsubscribes")} className="bg-stewart-card border border-stewart-border rounded-lg p-4 text-left hover:border-stewart-accent transition-colors cursor-pointer">
                  <p className="text-xs text-stewart-muted">Unsubscribes</p>
                  <p className={`text-2xl font-bold ${summary.unsubscribes > 0 ? "text-orange-400" : "text-green-400"}`}>
                    {summary.unsubscribes}
                  </p>
                </button>
              </div>
            )}

            {/* Tab Navigation */}
            <div className="flex gap-1">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`px-4 py-2 text-sm rounded-t-lg transition-colors ${
                    tab === t.key
                      ? "bg-stewart-card border border-stewart-border border-b-transparent text-stewart-text font-medium"
                      : "text-stewart-muted hover:text-stewart-text"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {tab === "campaigns" && <CampaignsTab tenantId={TENANT_ID} onReloadSummary={loadSummary} />}
            {tab === "templates" && <TemplatesTab tenantId={TENANT_ID} onReloadSummary={loadSummary} />}
            {tab === "sends" && <SendsTab tenantId={TENANT_ID} />}
            {tab === "unsubscribes" && <UnsubscribesTab tenantId={TENANT_ID} />}
          </>
        )}
      </div>
    </div>
  );
}
