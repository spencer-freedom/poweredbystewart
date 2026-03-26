"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import type {
  EmailSummary,
  EmailTemplate,
  EmailCampaign,
  EmailSend,
  EmailUnsubscribe,
} from "@/lib/types";

const TENANT_ID = "sisel";

// ─── Top-level tabs ─────────────────────────────────────────────
type TopTab = "platform" | "overview";
type PlatformTab = "campaigns" | "templates" | "sends" | "unsubscribes";

// ─── Helpers ────────────────────────────────────────────────────

function statusBadge(s: string) {
  const colors: Record<string, string> = {
    draft: "bg-blue-500/20 text-blue-400",
    active: "bg-green-500/20 text-green-400",
    scheduled: "bg-purple-500/20 text-purple-400",
    sending: "bg-yellow-500/20 text-yellow-400",
    sent: "bg-green-500/20 text-green-400",
    failed: "bg-red-500/20 text-red-400",
    bounced: "bg-red-500/20 text-red-400",
    delivered: "bg-green-500/20 text-green-400",
    opened: "bg-cyan-500/20 text-cyan-400",
    clicked: "bg-stewart-accent/20 text-stewart-accent",
    custom: "bg-stewart-border text-stewart-muted",
    transactional: "bg-purple-500/20 text-purple-400",
    promotional: "bg-orange-500/20 text-orange-400",
    campaign: "bg-stewart-accent/20 text-stewart-accent",
    newsletter: "bg-blue-500/20 text-blue-400",
    announcement: "bg-cyan-500/20 text-cyan-400",
    onboarding: "bg-green-500/20 text-green-400",
    promotion: "bg-orange-500/20 text-orange-400",
    internal: "bg-stewart-border text-stewart-muted",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[s] || "bg-stewart-border text-stewart-muted"}`}>
      {s.replace(/_/g, " ")}
    </span>
  );
}

function sourceBadge(s: string) {
  const colors: Record<string, string> = {
    link: "bg-blue-500/20 text-blue-400",
    manual: "bg-stewart-border text-stewart-muted",
    ses_bounce: "bg-red-500/20 text-red-400",
    ses_complaint: "bg-orange-500/20 text-orange-400",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[s] || "bg-stewart-border text-stewart-muted"}`}>
      {s.replace(/_/g, " ")}
    </span>
  );
}

// ─── Defaults ───────────────────────────────────────────────────

const defaultCampaignForm = {
  campaign_name: "",
  subject: "",
  template_id: "",
  body_html: "",
  body_text: "",
  scheduled_at: "",
};

const defaultTemplateForm = {
  template_name: "",
  template_type: "custom",
  subject_template: "",
  html_content: "",
  text_content: "",
  variables: "",
  status: "draft",
};

// ═════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═════════════════════════════════════════════════════════════════

export default function SiselPage() {
  const [topTab, setTopTab] = useState<TopTab>("platform");

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
          <div className="flex gap-1">
            {([
              { key: "platform" as TopTab, label: "Platform" },
              { key: "overview" as TopTab, label: "Overview" },
            ]).map((t) => (
              <button
                key={t.key}
                onClick={() => setTopTab(t.key)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  topTab === t.key
                    ? "bg-stewart-accent/20 text-stewart-accent"
                    : "text-stewart-muted hover:text-stewart-text"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {topTab === "platform" ? <PlatformView /> : <OverviewTab />}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
// PLATFORM VIEW — The real email tool
// ═════════════════════════════════════════════════════════════════

function PlatformView() {
  const [tab, setTab] = useState<PlatformTab>("campaigns");
  const [summary, setSummary] = useState<EmailSummary | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // Campaigns
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [campaignFilter, setCampaignFilter] = useState("");
  const [selectedCampaign, setSelectedCampaign] = useState<EmailCampaign | null>(null);
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);
  const [campaignForm, setCampaignForm] = useState(defaultCampaignForm);
  const [campaignEditorMode, setCampaignEditorMode] = useState<"simple" | "html">("simple");
  const [showHtmlPreview, setShowHtmlPreview] = useState(false);
  const [sendConfirm, setSendConfirm] = useState<{ campaignId: string; preview: { recipient_count: number; subject: string } } | null>(null);

  // Templates
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [templateForm, setTemplateForm] = useState(defaultTemplateForm);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [showTemplatePreview, setShowTemplatePreview] = useState(false);

  // Sends
  const [sends, setSends] = useState<EmailSend[]>([]);
  const [sendFilter, setSendFilter] = useState("");
  const [sendTypeFilter, setSendTypeFilter] = useState("");
  const [sendCampaignFilter, setSendCampaignFilter] = useState("");

  // Unsubscribes
  const [unsubscribes, setUnsubscribes] = useState<EmailUnsubscribe[]>([]);

  // ─── Data loaders ───────────────────────────────────────────

  const loadSummary = useCallback(async () => {
    try {
      const res = await api.emailSummary(TENANT_ID);
      setSummary(res);
    } catch {
      setError("Failed to load summary");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCampaigns = useCallback(async () => {
    try {
      const res = await api.emailListCampaigns(TENANT_ID, campaignFilter || undefined, 50);
      setCampaigns(res);
    } catch {
      setError("Failed to load campaigns");
    }
  }, [campaignFilter]);

  const loadTemplates = useCallback(async () => {
    try {
      const res = await api.emailListTemplates(TENANT_ID, 50);
      setTemplates(res);
    } catch {
      setError("Failed to load templates");
    }
  }, []);

  const loadSends = useCallback(async () => {
    try {
      const res = await api.emailListSends(
        TENANT_ID,
        sendCampaignFilter || undefined,
        sendTypeFilter || undefined,
        100,
      );
      setSends(res);
    } catch {
      setError("Failed to load send log");
    }
  }, [sendCampaignFilter, sendTypeFilter]);

  const loadUnsubscribes = useCallback(async () => {
    try {
      const res = await api.emailListUnsubscribes(TENANT_ID, 100);
      setUnsubscribes(res);
    } catch {
      setError("Failed to load unsubscribes");
    }
  }, []);

  useEffect(() => { loadSummary(); }, [loadSummary]);

  useEffect(() => {
    if (tab === "campaigns") { loadCampaigns(); loadTemplates(); }
    if (tab === "templates") loadTemplates();
    if (tab === "sends") { loadSends(); loadCampaigns(); }
    if (tab === "unsubscribes") loadUnsubscribes();
  }, [tab, loadCampaigns, loadTemplates, loadSends, loadUnsubscribes]);

  // ─── Handlers ───────────────────────────────────────────────

  const handleCreateCampaign = async () => {
    try {
      await api.emailCreateCampaign(TENANT_ID, {
        campaign_name: campaignForm.campaign_name,
        subject: campaignForm.subject,
        template_id: campaignForm.template_id || null,
        body_html: campaignForm.body_html,
        body_text: campaignForm.body_text,
        scheduled_at: campaignForm.scheduled_at || null,
      });
      setShowCreateCampaign(false);
      setCampaignForm(defaultCampaignForm);
      setCampaignEditorMode("simple");
      loadCampaigns();
      loadSummary();
    } catch {
      setError("Failed to create campaign");
    }
  };

  const handlePreviewCampaign = async (campaignId: string) => {
    try {
      const res = await api.emailSendCampaign(TENANT_ID, campaignId, true);
      setSendConfirm({
        campaignId,
        preview: {
          recipient_count: (res.recipient_count as number) ?? 0,
          subject: campaigns.find((c) => c.id === campaignId)?.subject || "",
        },
      });
    } catch {
      setError("Failed to preview campaign");
    }
  };

  const handleSendCampaign = async (campaignId: string) => {
    try {
      await api.emailSendCampaign(TENANT_ID, campaignId, false);
      setSendConfirm(null);
      loadCampaigns();
      loadSummary();
    } catch {
      setError("Failed to send campaign");
    }
  };

  const handleCreateTemplate = async () => {
    try {
      await api.emailCreateTemplate(TENANT_ID, {
        template_name: templateForm.template_name,
        template_type: templateForm.template_type,
        subject_template: templateForm.subject_template,
        html_content: templateForm.html_content,
        text_content: templateForm.text_content,
        variables: templateForm.variables ? templateForm.variables.split(",").map((v: string) => v.trim()).filter(Boolean) : [],
        status: templateForm.status,
      });
      setShowCreateTemplate(false);
      setTemplateForm(defaultTemplateForm);
      loadTemplates();
      loadSummary();
    } catch {
      setError("Failed to create template");
    }
  };

  const handleEditTemplate = (t: EmailTemplate) => {
    setEditingTemplate(t);
    setTemplateForm({
      template_name: t.template_name,
      template_type: t.template_type,
      subject_template: t.subject_template,
      html_content: t.html_content,
      text_content: t.text_content,
      variables: (t.variables || []).join(", "),
      status: t.status,
    });
    setShowCreateTemplate(true);
    setSelectedTemplate(null);
  };

  const handleSaveTemplate = async () => {
    if (!editingTemplate) {
      await handleCreateTemplate();
      return;
    }
    try {
      await api.emailUpdateTemplate(TENANT_ID, editingTemplate.id, {
        template_name: templateForm.template_name,
        template_type: templateForm.template_type,
        subject_template: templateForm.subject_template,
        html_content: templateForm.html_content,
        text_content: templateForm.text_content,
        variables: templateForm.variables ? templateForm.variables.split(",").map((v: string) => v.trim()).filter(Boolean) : [],
        status: templateForm.status,
      });
      setShowCreateTemplate(false);
      setEditingTemplate(null);
      setTemplateForm(defaultTemplateForm);
      loadTemplates();
    } catch {
      setError("Failed to update template");
    }
  };

  // ─── Render ─────────────────────────────────────────────────

  if (error) {
    return (
      <div className="p-6">
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-md text-red-400 text-sm">
          {error}
          <button onClick={() => { setError(""); loadSummary(); }} className="ml-3 underline">Retry</button>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="p-6 text-center text-stewart-muted">Loading platform...</div>;
  }

  return (
    <div className="p-6 space-y-6">
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

      {/* Platform Sub-tabs */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {([
            { key: "campaigns" as PlatformTab, label: "Campaigns" },
            { key: "templates" as PlatformTab, label: "Templates" },
            { key: "sends" as PlatformTab, label: "Send Log" },
            { key: "unsubscribes" as PlatformTab, label: "Unsubscribes" },
          ]).map((t) => (
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
        {tab === "campaigns" && (
          <button
            onClick={() => { setShowCreateCampaign(true); setSelectedCampaign(null); setCampaignEditorMode("simple"); }}
            className="px-3 py-1.5 text-xs bg-stewart-accent/10 text-stewart-accent border border-stewart-accent/30 rounded-md hover:bg-stewart-accent/20 transition-colors"
          >
            + New Campaign
          </button>
        )}
        {tab === "templates" && (
          <button
            onClick={() => { setShowCreateTemplate(true); setEditingTemplate(null); setTemplateForm(defaultTemplateForm); setSelectedTemplate(null); }}
            className="px-3 py-1.5 text-xs bg-stewart-accent/10 text-stewart-accent border border-stewart-accent/30 rounded-md hover:bg-stewart-accent/20 transition-colors"
          >
            + New Template
          </button>
        )}
      </div>

      {/* Send Confirmation Modal */}
      {sendConfirm && (
        <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-yellow-400 mb-2">Confirm Send</h3>
          <p className="text-sm text-stewart-muted mb-1">
            Subject: <span className="text-stewart-text">{sendConfirm.preview.subject}</span>
          </p>
          <p className="text-sm text-stewart-muted mb-3">
            Recipients: <span className="text-stewart-text font-bold">{sendConfirm.preview.recipient_count}</span>
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => handleSendCampaign(sendConfirm.campaignId)}
              className="px-4 py-1.5 text-sm bg-green-500/20 text-green-400 border border-green-500/30 rounded hover:bg-green-500/30 transition-colors"
            >
              Confirm Send
            </button>
            <button
              onClick={() => setSendConfirm(null)}
              className="px-4 py-1.5 text-sm text-stewart-muted hover:text-stewart-text"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ======================== CAMPAIGNS TAB ======================== */}
      {tab === "campaigns" && (
        <div className="flex gap-4">
          <div className={`${selectedCampaign ? "w-1/2" : "w-full"} space-y-4`}>
            {/* Create Campaign Form */}
            {showCreateCampaign && (
              <div className="bg-stewart-card border border-stewart-accent/30 rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-semibold">New Campaign</h3>
                  <button onClick={() => { setShowCreateCampaign(false); setCampaignEditorMode("simple"); }} className="text-xs text-stewart-muted hover:text-stewart-text">Cancel</button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-stewart-muted">Campaign Name</label>
                    <input
                      value={campaignForm.campaign_name}
                      onChange={(e) => setCampaignForm({ ...campaignForm, campaign_name: e.target.value })}
                      className="w-full bg-stewart-bg border border-stewart-border rounded px-2 py-1 text-sm mt-1"
                      placeholder="e.g. April Product Spotlight"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-stewart-muted">Subject Line</label>
                    <input
                      value={campaignForm.subject}
                      onChange={(e) => setCampaignForm({ ...campaignForm, subject: e.target.value })}
                      className="w-full bg-stewart-bg border border-stewart-border rounded px-2 py-1 text-sm mt-1"
                      placeholder="e.g. Spring Into Wellness"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-stewart-muted">Template (optional)</label>
                    <select
                      value={campaignForm.template_id}
                      onChange={(e) => setCampaignForm({ ...campaignForm, template_id: e.target.value })}
                      className="w-full bg-stewart-bg border border-stewart-border rounded px-2 py-1 text-sm mt-1"
                    >
                      <option value="">Custom (inline)</option>
                      {templates.map((t) => (
                        <option key={t.id} value={t.id}>{t.template_name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-stewart-muted">Schedule (optional)</label>
                    <input
                      type="datetime-local"
                      value={campaignForm.scheduled_at}
                      onChange={(e) => setCampaignForm({ ...campaignForm, scheduled_at: e.target.value })}
                      className="w-full bg-stewart-bg border border-stewart-border rounded px-2 py-1 text-sm mt-1"
                    />
                  </div>
                </div>

                {/* Editor Mode Toggle — Simple vs Custom HTML */}
                {!campaignForm.template_id && (
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1 bg-stewart-bg rounded-lg p-0.5">
                        <button
                          onClick={() => setCampaignEditorMode("simple")}
                          className={`px-3 py-1 text-xs rounded-md transition-colors ${
                            campaignEditorMode === "simple"
                              ? "bg-stewart-card text-stewart-text shadow-sm"
                              : "text-stewart-muted hover:text-stewart-text"
                          }`}
                        >
                          Simple Editor
                        </button>
                        <button
                          onClick={() => setCampaignEditorMode("html")}
                          className={`px-3 py-1 text-xs rounded-md transition-colors ${
                            campaignEditorMode === "html"
                              ? "bg-stewart-card text-stewart-text shadow-sm"
                              : "text-stewart-muted hover:text-stewart-text"
                          }`}
                        >
                          Custom HTML
                        </button>
                      </div>
                      {campaignEditorMode === "html" && (
                        <span className="text-[10px] text-green-400">
                          Paste any HTML — long URLs, custom buttons, tracking parameters. No character limits.
                        </span>
                      )}
                    </div>

                    {campaignEditorMode === "simple" ? (
                      <>
                        <div>
                          <label className="text-xs text-stewart-muted">Body HTML</label>
                          <textarea
                            value={campaignForm.body_html}
                            onChange={(e) => setCampaignForm({ ...campaignForm, body_html: e.target.value })}
                            className="w-full bg-stewart-bg border border-stewart-border rounded px-2 py-1 text-sm mt-1 h-24 font-mono"
                            placeholder="<h1>Hello!</h1>"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-stewart-muted">Body Text (plain text fallback)</label>
                          <textarea
                            value={campaignForm.body_text}
                            onChange={(e) => setCampaignForm({ ...campaignForm, body_text: e.target.value })}
                            className="w-full bg-stewart-bg border border-stewart-border rounded px-2 py-1 text-sm mt-1 h-16 font-mono"
                            placeholder="Plain text version"
                          />
                        </div>
                      </>
                    ) : (
                      /* ─── Custom HTML Editor ─── */
                      <div className="space-y-3">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-xs text-stewart-muted">HTML Email Content</label>
                            <button
                              onClick={() => setShowHtmlPreview(!showHtmlPreview)}
                              className="text-[10px] text-stewart-accent hover:underline"
                            >
                              {showHtmlPreview ? "Hide Preview" : "Show Preview"}
                            </button>
                          </div>
                          <textarea
                            value={campaignForm.body_html}
                            onChange={(e) => setCampaignForm({ ...campaignForm, body_html: e.target.value })}
                            className="w-full bg-stewart-bg border border-stewart-border rounded px-3 py-2 text-sm mt-1 font-mono text-green-300"
                            rows={16}
                            placeholder="Paste your full HTML email here — includes support for long CTA links, embedded tracking parameters, and custom formatting."
                          />
                          {campaignForm.body_html && (
                            <p className="text-[10px] text-stewart-muted mt-1">
                              {campaignForm.body_html.length.toLocaleString()} characters
                            </p>
                          )}
                        </div>
                        {showHtmlPreview && campaignForm.body_html && (
                          <div>
                            <p className="text-xs text-stewart-muted mb-1">Live Preview</p>
                            <div className="border border-stewart-border rounded-lg overflow-hidden bg-white">
                              <iframe
                                srcDoc={campaignForm.body_html}
                                className="w-full border-0"
                                style={{ height: "400px" }}
                                sandbox="allow-same-origin"
                                title="Email Preview"
                              />
                            </div>
                          </div>
                        )}
                        <div>
                          <label className="text-xs text-stewart-muted">Plain Text Fallback (optional)</label>
                          <textarea
                            value={campaignForm.body_text}
                            onChange={(e) => setCampaignForm({ ...campaignForm, body_text: e.target.value })}
                            className="w-full bg-stewart-bg border border-stewart-border rounded px-2 py-1 text-sm mt-1 h-12 font-mono"
                            placeholder="Plain text version for email clients that don't render HTML"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-3 flex justify-end">
                  <button
                    onClick={handleCreateCampaign}
                    disabled={!campaignForm.campaign_name || !campaignForm.subject}
                    className="px-4 py-1.5 text-sm bg-stewart-accent/20 text-stewart-accent border border-stewart-accent/30 rounded hover:bg-stewart-accent/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Create Draft
                  </button>
                </div>
              </div>
            )}

            {/* Campaign Filter Chips */}
            <div className="flex gap-2">
              {["", "draft", "scheduled", "sending", "sent"].map((s) => (
                <button
                  key={s}
                  onClick={() => setCampaignFilter(s)}
                  className={`px-3 py-1 text-xs rounded transition-colors ${
                    campaignFilter === s
                      ? "bg-stewart-accent/20 text-stewart-accent"
                      : "bg-stewart-card border border-stewart-border text-stewart-muted hover:text-stewart-text"
                  }`}
                >
                  {s || "All"}
                </button>
              ))}
            </div>

            {/* Campaign List */}
            <div className="bg-stewart-card border border-stewart-border rounded-lg divide-y divide-stewart-border/50">
              {campaigns.length === 0 ? (
                <div className="px-4 py-8 text-center text-stewart-muted text-sm">
                  No campaigns yet. Click + New Campaign to create one.
                </div>
              ) : (
                campaigns.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCampaign(selectedCampaign?.id === c.id ? null : c)}
                    className={`w-full text-left px-4 py-3 hover:bg-stewart-border/20 transition-colors ${
                      selectedCampaign?.id === c.id ? "bg-stewart-border/30" : ""
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{c.campaign_name}</span>
                      {statusBadge(c.status)}
                    </div>
                    <div className="flex gap-3 mt-1 text-xs text-stewart-muted">
                      <span>{c.subject || "No subject"}</span>
                      {c.total_recipients > 0 && <span>{c.total_recipients} recipients</span>}
                      <span>{c.created_at?.slice(0, 10)}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Campaign Detail Panel */}
          {selectedCampaign && (
            <div className="w-1/2 bg-stewart-card border border-stewart-border rounded-lg p-4 space-y-4 h-fit">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-semibold">{selectedCampaign.campaign_name}</h3>
                  <p className="text-xs text-stewart-muted mt-0.5">{selectedCampaign.subject}</p>
                </div>
                {statusBadge(selectedCampaign.status)}
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Sent", val: selectedCampaign.sent_count, color: "" },
                  { label: "Delivered", val: selectedCampaign.delivered_count, color: "text-green-400" },
                  { label: "Opened", val: selectedCampaign.opened_count, color: "text-cyan-400" },
                  { label: "Clicked", val: selectedCampaign.clicked_count, color: "text-stewart-accent" },
                  { label: "Bounced", val: selectedCampaign.bounced_count, color: "text-red-400" },
                  { label: "Unsubs", val: selectedCampaign.unsubscribed_count, color: "text-orange-400" },
                ].map(({ label, val, color }) => (
                  <div key={label} className="bg-stewart-bg/50 rounded p-2 text-center">
                    <p className="text-[10px] text-stewart-muted">{label}</p>
                    <p className={`text-sm font-bold ${color}`}>{val}</p>
                  </div>
                ))}
              </div>

              {/* Details */}
              <div className="text-xs space-y-1 text-stewart-muted">
                {selectedCampaign.scheduled_at && (
                  <p>Scheduled: <span className="text-stewart-text">{selectedCampaign.scheduled_at.slice(0, 16)}</span></p>
                )}
                {selectedCampaign.sent_at && (
                  <p>Sent: <span className="text-stewart-text">{selectedCampaign.sent_at.slice(0, 16)}</span></p>
                )}
                <p>Created: <span className="text-stewart-text">{selectedCampaign.created_at?.slice(0, 16)}</span></p>
              </div>

              {/* HTML Preview for selected campaign */}
              {selectedCampaign.body_html && (
                <div>
                  <p className="text-[10px] text-stewart-muted uppercase tracking-wide mb-1">Email Preview</p>
                  <div className="border border-stewart-border rounded-lg overflow-hidden bg-white">
                    <iframe
                      srcDoc={selectedCampaign.body_html}
                      className="w-full border-0"
                      style={{ height: "300px" }}
                      sandbox="allow-same-origin"
                      title="Campaign Preview"
                    />
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2 border-t border-stewart-border/50">
                {(selectedCampaign.status === "draft" || selectedCampaign.status === "scheduled") && (
                  <>
                    <button
                      onClick={() => handlePreviewCampaign(selectedCampaign.id)}
                      className="px-3 py-1 text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded hover:bg-blue-500/30 transition-colors"
                    >
                      Preview / Dry Run
                    </button>
                    <button
                      onClick={() => handlePreviewCampaign(selectedCampaign.id)}
                      className="px-3 py-1 text-xs bg-green-500/20 text-green-400 border border-green-500/30 rounded hover:bg-green-500/30 transition-colors"
                    >
                      Send
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================== TEMPLATES TAB ======================== */}
      {tab === "templates" && (
        <div className="flex gap-4">
          <div className={`${selectedTemplate ? "w-1/2" : "w-full"} space-y-4`}>
            {/* Create/Edit Template Form */}
            {showCreateTemplate && (
              <div className="bg-stewart-card border border-stewart-accent/30 rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-semibold">
                    {editingTemplate ? "Edit Template" : "New Template"}
                  </h3>
                  <button onClick={() => { setShowCreateTemplate(false); setEditingTemplate(null); setTemplateForm(defaultTemplateForm); }} className="text-xs text-stewart-muted hover:text-stewart-text">Cancel</button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-stewart-muted">Template Name</label>
                    <input
                      value={templateForm.template_name}
                      onChange={(e) => setTemplateForm({ ...templateForm, template_name: e.target.value })}
                      className="w-full bg-stewart-bg border border-stewart-border rounded px-2 py-1 text-sm mt-1"
                      placeholder="e.g. Distributor Welcome"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-stewart-muted">Type</label>
                    <select
                      value={templateForm.template_type}
                      onChange={(e) => setTemplateForm({ ...templateForm, template_type: e.target.value })}
                      className="w-full bg-stewart-bg border border-stewart-border rounded px-2 py-1 text-sm mt-1"
                    >
                      <option value="custom">Custom</option>
                      <option value="newsletter">Newsletter</option>
                      <option value="announcement">Announcement</option>
                      <option value="onboarding">Onboarding</option>
                      <option value="promotion">Promotion</option>
                      <option value="internal">Internal</option>
                      <option value="transactional">Transactional</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-stewart-muted">Status</label>
                    <select
                      value={templateForm.status}
                      onChange={(e) => setTemplateForm({ ...templateForm, status: e.target.value })}
                      className="w-full bg-stewart-bg border border-stewart-border rounded px-2 py-1 text-sm mt-1"
                    >
                      <option value="draft">Draft</option>
                      <option value="active">Active</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-stewart-muted">Variables (comma-separated)</label>
                    <input
                      value={templateForm.variables}
                      onChange={(e) => setTemplateForm({ ...templateForm, variables: e.target.value })}
                      className="w-full bg-stewart-bg border border-stewart-border rounded px-2 py-1 text-sm mt-1"
                      placeholder="name, unsubscribe_url"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-stewart-muted">Subject Template</label>
                    <input
                      value={templateForm.subject_template}
                      onChange={(e) => setTemplateForm({ ...templateForm, subject_template: e.target.value })}
                      className="w-full bg-stewart-bg border border-stewart-border rounded px-2 py-1 text-sm mt-1"
                      placeholder="e.g. Welcome to the Sisel Family, {name}"
                    />
                  </div>
                  <div className="col-span-2">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs text-stewart-muted">HTML Content</label>
                      {templateForm.html_content && (
                        <button
                          onClick={() => setShowTemplatePreview(!showTemplatePreview)}
                          className="text-[10px] text-stewart-accent hover:underline"
                        >
                          {showTemplatePreview ? "Hide Preview" : "Show Preview"}
                        </button>
                      )}
                    </div>
                    <textarea
                      value={templateForm.html_content}
                      onChange={(e) => setTemplateForm({ ...templateForm, html_content: e.target.value })}
                      className="w-full bg-stewart-bg border border-stewart-border rounded px-3 py-2 text-sm mt-1 font-mono text-green-300"
                      rows={12}
                      placeholder="Paste HTML email template — supports long URLs, custom CTA buttons, tracking parameters."
                    />
                    {templateForm.html_content && (
                      <p className="text-[10px] text-stewart-muted mt-1">
                        {templateForm.html_content.length.toLocaleString()} characters
                      </p>
                    )}
                  </div>
                  {showTemplatePreview && templateForm.html_content && (
                    <div className="col-span-2">
                      <p className="text-xs text-stewart-muted mb-1">Live Preview</p>
                      <div className="border border-stewart-border rounded-lg overflow-hidden bg-white">
                        <iframe
                          srcDoc={templateForm.html_content}
                          className="w-full border-0"
                          style={{ height: "350px" }}
                          sandbox="allow-same-origin"
                          title="Template Preview"
                        />
                      </div>
                    </div>
                  )}
                  <div className="col-span-2">
                    <label className="text-xs text-stewart-muted">Text Content (plain text fallback)</label>
                    <textarea
                      value={templateForm.text_content}
                      onChange={(e) => setTemplateForm({ ...templateForm, text_content: e.target.value })}
                      className="w-full bg-stewart-bg border border-stewart-border rounded px-2 py-1 text-sm mt-1 h-16 font-mono"
                      placeholder="Plain text version"
                    />
                  </div>
                </div>
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={handleSaveTemplate}
                    disabled={!templateForm.template_name}
                    className="px-4 py-1.5 text-sm bg-stewart-accent/20 text-stewart-accent border border-stewart-accent/30 rounded hover:bg-stewart-accent/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {editingTemplate ? "Save Changes" : "Create Template"}
                  </button>
                </div>
              </div>
            )}

            {/* Template List */}
            <div className="bg-stewart-card border border-stewart-border rounded-lg divide-y divide-stewart-border/50">
              {templates.length === 0 ? (
                <div className="px-4 py-8 text-center text-stewart-muted text-sm">
                  No templates yet. Click + New Template to create one.
                </div>
              ) : (
                templates.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTemplate(selectedTemplate?.id === t.id ? null : t)}
                    className={`w-full text-left px-4 py-3 hover:bg-stewart-border/20 transition-colors ${
                      selectedTemplate?.id === t.id ? "bg-stewart-border/30" : ""
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{t.template_name}</span>
                      <div className="flex gap-1">
                        {statusBadge(t.template_type)}
                        {statusBadge(t.status)}
                      </div>
                    </div>
                    <div className="flex gap-3 mt-1 text-xs text-stewart-muted">
                      <span>{t.subject_template || "No subject"}</span>
                      <span>{(t.variables || []).length} vars</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Template Detail Panel */}
          {selectedTemplate && (
            <div className="w-1/2 bg-stewart-card border border-stewart-border rounded-lg p-4 space-y-4 h-fit">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-semibold">{selectedTemplate.template_name}</h3>
                  <p className="text-xs text-stewart-muted mt-0.5">{selectedTemplate.subject_template}</p>
                </div>
                <div className="flex gap-1">
                  {statusBadge(selectedTemplate.template_type)}
                  {statusBadge(selectedTemplate.status)}
                </div>
              </div>

              {selectedTemplate.variables && selectedTemplate.variables.length > 0 && (
                <div>
                  <p className="text-[10px] text-stewart-muted uppercase tracking-wide mb-1">Variables</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedTemplate.variables.map((v) => (
                      <span key={v} className="px-2 py-0.5 bg-stewart-border rounded text-xs font-mono">
                        {`{${v}}`}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* HTML Rendered Preview */}
              {selectedTemplate.html_content && (
                <div>
                  <p className="text-[10px] text-stewart-muted uppercase tracking-wide mb-1">Email Preview</p>
                  <div className="border border-stewart-border rounded-lg overflow-hidden bg-white">
                    <iframe
                      srcDoc={selectedTemplate.html_content}
                      className="w-full border-0"
                      style={{ height: "300px" }}
                      sandbox="allow-same-origin"
                      title="Template Preview"
                    />
                  </div>
                </div>
              )}

              {selectedTemplate.text_content && (
                <div>
                  <p className="text-[10px] text-stewart-muted uppercase tracking-wide mb-1">Text Preview</p>
                  <div className="bg-stewart-bg rounded p-3 text-xs max-h-32 overflow-auto whitespace-pre-wrap">
                    {selectedTemplate.text_content}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2 border-t border-stewart-border/50">
                <button
                  onClick={() => handleEditTemplate(selectedTemplate)}
                  className="px-3 py-1 text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded hover:bg-blue-500/30 transition-colors"
                >
                  Edit
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================== SEND LOG TAB ======================== */}
      {tab === "sends" && (
        <div className="space-y-4">
          <div className="flex gap-3 items-center">
            <div className="flex gap-2">
              {["", "sent", "failed", "bounced"].map((s) => (
                <button
                  key={s}
                  onClick={() => setSendFilter(s)}
                  className={`px-3 py-1 text-xs rounded transition-colors ${
                    sendFilter === s
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
              value={sendCampaignFilter}
              onChange={(e) => setSendCampaignFilter(e.target.value)}
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
                  sends
                    .filter((s) => !sendFilter || s.status === sendFilter)
                    .map((s) => (
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
      )}

      {/* ======================== UNSUBSCRIBES TAB ======================== */}
      {tab === "unsubscribes" && (
        <div className="space-y-4">
          <div className="bg-stewart-card border border-stewart-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stewart-border bg-stewart-bg/50">
                  <th className="text-left px-3 py-2 text-xs text-stewart-muted">Email</th>
                  <th className="text-left px-3 py-2 text-xs text-stewart-muted">Reason</th>
                  <th className="text-center px-3 py-2 text-xs text-stewart-muted">Source</th>
                  <th className="text-left px-3 py-2 text-xs text-stewart-muted">Date</th>
                </tr>
              </thead>
              <tbody>
                {unsubscribes.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-8 text-center text-stewart-muted">
                      No unsubscribes. CAN-SPAM compliance link is included in every email.
                    </td>
                  </tr>
                ) : (
                  unsubscribes.map((u) => (
                    <tr key={u.id} className="border-b border-stewart-border/50 hover:bg-stewart-border/20">
                      <td className="px-3 py-2 text-xs font-mono">{u.email}</td>
                      <td className="px-3 py-2 text-xs text-stewart-muted">{u.reason || "\u2014"}</td>
                      <td className="px-3 py-2 text-center">{sourceBadge(u.source)}</td>
                      <td className="px-3 py-2 text-xs text-stewart-muted">{u.created_at?.slice(0, 10)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
// OVERVIEW TAB — The pitch / proposal (secondary)
// ═════════════════════════════════════════════════════════════════

function ProposalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-stewart-text border-b border-stewart-border pb-2">{title}</h2>
      {children}
    </div>
  );
}

const COST_COMPARISON = [
  { feature: "Monthly cost", mailchimp: "$450/mo", platform: "$500/mo" },
  { feature: "Automation flows", mailchimp: "Not included", platform: "Included" },
  { feature: "Exigo integration", mailchimp: "66 hours quoted", platform: "Included" },
  { feature: "Purchase segments", mailchimp: "Manual CSV exports", platform: "Automatic from Exigo" },
  { feature: "Dead email charges", mailchimp: "You pay for all", platform: "Sorted + cleaned" },
  { feature: "List cleaning", mailchimp: "Manual", platform: "Automatic" },
  { feature: "Unsubscribe handling", mailchimp: "Manual sync needed", platform: "Auto + synced to Exigo" },
  { feature: "Email limit", mailchimp: "Tiered / capped", platform: "Unlimited" },
  { feature: "Custom HTML support", mailchimp: "Character limits on links", platform: "No limits — paste any HTML" },
];

function OverviewTab() {
  return (
    <div className="p-6 space-y-8 max-w-3xl">
      <ProposalSection title="The Opportunity">
        <p className="text-stewart-text text-sm leading-relaxed">
          Right now, your customer data lives inside Exigo, but it{"'"}s not being fully used to drive
          follow-up, retention, or repeat purchases.
        </p>
        <ul className="space-y-2 text-sm text-stewart-muted">
          <li className="flex items-start gap-2"><span className="text-stewart-accent mt-0.5">-</span>You{"'"}re paying ~$450/month for Mailchimp with limited automation tied to your actual customer data</li>
          <li className="flex items-start gap-2"><span className="text-stewart-accent mt-0.5">-</span>A portion of that cost goes toward inactive or unusable email addresses</li>
          <li className="flex items-start gap-2"><span className="text-stewart-accent mt-0.5">-</span>There{"'"}s no direct connection between purchase behavior and marketing</li>
          <li className="flex items-start gap-2"><span className="text-stewart-accent mt-0.5">-</span>Custom HTML with long tracking links breaks in Mailchimp</li>
          <li className="flex items-start gap-2"><span className="text-stewart-accent mt-0.5">-</span>Exigo quoted <strong className="text-stewart-text">66 hours of development time</strong> just to connect to Mailchimp</li>
        </ul>
      </ProposalSection>

      <ProposalSection title="What the Platform Does">
        <div className="space-y-4">
          {[
            { label: "Direct Exigo Sync", desc: "Your customer database and order history sync automatically via Exigo's API. No manual exports, no CSV uploads, no 66-hour integration project." },
            { label: "Smart Contact Buckets", desc: "Every contact is automatically sorted: Active, Bounced, Unsubscribed, Complained, or Inactive. You see exactly how many people are in each bucket." },
            { label: "Purchase-Based Targeting", desc: "Create segments based on real behavior. \"Bought in the last 90 days.\" \"Spent over $500 lifetime.\" \"Hasn't ordered in 60 days.\"" },
            { label: "Automated Email Flows", desc: "Welcome series, reorder reminders, win-back sequences, cross-sell emails, rank advancement notifications. Set up once, run automatically." },
            { label: "Custom HTML — No Limits", desc: "Paste any HTML email content including long CTA links, embedded tracking parameters, and custom formatting. No character limits, no broken links. Your product review URLs work exactly as intended." },
            { label: "Full Campaign Management", desc: "Pick a template, choose your audience, preview, and send. Track opens, clicks, and engagement. Unlimited sending." },
          ].map((item) => (
            <div key={item.label} className="bg-stewart-card border border-stewart-border rounded-lg p-4">
              <h3 className="text-sm font-semibold text-stewart-text mb-1">{item.label}</h3>
              <p className="text-xs text-stewart-muted leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </ProposalSection>

      <ProposalSection title="Cost Comparison">
        <div className="overflow-hidden rounded-lg border border-stewart-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-stewart-border/50">
                <th className="text-left px-4 py-2.5 text-stewart-muted font-medium"></th>
                <th className="text-center px-4 py-2.5 text-stewart-muted font-medium">Mailchimp (Current)</th>
                <th className="text-center px-4 py-2.5 text-stewart-accent font-semibold">This Platform</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stewart-border/30">
              {COST_COMPARISON.map((row, i) => (
                <tr key={row.feature} className={i % 2 === 0 ? "bg-stewart-card" : "bg-stewart-bg"}>
                  <td className="px-4 py-2.5 font-medium text-stewart-text">{row.feature}</td>
                  <td className="px-4 py-2.5 text-center text-stewart-muted">{row.mailchimp}</td>
                  <td className="px-4 py-2.5 text-center font-semibold text-stewart-accent">{row.platform}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ProposalSection>

      <ProposalSection title="Investment">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-stewart-accent/10 border border-stewart-accent/30 rounded-lg p-5 text-center">
            <p className="text-stewart-accent text-2xl font-bold">$1,000</p>
            <p className="text-stewart-accent text-sm font-medium mt-1">One-time setup</p>
            <p className="text-stewart-muted text-xs mt-2 leading-relaxed">
              Exigo integration, list cleanup, template migration, domain setup, first automation flows
            </p>
          </div>
          <div className="bg-stewart-accent/10 border border-stewart-accent/30 rounded-lg p-5 text-center">
            <p className="text-stewart-accent text-2xl font-bold">$500/mo</p>
            <p className="text-stewart-accent text-sm font-medium mt-1">Monthly</p>
            <p className="text-stewart-muted text-xs mt-2 leading-relaxed">
              Unlimited sending, ongoing sync, automation, list hygiene, campaign management, direct support
            </p>
          </div>
        </div>
      </ProposalSection>

      <div className="bg-stewart-card border border-stewart-border rounded-lg p-6">
        <p className="text-stewart-text text-sm font-semibold leading-relaxed">
          This is a deployment, not a development project. The platform is already built and running.
          Setup is connecting your Exigo data, migrating your templates, and configuring your sending domain.
        </p>
        <div className="mt-4 pt-4 border-t border-stewart-border">
          <p className="text-sm font-medium text-stewart-text">Spencer Colby</p>
          <p className="text-xs text-stewart-muted">stewart@poweredbystewart.com</p>
        </div>
      </div>
    </div>
  );
}
