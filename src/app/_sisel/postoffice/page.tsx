"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import type { EmailSummary } from "@/lib/types";
import { CampaignsTab } from "./CampaignsTab";
import { TemplatesTab } from "./TemplatesTab";
import { SendsTab } from "./SendsTab";
import { UnsubscribesTab } from "./UnsubscribesTab";
import { ErrorBoundary } from "@/lib/ui/ErrorBoundary";
import { t, type Lang } from "./i18n";

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
  const [lang, setLang] = useState<Lang>("en");

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
            <div>
              <h1 className="text-xl font-bold text-stewart-text">{t(lang, "The Post Office")}</h1>
              <p className="text-stewart-muted text-xs">{t(lang, "Sisel International — Email Marketing & Automation")}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Language Toggle */}
            <button
              onClick={() => setLang(lang === "en" ? "ja" : "en")}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-stewart-bg border border-stewart-border rounded-lg hover:border-stewart-accent/50 transition-colors"
            >
              <span className={`text-xs font-semibold transition-colors ${lang === "en" ? "text-stewart-accent" : "text-stewart-muted"}`}>EN</span>
              <div className="relative w-8 h-4 bg-stewart-border rounded-full cursor-pointer">
                <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-stewart-accent transition-all ${lang === "ja" ? "left-4.5" : "left-0.5"}`} style={{ left: lang === "ja" ? "18px" : "2px" }} />
              </div>
              <span className={`text-xs font-semibold transition-colors ${lang === "ja" ? "text-stewart-accent" : "text-stewart-muted"}`}>JP</span>
            </button>
            <a href="/sisel" className="px-4 py-2 text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-colors" style={{ backgroundColor: "#1a5c3a" }}>{t(lang, "Proposal")}</a>
            <div className="bg-white rounded-lg px-3 py-1.5">
              <img src="/sisel-logo.png" alt="Sisel" className="h-8 w-auto" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">
        {loading && <div className="py-12 text-center text-stewart-muted">{t(lang, "Loading platform...")}</div>}

        {!loading && (
          <>
            {/* Summary Cards */}
            {summary && (
              <div className="grid grid-cols-4 gap-3">
                {[
                  { key: "campaigns" as const, label: t(lang, "Total Campaigns"), value: summary.campaigns.total, color: "text-stewart-accent", sub: lang === "ja" ? `${summary.campaigns.sent} 送信済み、${summary.campaigns.draft} 下書き` : `${summary.campaigns.sent} sent, ${summary.campaigns.draft} drafts`, arrow: t(lang, "View campaigns") },
                  { key: "templates" as const, label: t(lang, "Templates"), value: summary.templates, color: "text-stewart-accent", sub: t(lang, "Ready to use"), arrow: t(lang, "View templates") },
                  { key: "sends" as const, label: t(lang, "Emails Sent"), value: summary.sends.total, color: "text-green-400", sub: lang === "ja" ? `${summary.sends.sent} 配信済み、${summary.sends.failed} 失敗` : `${summary.sends.sent} delivered, ${summary.sends.failed} failed`, arrow: t(lang, "View send log") },
                  { key: "unsubscribes" as const, label: t(lang, "Unsubscribes"), value: summary.unsubscribes, color: summary.unsubscribes > 0 ? "text-orange-400" : "text-green-400", sub: t(lang, "Auto-synced"), arrow: t(lang, "View unsubscribes") },
                ].map((card) => (
                  <button key={card.key} onClick={() => setTab(card.key)} className="bg-stewart-card border border-stewart-border rounded-lg p-4 text-left hover:border-stewart-accent/50 transition-colors cursor-pointer group">
                    <p className="text-xs text-stewart-muted mb-1">{card.label}</p>
                    <p className={`text-xl font-bold ${card.color}`}>{card.value}</p>
                    <p className="text-[11px] text-stewart-muted mt-0.5">{card.sub}</p>
                    <div className="mt-2 pt-2 border-t border-stewart-border">
                      <span className="text-xs text-stewart-accent opacity-0 group-hover:opacity-100 transition-opacity">{card.arrow} &rarr;</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Tab Navigation — underline style matching proposal */}
            <div className="flex gap-1 border-b border-stewart-border">
              {TABS.map((tb) => (
                <button
                  key={tb.key}
                  onClick={() => setTab(tb.key)}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    tab === tb.key
                      ? "border-stewart-accent text-stewart-accent"
                      : "border-transparent text-stewart-muted hover:text-stewart-text"
                  }`}
                >
                  {t(lang, tb.label)}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <ErrorBoundary>
              {tab === "campaigns" && <CampaignsTab tenantId={TENANT_ID} onReloadSummary={loadSummary} lang={lang} />}
              {tab === "templates" && <TemplatesTab tenantId={TENANT_ID} onReloadSummary={loadSummary} lang={lang} />}
              {tab === "sends" && <SendsTab tenantId={TENANT_ID} lang={lang} />}
              {tab === "unsubscribes" && <UnsubscribesTab tenantId={TENANT_ID} lang={lang} />}
            </ErrorBoundary>
          </>
        )}
      </div>
    </div>
  );
}
