"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import type { EmailSummary } from "@/lib/types";
import { CampaignsTab } from "./CampaignsTab";
import { TemplatesTab } from "./TemplatesTab";
import { SendsTab } from "./SendsTab";
import { UnsubscribesTab } from "./UnsubscribesTab";
import { ErrorBoundary } from "@/lib/ui/ErrorBoundary";

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
      {/* Header — matches proposal page layout */}
      <div className="border-b border-stewart-border bg-stewart-card">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/sisel" className="text-stewart-muted hover:text-stewart-text text-sm transition-colors">&larr; Back</a>
            <div className="w-px h-6 bg-stewart-border" />
            <div>
              <h1 className="text-xl font-bold text-stewart-text">The Post Office</h1>
              <p className="text-stewart-muted text-xs">Sisel International — Email Marketing & Automation</p>
            </div>
          </div>
          <div className="bg-white rounded-lg px-3 py-1.5">
            <img src="/sisel-logo.png" alt="Sisel" className="h-8 w-auto" />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">
        {loading && <div className="py-12 text-center text-stewart-muted">Loading platform...</div>}

        {!loading && (
          <>
            {/* Summary Cards */}
            {summary && (
              <div className="grid grid-cols-4 gap-3">
                <button onClick={() => setTab("campaigns")} className="bg-stewart-card border border-stewart-border rounded-lg p-4 text-left hover:border-stewart-accent transition-colors cursor-pointer">
                  <p className="text-xs text-stewart-muted mb-1">Total Campaigns</p>
                  <p className="text-xl font-bold text-stewart-accent">{summary.campaigns.total}</p>
                  <p className="text-[11px] text-stewart-muted mt-0.5">{summary.campaigns.sent} sent, {summary.campaigns.draft} drafts</p>
                </button>
                <button onClick={() => setTab("templates")} className="bg-stewart-card border border-stewart-border rounded-lg p-4 text-left hover:border-stewart-accent transition-colors cursor-pointer">
                  <p className="text-xs text-stewart-muted mb-1">Templates</p>
                  <p className="text-xl font-bold text-stewart-accent">{summary.templates}</p>
                  <p className="text-[11px] text-stewart-muted mt-0.5">Ready to use</p>
                </button>
                <button onClick={() => setTab("sends")} className="bg-stewart-card border border-stewart-border rounded-lg p-4 text-left hover:border-stewart-accent transition-colors cursor-pointer">
                  <p className="text-xs text-stewart-muted mb-1">Emails Sent</p>
                  <p className="text-xl font-bold text-green-400">{summary.sends.total}</p>
                  <p className="text-[11px] text-stewart-muted mt-0.5">{summary.sends.sent} delivered, {summary.sends.failed} failed</p>
                </button>
                <button onClick={() => setTab("unsubscribes")} className="bg-stewart-card border border-stewart-border rounded-lg p-4 text-left hover:border-stewart-accent transition-colors cursor-pointer">
                  <p className="text-xs text-stewart-muted mb-1">Unsubscribes</p>
                  <p className={`text-xl font-bold ${summary.unsubscribes > 0 ? "text-orange-400" : "text-green-400"}`}>
                    {summary.unsubscribes}
                  </p>
                  <p className="text-[11px] text-stewart-muted mt-0.5">Auto-synced</p>
                </button>
              </div>
            )}

            {/* Tab Navigation — underline style matching proposal */}
            <div className="flex gap-1 border-b border-stewart-border">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    tab === t.key
                      ? "border-stewart-accent text-stewart-accent"
                      : "border-transparent text-stewart-muted hover:text-stewart-text"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <ErrorBoundary>
              {tab === "campaigns" && <CampaignsTab tenantId={TENANT_ID} onReloadSummary={loadSummary} />}
              {tab === "templates" && <TemplatesTab tenantId={TENANT_ID} onReloadSummary={loadSummary} />}
              {tab === "sends" && <SendsTab tenantId={TENANT_ID} />}
              {tab === "unsubscribes" && <UnsubscribesTab tenantId={TENANT_ID} />}
            </ErrorBoundary>
          </>
        )}
      </div>
    </div>
  );
}
