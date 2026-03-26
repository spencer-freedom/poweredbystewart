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

const defaultForm = {
  campaign_name: "",
  subject: "",
  template_id: "",
  body_html: "",
  body_text: "",
  scheduled_at: "",
  audience_segment: "all_active",
};

export function CampaignsTab({ tenantId, onReloadSummary }: Props) {
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState<EmailCampaign | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<EmailCampaign | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [editorMode, setEditorMode] = useState<"simple" | "html">("simple");
  const [showHtmlPreview, setShowHtmlPreview] = useState(false);
  const [sendConfirm, setSendConfirm] = useState<{ campaignId: string; preview: { recipient_count: number; subject: string } } | null>(null);
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
    } catch { /* template list is for dropdown — degrade gracefully */ }
  }, [tenantId]);

  useEffect(() => { loadCampaigns(); loadTemplates(); }, [loadCampaigns, loadTemplates]);

  // ─── Handlers ─────────────────────────────────────────────────

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
    setForm(defaultForm);
    setEditorMode("simple");
  };

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
      closeForm();
      loadCampaigns();
      onReloadSummary();
    } catch {
      setError("Failed to create campaign");
    }
  };

  const handleEdit = (c: EmailCampaign) => {
    const criteria = typeof c.audience_criteria === "string" ? JSON.parse(c.audience_criteria || "{}") : (c.audience_criteria || {});
    setEditing(c);
    setForm({
      campaign_name: c.campaign_name,
      subject: c.subject,
      template_id: c.template_id || "",
      body_html: c.body_html || "",
      body_text: c.body_text || "",
      scheduled_at: c.scheduled_at?.slice(0, 16) || "",
      audience_segment: criteria.segment || "all_active",
    });
    setEditorMode(c.body_html ? "html" : "simple");
    setShowForm(true);
    setSelected(null);
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
      closeForm();
      loadCampaigns();
    } catch {
      setError("Failed to update campaign");
    }
  };

  const handlePreview = async (campaignId: string) => {
    try {
      const res = await api.emailSendCampaign(tenantId, campaignId, [], true);
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

  const handleSend = async (campaignId: string) => {
    try {
      await api.emailSendCampaign(tenantId, campaignId, [], false);
      setSendConfirm(null);
      loadCampaigns();
      onReloadSummary();
    } catch {
      setError("Failed to send campaign");
    }
  };

  const handleDelete = async (campaignId: string) => {
    if (!confirm("Delete this draft campaign?")) return;
    try {
      await api.emailDeleteCampaign(tenantId, campaignId);
      setSelected(null);
      loadCampaigns();
      onReloadSummary();
    } catch {
      setError("Failed to delete campaign");
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

  // ─── Render ───────────────────────────────────────────────────

  if (error) {
    return (
      <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-md text-red-400 text-sm">
        {error}
        <button onClick={() => { setError(""); loadCampaigns(); }} className="ml-3 underline">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => { setShowForm(true); setSelected(null); setEditorMode("simple"); }}
          className="px-3 py-1.5 text-xs bg-stewart-accent/10 text-stewart-accent border border-stewart-accent/30 rounded-md hover:bg-stewart-accent/20 transition-colors"
        >
          + New Campaign
        </button>
      </div>

      {/* Send Confirmation */}
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
            <button onClick={() => handleSend(sendConfirm.campaignId)} className="px-4 py-1.5 text-sm bg-green-500/20 text-green-400 border border-green-500/30 rounded hover:bg-green-500/30 transition-colors">
              Confirm Send
            </button>
            <button onClick={() => setSendConfirm(null)} className="px-4 py-1.5 text-sm text-stewart-muted hover:text-stewart-text">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-4">
        <div className={`${selected ? "w-1/2" : "w-full"} space-y-4`}>
          {/* Create/Edit Form */}
          {showForm && (
            <div className="bg-stewart-card border border-stewart-accent/30 rounded-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-semibold">{editing ? "Edit Campaign" : "New Campaign"}</h3>
                <button onClick={closeForm} className="text-xs text-stewart-muted hover:text-stewart-text">Cancel</button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-stewart-muted">Campaign Name</label>
                  <input
                    value={form.campaign_name}
                    onChange={(e) => setForm({ ...form, campaign_name: e.target.value })}
                    className="w-full bg-stewart-bg border border-stewart-border rounded px-2 py-1 text-sm mt-1"
                    placeholder="e.g. April Product Spotlight"
                  />
                </div>
                <div>
                  <label className="text-xs text-stewart-muted">Subject Line</label>
                  <input
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    className="w-full bg-stewart-bg border border-stewart-border rounded px-2 py-1 text-sm mt-1"
                    placeholder="e.g. Spring Into Wellness"
                  />
                </div>
                <div>
                  <label className="text-xs text-stewart-muted">Template (optional)</label>
                  <select
                    value={form.template_id}
                    onChange={(e) => setForm({ ...form, template_id: e.target.value })}
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
                    value={form.scheduled_at}
                    onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
                    className="w-full bg-stewart-bg border border-stewart-border rounded px-2 py-1 text-sm mt-1"
                  />
                </div>
              </div>
              <div className="mt-3">
                <label className="text-xs text-stewart-muted">Audience Segment</label>
                <select
                  value={form.audience_segment}
                  onChange={(e) => setForm({ ...form, audience_segment: e.target.value })}
                  className="w-full bg-stewart-bg border border-stewart-border rounded px-2 py-1 text-sm mt-1"
                >
                  {AUDIENCE_SEGMENTS.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.label} ({s.count.toLocaleString()} contacts)
                    </option>
                  ))}
                </select>
              </div>

              {/* Template selected */}
              {form.template_id && (
                <div className="mt-3 bg-stewart-accent/10 border border-stewart-accent/20 rounded-lg p-3">
                  <p className="text-xs text-stewart-accent">
                    Using template: <strong>{templates.find((t) => t.id === form.template_id)?.template_name}</strong>
                  </p>
                  <p className="text-[10px] text-stewart-muted mt-1">Template content will be used as the email body. You can preview it after creating the campaign.</p>
                </div>
              )}

              {/* Editor */}
              {!form.template_id && (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1 bg-stewart-bg rounded-lg p-0.5">
                      <button
                        onClick={() => setEditorMode("simple")}
                        className={`px-3 py-1 text-xs rounded-md transition-colors ${editorMode === "simple" ? "bg-stewart-card text-stewart-text shadow-sm" : "text-stewart-muted hover:text-stewart-text"}`}
                      >
                        Simple Editor
                      </button>
                      <button
                        onClick={() => setEditorMode("html")}
                        className={`px-3 py-1 text-xs rounded-md transition-colors ${editorMode === "html" ? "bg-stewart-card text-stewart-text shadow-sm" : "text-stewart-muted hover:text-stewart-text"}`}
                      >
                        Custom HTML
                      </button>
                    </div>
                    {editorMode === "html" && (
                      <span className="text-[10px] text-green-400">Paste any HTML — long URLs, custom buttons, tracking parameters. No character limits.</span>
                    )}
                  </div>

                  {editorMode === "simple" ? (
                    <>
                      <div>
                        <label className="text-xs text-stewart-muted">Body HTML</label>
                        <textarea
                          value={form.body_html}
                          onChange={(e) => setForm({ ...form, body_html: e.target.value })}
                          className="w-full bg-stewart-bg border border-stewart-border rounded px-2 py-1 text-sm mt-1 h-24 font-mono"
                          placeholder="<h1>Hello!</h1>"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-stewart-muted">Body Text (plain text fallback)</label>
                        <textarea
                          value={form.body_text}
                          onChange={(e) => setForm({ ...form, body_text: e.target.value })}
                          className="w-full bg-stewart-bg border border-stewart-border rounded px-2 py-1 text-sm mt-1 h-16 font-mono"
                          placeholder="Plain text version"
                        />
                      </div>
                    </>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs text-stewart-muted">HTML Email Content</label>
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] text-stewart-muted">Build with:</span>
                            <a href="https://stripo.email" target="_blank" rel="noopener noreferrer" className="text-[10px] text-stewart-accent hover:underline">Stripo</a>
                            <a href="https://www.canva.com/email-newsletters/" target="_blank" rel="noopener noreferrer" className="text-[10px] text-stewart-accent hover:underline">Canva</a>
                            <a href="https://beefree.io" target="_blank" rel="noopener noreferrer" className="text-[10px] text-stewart-accent hover:underline">BEE Free</a>
                            <button onClick={() => setShowHtmlPreview(!showHtmlPreview)} className="text-[10px] text-stewart-accent hover:underline">
                              {showHtmlPreview ? "Hide Preview" : "Show Preview"}
                            </button>
                          </div>
                        </div>
                        <textarea
                          value={form.body_html}
                          onChange={(e) => setForm({ ...form, body_html: e.target.value })}
                          className="w-full bg-stewart-bg border border-stewart-border rounded px-3 py-2 text-sm mt-1 font-mono text-green-300"
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
                        <label className="text-xs text-stewart-muted">Plain Text Fallback (optional)</label>
                        <textarea
                          value={form.body_text}
                          onChange={(e) => setForm({ ...form, body_text: e.target.value })}
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
                  onClick={editing ? handleSave : handleCreate}
                  disabled={!form.campaign_name || !form.subject}
                  className="px-4 py-1.5 text-sm bg-stewart-accent/20 text-stewart-accent border border-stewart-accent/30 rounded hover:bg-stewart-accent/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editing ? "Save Changes" : "Create Draft"}
                </button>
              </div>
            </div>
          )}

          {/* Filter Chips */}
          <div className="flex gap-2">
            {["", "draft", "scheduled", "sending", "sent"].map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  filter === s
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
                  onClick={() => setSelected(selected?.id === c.id ? null : c)}
                  className={`w-full text-left px-4 py-3 hover:bg-stewart-border/20 transition-colors ${selected?.id === c.id ? "bg-stewart-border/30" : ""}`}
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

        {/* Detail Panel */}
        {selected && (
          <div className="w-1/2 bg-stewart-card border border-stewart-border rounded-lg p-4 space-y-4 h-fit">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-semibold">{selected.campaign_name}</h3>
                <p className="text-xs text-stewart-muted mt-0.5">{selected.subject}</p>
              </div>
              {statusBadge(selected.status)}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Sent", val: selected.sent_count, color: "" },
                { label: "Delivered", val: selected.delivered_count, color: "text-green-400" },
                { label: "Opened", val: selected.opened_count, color: "text-cyan-400" },
                { label: "Clicked", val: selected.clicked_count, color: "text-stewart-accent" },
                { label: "Bounced", val: selected.bounced_count, color: "text-red-400" },
                { label: "Unsubs", val: selected.unsubscribed_count, color: "text-orange-400" },
              ].map(({ label, val, color }) => (
                <div key={label} className="bg-stewart-bg/50 rounded p-2 text-center">
                  <p className="text-[10px] text-stewart-muted">{label}</p>
                  <p className={`text-sm font-bold ${color}`}>{val}</p>
                </div>
              ))}
            </div>

            {/* Dates */}
            <div className="text-xs space-y-1 text-stewart-muted">
              {selected.scheduled_at && <p>Scheduled: <span className="text-stewart-text">{selected.scheduled_at.slice(0, 16)}</span></p>}
              {selected.sent_at && <p>Sent: <span className="text-stewart-text">{selected.sent_at.slice(0, 16)}</span></p>}
              <p>Created: <span className="text-stewart-text">{selected.created_at?.slice(0, 16)}</span></p>
            </div>

            {/* Audience */}
            {(() => {
              const criteria = typeof selected.audience_criteria === "string"
                ? JSON.parse(selected.audience_criteria || "{}")
                : (selected.audience_criteria || {});
              return criteria.label ? (
                <div className="bg-stewart-accent/5 border border-stewart-accent/20 rounded-lg p-3">
                  <p className="text-[10px] text-stewart-muted uppercase tracking-wide mb-1">Audience</p>
                  <p className="text-sm text-stewart-text font-medium">{criteria.label}</p>
                  {criteria.estimated_count && (
                    <p className="text-xs text-stewart-muted">{criteria.estimated_count.toLocaleString()} estimated recipients</p>
                  )}
                </div>
              ) : null;
            })()}

            {/* Email Preview */}
            {(selected.body_html || templates.find((t) => t.id === selected.template_id)?.html_content) && (
              <div>
                <p className="text-[10px] text-stewart-muted uppercase tracking-wide mb-1">
                  Email Preview
                  {!selected.body_html && selected.template_id && (
                    <span className="ml-2 text-stewart-accent">(from template)</span>
                  )}
                </p>
                <div className="border border-stewart-border rounded-lg overflow-hidden bg-white">
                  <iframe
                    srcDoc={selected.body_html || templates.find((t) => t.id === selected.template_id)?.html_content || ""}
                    className="w-full border-0"
                    style={{ height: "300px" }}
                    sandbox="allow-same-origin"
                    title="Campaign Preview"
                  />
                </div>
              </div>
            )}

            {/* Send Test */}
            <div className="pt-2 border-t border-stewart-border/50 space-y-2">
              <p className="text-[10px] text-stewart-muted uppercase tracking-wide">Send Test Email</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="recipient@example.com"
                  value={testEmail}
                  onChange={(e) => { setTestEmail(e.target.value); setTestResult(null); }}
                  className="flex-1 bg-stewart-bg border border-stewart-border rounded px-3 py-1.5 text-xs text-stewart-text placeholder:text-stewart-muted/50"
                />
                <button
                  onClick={() => handleSendTest(selected.id)}
                  disabled={testSending || !testEmail}
                  className="px-3 py-1.5 text-xs bg-stewart-accent/20 text-stewart-accent border border-stewart-accent/30 rounded hover:bg-stewart-accent/30 transition-colors disabled:opacity-50"
                >
                  {testSending ? "Sending..." : "Send Test"}
                </button>
              </div>
              {testResult && (
                <p className={`text-xs ${testResult.success ? "text-green-400" : "text-red-400"}`}>{testResult.message}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2 border-t border-stewart-border/50">
              {(selected.status === "draft" || selected.status === "scheduled") && (
                <button onClick={() => handleEdit(selected)} className="px-3 py-1 text-xs bg-stewart-accent/20 text-stewart-accent border border-stewart-accent/30 rounded hover:bg-stewart-accent/30 transition-colors">
                  Edit
                </button>
              )}
              {(selected.status === "draft" || selected.status === "scheduled") && (
                <button onClick={() => handlePreview(selected.id)} className="px-3 py-1 text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded hover:bg-blue-500/30 transition-colors">
                  Preview / Dry Run
                </button>
              )}
              {selected.status === "draft" && (
                <button onClick={() => handleDelete(selected.id)} className="px-3 py-1 text-xs bg-red-500/10 text-red-400 border border-red-500/30 rounded hover:bg-red-500/20 transition-colors ml-auto">
                  Delete
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
