"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import type { EmailCampaign, EmailTemplate } from "@/lib/types";
import { statusBadge } from "@/lib/ui/badges";

interface Props {
  tenantId: string;
  onReloadSummary: () => void;
}

const AUDIENCE_SEGMENTS = [
  { key: "all_active", label: "All Active Distributors", count: 847 },
  { key: "recent_90d", label: "Bought in Last 90 Days", count: 423 },
  { key: "new_signups", label: "New Sign-ups This Month", count: 156 },
  { key: "vip", label: "VIP Distributors", count: 92 },
  { key: "inactive_6m", label: "Inactive 6+ Months", count: 318 },
  { key: "all", label: "Entire List", count: 1_247 },
];

type View = "list" | "compose" | "detail";

const defaultForm = {
  campaign_name: "",
  subject: "",
  template_id: "",
  body_html: "",
  body_text: "",
  scheduled_at: "",
  audience_segment: "all_active",
};

function parseCriteria(campaign: EmailCampaign) {
  const raw = campaign.audience_criteria;
  if (!raw || raw === "{}") return {};
  return typeof raw === "string" ? JSON.parse(raw) : raw;
}

export function CampaignsTab({ tenantId, onReloadSummary }: Props) {
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [filter, setFilter] = useState("");
  const [view, setView] = useState<View>("list");
  const [selected, setSelected] = useState<EmailCampaign | null>(null);
  const [editing, setEditing] = useState<EmailCampaign | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [editorMode, setEditorMode] = useState<"simple" | "html">("simple");
  const [showHtmlPreview, setShowHtmlPreview] = useState(false);
  const [sendConfirm, setSendConfirm] = useState<{ campaignId: string; count: number } | null>(null);
  const [testEmail, setTestEmail] = useState("");
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [error, setError] = useState("");

  // ─── Data loading ─────────────────────────────────────────────

  const loadCampaigns = useCallback(async () => {
    try {
      setCampaigns(await api.emailListCampaigns(tenantId, filter || undefined, 50));
    } catch {
      setError("Failed to load campaigns");
    }
  }, [tenantId, filter]);

  const loadTemplates = useCallback(async () => {
    try {
      setTemplates(await api.emailListTemplates(tenantId, 50));
    } catch { /* degrade gracefully */ }
  }, [tenantId]);

  useEffect(() => { loadCampaigns(); loadTemplates(); }, [loadCampaigns, loadTemplates]);

  // ─── Navigation ───────────────────────────────────────────────

  const goToList = () => {
    setView("list");
    setSelected(null);
    setEditing(null);
    setForm(defaultForm);
    setEditorMode("simple");
    setShowHtmlPreview(false);
    setSendConfirm(null);
    setTestResult(null);
  };

  const goToCompose = (campaign?: EmailCampaign) => {
    if (campaign) {
      const criteria = parseCriteria(campaign);
      setEditing(campaign);
      setForm({
        campaign_name: campaign.campaign_name,
        subject: campaign.subject,
        template_id: campaign.template_id || "",
        body_html: campaign.body_html || "",
        body_text: campaign.body_text || "",
        scheduled_at: campaign.scheduled_at?.slice(0, 16) || "",
        audience_segment: criteria.segment || "all_active",
      });
      setEditorMode(campaign.body_html ? "html" : "simple");
    } else {
      setEditing(null);
      setForm(defaultForm);
      setEditorMode("simple");
    }
    setView("compose");
    setSendConfirm(null);
    setTestResult(null);
  };

  const goToDetail = (campaign: EmailCampaign) => {
    setSelected(campaign);
    setView("detail");
    setTestResult(null);
  };

  // ─── Handlers ─────────────────────────────────────────────────

  const handleCreate = async () => {
    const seg = AUDIENCE_SEGMENTS.find((s) => s.key === form.audience_segment);
    try {
      await api.emailCreateCampaign(tenantId, {
        campaign_name: form.campaign_name,
        subject: form.subject,
        template_id: form.template_id || null,
        body_html: form.body_html,
        body_text: form.body_text,
        scheduled_at: form.scheduled_at || null,
        audience_criteria: { segment: form.audience_segment, label: seg?.label, estimated_count: seg?.count },
      });
      goToList();
      loadCampaigns();
      onReloadSummary();
    } catch {
      setError("Failed to create campaign");
    }
  };

  const handleSave = async () => {
    if (!editing) return;
    const seg = AUDIENCE_SEGMENTS.find((s) => s.key === form.audience_segment);
    try {
      await api.emailUpdateCampaign(tenantId, editing.id, {
        campaign_name: form.campaign_name,
        subject: form.subject,
        template_id: form.template_id || null,
        body_html: form.body_html,
        body_text: form.body_text,
        scheduled_at: form.scheduled_at || null,
        audience_criteria: JSON.stringify({ segment: form.audience_segment, label: seg?.label, estimated_count: seg?.count }),
      });
      goToList();
      loadCampaigns();
    } catch {
      setError("Failed to update campaign");
    }
  };

  const handleDelete = async (campaignId: string) => {
    if (!confirm("Delete this draft campaign?")) return;
    try {
      await api.emailDeleteCampaign(tenantId, campaignId);
      goToList();
      loadCampaigns();
      onReloadSummary();
    } catch {
      setError("Failed to delete campaign");
    }
  };

  const handlePreviewSend = async (campaignId: string) => {
    try {
      const res = await api.emailSendCampaign(tenantId, campaignId, [], true);
      setSendConfirm({ campaignId, count: (res.recipient_count as number) ?? 0 });
    } catch {
      setError("Failed to preview campaign");
    }
  };

  const handleConfirmSend = async (campaignId: string) => {
    try {
      await api.emailSendCampaign(tenantId, campaignId, [], false);
      setSendConfirm(null);
      goToList();
      loadCampaigns();
      onReloadSummary();
    } catch {
      setError("Failed to send campaign");
    }
  };

  const handleSendTest = async (campaignId: string) => {
    if (!testEmail) return;
    setTestSending(true);
    setTestResult(null);
    try {
      const res = await api.emailSendTest(tenantId, campaignId, testEmail);
      setTestResult({
        success: res.success,
        message: res.success ? `Test sent to ${testEmail}` : (res.error || "Send failed"),
      });
      if (res.success) onReloadSummary();
    } catch (err) {
      setTestResult({ success: false, message: err instanceof Error ? err.message : "Send failed" });
    } finally {
      setTestSending(false);
    }
  };

  const currentSegment = AUDIENCE_SEGMENTS.find((s) => s.key === form.audience_segment);

  // ─── Error state ──────────────────────────────────────────────

  if (error) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
        {error}
        <button onClick={() => { setError(""); loadCampaigns(); }} className="ml-3 underline">Retry</button>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // LIST VIEW
  // ═══════════════════════════════════════════════════════════════

  if (view === "list") {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-stewart-muted uppercase tracking-wide">Campaigns</h2>
          <button
            onClick={() => goToCompose()}
            className="px-4 py-2 bg-stewart-accent text-white text-sm font-medium rounded-lg hover:bg-stewart-accent/80 transition-colors"
          >
            + New Campaign
          </button>
        </div>

        {/* Filter Chips */}
        <div className="flex gap-2">
          {["", "draft", "scheduled", "sending", "sent"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                filter === s
                  ? "bg-stewart-accent/20 text-stewart-accent border border-stewart-accent/30"
                  : "bg-stewart-card border border-stewart-border text-stewart-muted hover:text-stewart-text"
              }`}
            >
              {s || "All"}
            </button>
          ))}
        </div>

        {/* Campaign Cards — grid matching Email Studio */}
        {campaigns.length === 0 ? (
          <div className="bg-stewart-card border border-stewart-border rounded-lg px-4 py-12 text-center text-stewart-muted text-sm">
            No campaigns yet. Click + New Campaign to create one.
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {campaigns.map((c) => {
              const criteria = parseCriteria(c);
              return (
                <div
                  key={c.id}
                  onClick={() => {
                    if (c.status === "draft" || c.status === "scheduled") goToCompose(c);
                    else goToDetail(c);
                  }}
                  className="bg-stewart-card border border-stewart-border rounded-lg p-5 hover:border-stewart-accent/50 transition-colors cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-stewart-accent/10 flex items-center justify-center">
                      <svg viewBox="0 0 24 24" className="w-5 h-5 text-stewart-accent" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M2 8l10 6 10-6" /></svg>
                    </div>
                    {statusBadge(c.status)}
                  </div>
                  <h3 className="text-sm font-semibold text-stewart-text mb-1 group-hover:text-stewart-accent transition-colors">{c.campaign_name}</h3>
                  <p className="text-xs text-stewart-muted mb-3">{c.subject || "No subject"}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {criteria.label && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-purple-500/20 text-purple-400">{criteria.label}</span>
                    )}
                    {c.total_recipients > 0 && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-stewart-border text-stewart-muted">{c.total_recipients} sent</span>
                    )}
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-stewart-border text-stewart-muted">{c.created_at?.slice(0, 10)}</span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-stewart-border">
                    <span className="text-xs text-stewart-accent opacity-0 group-hover:opacity-100 transition-opacity">
                      {c.status === "draft" || c.status === "scheduled" ? "Edit campaign" : "View details"} &rarr;
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // COMPOSE VIEW — matches proposal Email Studio layout
  // ═══════════════════════════════════════════════════════════════

  if (view === "compose") {
    const campaignId = editing?.id;
    const previewHtml = form.body_html || (form.template_id ? templates.find((t) => t.id === form.template_id)?.html_content : "") || "";

    return (
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm">
          <button onClick={goToList} className="text-stewart-accent hover:underline">Campaigns</button>
          <span className="text-stewart-muted">/</span>
          <span className="text-stewart-text">{editing ? editing.campaign_name : "New Campaign"}</span>
        </div>

        {/* Send Confirmation Banner */}
        {sendConfirm && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-5 space-y-3">
            <h3 className="text-sm font-semibold text-green-400">Ready to Send</h3>
            <div className="bg-stewart-bg rounded-lg p-3 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-stewart-muted">Subject</span><span className="text-stewart-text">{form.subject}</span></div>
              <div className="flex justify-between"><span className="text-stewart-muted">Recipients</span><span className="font-bold text-stewart-text">{sendConfirm.count}</span></div>
              <div className="flex justify-between"><span className="text-stewart-muted">Est. delivery</span><span className="text-green-400 font-medium">99.8%</span></div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => handleConfirmSend(sendConfirm.campaignId)} className="px-5 py-2.5 bg-green-600 hover:bg-green-500 text-white text-sm font-semibold rounded-lg transition-colors">
                Confirm & Send
              </button>
              <button onClick={() => setSendConfirm(null)} className="px-4 py-2 text-stewart-muted text-sm hover:text-stewart-text transition-colors">
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-6">
          {/* ─── Left: Campaign Details ─── */}
          <div className="col-span-2 space-y-5">
            <div className="bg-stewart-card border border-stewart-border rounded-lg p-5 space-y-4">
              <h3 className="text-sm font-semibold text-stewart-text">Campaign Details</h3>
              <div>
                <label className="text-xs text-stewart-muted block mb-1">Campaign Name</label>
                <input
                  value={form.campaign_name}
                  onChange={(e) => setForm({ ...form, campaign_name: e.target.value })}
                  className="w-full bg-stewart-bg border border-stewart-border rounded-lg px-4 py-2.5 text-sm text-stewart-text"
                  placeholder="e.g. April Product Spotlight"
                />
              </div>
              <div>
                <label className="text-xs text-stewart-muted block mb-1">Subject Line</label>
                <input
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="w-full bg-stewart-bg border border-stewart-border rounded-lg px-4 py-2.5 text-sm text-stewart-text"
                  placeholder="e.g. Spring Into Wellness, {name}"
                />
              </div>
              <div>
                <label className="text-xs text-stewart-muted block mb-1">Template (optional)</label>
                <select
                  value={form.template_id}
                  onChange={(e) => setForm({ ...form, template_id: e.target.value })}
                  className="w-full bg-stewart-bg border border-stewart-border rounded-lg px-3 py-2.5 text-sm text-stewart-text appearance-none cursor-pointer"
                >
                  <option value="">Custom (inline)</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>{t.template_name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Template callout */}
            {form.template_id && (
              <div className="bg-stewart-accent/5 border-l-2 border-stewart-accent rounded-r-lg px-4 py-2.5 text-sm text-stewart-muted">
                Using template: <strong className="text-stewart-text">{templates.find((t) => t.id === form.template_id)?.template_name}</strong>. Content will be used as the email body.
              </div>
            )}

            {/* Editor — only if no template */}
            {!form.template_id && (
              <div className="bg-stewart-card border border-stewart-border rounded-lg p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-stewart-text">Email Content</h3>
                  <div className="flex gap-1 bg-stewart-bg rounded-lg p-0.5">
                    <button
                      onClick={() => setEditorMode("simple")}
                      className={`px-3 py-1 text-xs rounded-md transition-colors ${editorMode === "simple" ? "bg-stewart-card text-stewart-text shadow-sm" : "text-stewart-muted hover:text-stewart-text"}`}
                    >
                      Simple
                    </button>
                    <button
                      onClick={() => setEditorMode("html")}
                      className={`px-3 py-1 text-xs rounded-md transition-colors ${editorMode === "html" ? "bg-stewart-card text-stewart-text shadow-sm" : "text-stewart-muted hover:text-stewart-text"}`}
                    >
                      HTML
                    </button>
                  </div>
                </div>

                {editorMode === "simple" ? (
                  <>
                    <div>
                      <label className="text-xs text-stewart-muted block mb-1">Body HTML</label>
                      <textarea
                        value={form.body_html}
                        onChange={(e) => setForm({ ...form, body_html: e.target.value })}
                        className="w-full bg-stewart-bg border border-stewart-border rounded-lg px-4 py-2.5 text-sm font-mono h-28"
                        placeholder="<h1>Hello {name}!</h1>"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-stewart-muted block mb-1">Plain Text Fallback</label>
                      <textarea
                        value={form.body_text}
                        onChange={(e) => setForm({ ...form, body_text: e.target.value })}
                        className="w-full bg-stewart-bg border border-stewart-border rounded-lg px-4 py-2.5 text-sm font-mono h-16"
                        placeholder="Plain text version"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs text-stewart-muted">HTML Email Content</label>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] text-stewart-muted">Build with:</span>
                          <a href="https://stripo.email" target="_blank" rel="noopener noreferrer" className="text-[10px] text-stewart-accent hover:underline">Stripo</a>
                          <a href="https://www.canva.com/" target="_blank" rel="noopener noreferrer" className="text-[10px] text-stewart-accent hover:underline">Canva</a>
                          <a href="https://beefree.io" target="_blank" rel="noopener noreferrer" className="text-[10px] text-stewart-accent hover:underline">BEE Free</a>
                          <button onClick={() => setShowHtmlPreview(!showHtmlPreview)} className="text-[10px] text-stewart-accent hover:underline">
                            {showHtmlPreview ? "Hide Preview" : "Show Preview"}
                          </button>
                        </div>
                      </div>
                      <textarea
                        value={form.body_html}
                        onChange={(e) => setForm({ ...form, body_html: e.target.value })}
                        className="w-full bg-stewart-bg border border-stewart-border rounded-lg px-4 py-2.5 text-sm font-mono text-green-300"
                        rows={16}
                        placeholder="Design in Stripo, Canva, or BEE Free → Export HTML → Paste here."
                      />
                      {form.body_html && (
                        <p className="text-[10px] text-stewart-muted mt-1">{form.body_html.length.toLocaleString()} characters</p>
                      )}
                    </div>
                    {showHtmlPreview && form.body_html && (
                      <div>
                        <p className="text-xs text-stewart-muted mb-1">Live Preview</p>
                        <div className="border border-stewart-border rounded-lg overflow-hidden bg-white">
                          <iframe srcDoc={form.body_html} className="w-full border-0" style={{ height: "400px" }} sandbox="allow-same-origin" title="Email Preview" />
                        </div>
                      </div>
                    )}
                    <div>
                      <label className="text-xs text-stewart-muted block mb-1">Plain Text Fallback (optional)</label>
                      <textarea
                        value={form.body_text}
                        onChange={(e) => setForm({ ...form, body_text: e.target.value })}
                        className="w-full bg-stewart-bg border border-stewart-border rounded-lg px-4 py-2.5 text-sm font-mono h-12"
                        placeholder="Plain text version for email clients that don't render HTML"
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Email Preview */}
            {previewHtml && (
              <div className="bg-stewart-card border border-stewart-border rounded-lg p-5 space-y-4">
                <h3 className="text-sm font-semibold text-stewart-text">Email Preview</h3>
                <div className="border border-stewart-border rounded-lg overflow-hidden bg-white">
                  <iframe srcDoc={previewHtml} className="w-full border-0" style={{ height: "350px" }} sandbox="allow-same-origin" title="Email Preview" />
                </div>
              </div>
            )}

            {/* Dry Run / Send Test — only when editing */}
            {campaignId && (
              <div className="bg-stewart-card border border-stewart-border rounded-lg p-5 space-y-3">
                <p className="text-xs font-semibold text-stewart-text">Dry Run</p>
                <p className="text-[11px] text-stewart-muted">Send a test email to yourself before sending to the full audience.</p>
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="recipient@example.com"
                    value={testEmail}
                    onChange={(e) => { setTestEmail(e.target.value); setTestResult(null); }}
                    className="flex-1 bg-stewart-bg border border-stewart-border rounded-lg px-4 py-2.5 text-sm text-stewart-text placeholder:text-stewart-muted/50"
                  />
                  <button
                    onClick={() => handleSendTest(campaignId)}
                    disabled={testSending || !testEmail}
                    className="px-4 py-2.5 bg-stewart-border text-stewart-text text-xs font-medium rounded-lg hover:bg-stewart-accent/20 transition-colors disabled:opacity-50"
                  >
                    {testSending ? "Sending..." : "Send Test"}
                  </button>
                </div>
                {testResult && (
                  <p className={`text-xs ${testResult.success ? "text-green-400" : "text-red-400"}`}>{testResult.message}</p>
                )}
              </div>
            )}
          </div>

          {/* ─── Right Sidebar ─── */}
          <div className="space-y-5">
            {/* Audience */}
            <div className="bg-stewart-card border border-stewart-border rounded-lg p-5 space-y-4">
              <h3 className="text-sm font-semibold text-stewart-text">Audience</h3>
              <select
                value={form.audience_segment}
                onChange={(e) => setForm({ ...form, audience_segment: e.target.value })}
                className="w-full bg-stewart-bg border border-stewart-border rounded-lg px-3 py-2.5 text-sm text-stewart-text appearance-none cursor-pointer"
              >
                {AUDIENCE_SEGMENTS.map((s) => (
                  <option key={s.key} value={s.key}>{s.label} ({s.count.toLocaleString()})</option>
                ))}
              </select>
              <div className="bg-stewart-bg rounded-lg p-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-stewart-muted">Recipients</span>
                  <span className="font-bold text-stewart-text">{currentSegment?.count.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stewart-muted">Unsubscribed</span>
                  <span className="text-red-400">-3</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-stewart-border">
                  <span className="text-stewart-muted">Will receive</span>
                  <span className="font-bold text-green-400">{((currentSegment?.count || 0) - 3).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Schedule */}
            <div className="bg-stewart-card border border-stewart-border rounded-lg p-5 space-y-4">
              <h3 className="text-sm font-semibold text-stewart-text">Schedule</h3>
              <input
                type="datetime-local"
                value={form.scheduled_at}
                onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
                className="w-full bg-stewart-bg border border-stewart-border rounded-lg px-3 py-2.5 text-sm text-stewart-text"
              />
              <div className="bg-stewart-bg rounded-lg p-3 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-stewart-muted">Est. delivery</span>
                  <span className="text-stewart-text font-medium">99.8%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stewart-muted">Est. send time</span>
                  <span className="text-stewart-text font-medium">{Math.max(1, Math.ceil(((currentSegment?.count || 0) - 3) / 14 / 60))} min</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            {campaignId && (editing?.status === "draft" || editing?.status === "scheduled") && (
              <button
                onClick={() => handlePreviewSend(campaignId)}
                className="w-full px-4 py-3 bg-stewart-accent text-white text-sm font-medium rounded-lg hover:bg-stewart-accent/80 transition-colors"
              >
                Preview & Send
              </button>
            )}
            <button
              onClick={editing ? handleSave : handleCreate}
              disabled={!form.campaign_name || !form.subject}
              className="w-full px-4 py-2.5 bg-stewart-card border border-stewart-border text-stewart-text text-sm font-medium rounded-lg hover:bg-stewart-border/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {editing ? "Save Changes" : "Save as Draft"}
            </button>
            {editing?.status === "draft" && (
              <button
                onClick={() => handleDelete(editing.id)}
                className="w-full px-4 py-2 text-red-400 text-sm hover:text-red-300 transition-colors"
              >
                Delete Campaign
              </button>
            )}
            <button onClick={goToList} className="w-full px-4 py-2 text-stewart-muted text-sm hover:text-stewart-text transition-colors">
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // DETAIL VIEW — sent/sending campaigns (read-only)
  // ═══════════════════════════════════════════════════════════════

  if (view === "detail" && selected) {
    const criteria = parseCriteria(selected);
    const detailHtml = selected.body_html || templates.find((t) => t.id === selected.template_id)?.html_content || "";

    return (
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm">
          <button onClick={goToList} className="text-stewart-accent hover:underline">Campaigns</button>
          <span className="text-stewart-muted">/</span>
          <span className="text-stewart-text">{selected.campaign_name}</span>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* ─── Left: Stats + Preview ─── */}
          <div className="col-span-2 space-y-5">
            {/* Performance */}
            <div className="bg-stewart-card border border-stewart-border rounded-lg p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-stewart-text">Campaign Performance</h3>
                {statusBadge(selected.status)}
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Sent", val: selected.sent_count, color: "text-stewart-text" },
                  { label: "Delivered", val: selected.delivered_count, color: "text-green-400" },
                  { label: "Opened", val: selected.opened_count, color: "text-cyan-400" },
                  { label: "Clicked", val: selected.clicked_count, color: "text-stewart-accent" },
                  { label: "Bounced", val: selected.bounced_count, color: "text-red-400" },
                  { label: "Unsubs", val: selected.unsubscribed_count, color: "text-orange-400" },
                ].map(({ label, val, color }) => (
                  <div key={label} className="bg-stewart-bg rounded-lg p-3 text-center">
                    <p className="text-[10px] text-stewart-muted uppercase tracking-wide">{label}</p>
                    <p className={`text-lg font-bold ${color}`}>{val}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Email Preview */}
            {detailHtml && (
              <div className="bg-stewart-card border border-stewart-border rounded-lg p-5 space-y-4">
                <h3 className="text-sm font-semibold text-stewart-text">
                  Email Preview
                  {!selected.body_html && selected.template_id && (
                    <span className="ml-2 text-xs font-normal text-stewart-accent">(from template)</span>
                  )}
                </h3>
                <div className="border border-stewart-border rounded-lg overflow-hidden bg-white">
                  <iframe srcDoc={detailHtml} className="w-full border-0" style={{ height: "350px" }} sandbox="allow-same-origin" title="Campaign Preview" />
                </div>
              </div>
            )}

            {/* Send Test */}
            <div className="bg-stewart-card border border-stewart-border rounded-lg p-5 space-y-3">
              <p className="text-xs font-semibold text-stewart-text">Send Test Email</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="recipient@example.com"
                  value={testEmail}
                  onChange={(e) => { setTestEmail(e.target.value); setTestResult(null); }}
                  className="flex-1 bg-stewart-bg border border-stewart-border rounded-lg px-4 py-2.5 text-sm text-stewart-text placeholder:text-stewart-muted/50"
                />
                <button
                  onClick={() => handleSendTest(selected.id)}
                  disabled={testSending || !testEmail}
                  className="px-4 py-2.5 bg-stewart-border text-stewart-text text-xs font-medium rounded-lg hover:bg-stewart-accent/20 transition-colors disabled:opacity-50"
                >
                  {testSending ? "Sending..." : "Send Test"}
                </button>
              </div>
              {testResult && (
                <p className={`text-xs ${testResult.success ? "text-green-400" : "text-red-400"}`}>{testResult.message}</p>
              )}
            </div>
          </div>

          {/* ─── Right Sidebar ─── */}
          <div className="space-y-5">
            {/* Details */}
            <div className="bg-stewart-card border border-stewart-border rounded-lg p-5 space-y-4">
              <h3 className="text-sm font-semibold text-stewart-text">Details</h3>
              <div className="bg-stewart-bg rounded-lg p-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-stewart-muted">Subject</span>
                  <span className="text-stewart-text text-right max-w-[60%] truncate">{selected.subject}</span>
                </div>
                {selected.scheduled_at && (
                  <div className="flex justify-between">
                    <span className="text-stewart-muted">Scheduled</span>
                    <span className="text-stewart-text">{selected.scheduled_at.slice(0, 16).replace("T", " ")}</span>
                  </div>
                )}
                {selected.sent_at && (
                  <div className="flex justify-between">
                    <span className="text-stewart-muted">Sent</span>
                    <span className="text-stewart-text">{selected.sent_at.slice(0, 16).replace("T", " ")}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-stewart-muted">Created</span>
                  <span className="text-stewart-text">{selected.created_at?.slice(0, 10)}</span>
                </div>
              </div>
            </div>

            {/* Audience */}
            {criteria.label && (
              <div className="bg-stewart-card border border-stewart-border rounded-lg p-5 space-y-4">
                <h3 className="text-sm font-semibold text-stewart-text">Audience</h3>
                <div className="bg-stewart-bg rounded-lg p-3 space-y-2 text-sm">
                  <p className="text-stewart-text font-medium">{criteria.label}</p>
                  {criteria.estimated_count && (
                    <div className="flex justify-between pt-1">
                      <span className="text-stewart-muted">Recipients</span>
                      <span className="font-bold text-stewart-text">{criteria.estimated_count.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            {(selected.status === "draft" || selected.status === "scheduled") && (
              <button
                onClick={() => goToCompose(selected)}
                className="w-full px-4 py-2.5 bg-stewart-card border border-stewart-border text-stewart-text text-sm font-medium rounded-lg hover:bg-stewart-border/50 transition-colors"
              >
                Edit Campaign
              </button>
            )}
            {selected.status === "draft" && (
              <button
                onClick={() => handleDelete(selected.id)}
                className="w-full px-4 py-2 text-red-400 text-sm hover:text-red-300 transition-colors"
              >
                Delete Campaign
              </button>
            )}
            <button onClick={goToList} className="w-full px-4 py-2 text-stewart-muted text-sm hover:text-stewart-text transition-colors">
              &larr; Back to Campaigns
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
