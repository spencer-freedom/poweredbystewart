"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import type { EmailCampaign, EmailTemplate } from "@/lib/types";
import { statusBadge } from "@/lib/ui/badges";
import { ProductGrid, buildPreviewHtml } from "./ProductGrid";

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
  audience_segments: ["all_active"] as string[],
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
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [productUrl, setProductUrl] = useState("");
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
    setSelectedProducts([]);
    setProductUrl("");
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
        audience_segments: criteria.segments || (criteria.segment ? [criteria.segment] : ["all_active"]),
      });
      setEditorMode(campaign.body_html ? "html" : "simple");
      // Pre-select hero product from saved audience_criteria
      if (criteria.hero_product) {
        setSelectedProducts([criteria.hero_product]);
      } else {
        setSelectedProducts([]);
      }
      setProductUrl(criteria.product_url || "");
    } else {
      setEditing(null);
      setForm(defaultForm);
      setEditorMode("simple");
      setSelectedProducts([]);
      setProductUrl("");
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
    const selectedSegs = AUDIENCE_SEGMENTS.filter((s) => form.audience_segments.includes(s.key));
    const totalCount = selectedSegs.reduce((sum, s) => sum + s.count, 0);
    try {
      await api.emailCreateCampaign(tenantId, {
        campaign_name: form.campaign_name,
        subject: form.subject,
        template_id: form.template_id || null,
        body_html: form.body_html,
        body_text: form.body_text,
        scheduled_at: form.scheduled_at || null,
        audience_criteria: {
          segments: form.audience_segments,
          labels: selectedSegs.map((s) => s.label),
          estimated_count: totalCount,
          ...(selectedProducts[0] && { hero_product: selectedProducts[0] }),
          ...(productUrl && { product_url: productUrl }),
        },
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
    const selectedSegs = AUDIENCE_SEGMENTS.filter((s) => form.audience_segments.includes(s.key));
    const totalCount = selectedSegs.reduce((sum, s) => sum + s.count, 0);
    try {
      await api.emailUpdateCampaign(tenantId, editing.id, {
        campaign_name: form.campaign_name,
        subject: form.subject,
        template_id: form.template_id || null,
        body_html: form.body_html,
        body_text: form.body_text,
        scheduled_at: form.scheduled_at || null,
        audience_criteria: JSON.stringify({
          segments: form.audience_segments,
          labels: selectedSegs.map((s) => s.label),
          estimated_count: totalCount,
          ...(selectedProducts[0] && { hero_product: selectedProducts[0] }),
          ...(productUrl && { product_url: productUrl }),
        }),
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

  const selectedSegments = AUDIENCE_SEGMENTS.filter((s) => form.audience_segments.includes(s.key));
  const totalRecipients = selectedSegments.reduce((sum, s) => sum + s.count, 0);

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
    const rawHtml = form.body_html || (form.template_id ? templates.find((t) => t.id === form.template_id)?.html_content : "") || "";
    const previewHtml = buildPreviewHtml(rawHtml, selectedProducts, productUrl || undefined);

    const toggleProduct = (id: string) => {
      setSelectedProducts((prev) => prev[0] === id ? [] : [id]);
    };

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

            {/* Product Grid */}
            <ProductGrid selectedProducts={selectedProducts} onToggle={toggleProduct} />

            {/* Review URL — only for review templates/campaigns */}
            {selectedProducts.length > 0 && (() => {
              const currentTemplate = templates.find((t) => t.id === form.template_id);
              const isReview = currentTemplate?.template_name?.toLowerCase().includes("review") || form.campaign_name?.toLowerCase().includes("review");
              if (!isReview) return null;
              return (
                <div className={`border rounded-lg p-5 space-y-3 ${isReview ? "bg-stewart-accent/5 border-stewart-accent/30" : "bg-stewart-card border-stewart-border"}`}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-stewart-text">
                      {isReview ? "\"Write Your Review\" Button URL" : "Product CTA Link"}
                    </h3>
                    <span className="text-[10px] text-stewart-muted font-mono">{"{product_url}"}</span>
                  </div>
                  {isReview && (
                    <p className="text-xs text-stewart-muted leading-relaxed">
                      Paste the full review page URL below. This becomes the <strong className="text-stewart-text">&quot;Write Your Review&quot;</strong> button link in the email. No character limit — tracking params, UTMs, redirect chains, all of it.
                    </p>
                  )}
                  <textarea
                    value={productUrl}
                    onChange={(e) => setProductUrl(e.target.value)}
                    className="w-full bg-stewart-bg border border-stewart-border rounded-lg px-4 py-2.5 text-sm text-stewart-text font-mono break-all"
                    rows={productUrl.length > 120 ? 4 : 2}
                    placeholder={isReview
                      ? "https://sisel.net/products/h2-stix?variant=43298574336123&utm_source=email&utm_medium=..."
                      : "https://sisel.net/products/..."
                    }
                  />
                  {productUrl && (
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] text-stewart-muted">
                        <strong className={productUrl.length > 200 ? "text-green-400" : "text-stewart-text"}>{productUrl.length}</strong> characters
                        {productUrl.length > 200 && <span className="text-green-400 ml-1">— no problem. Other platforms break at ~500.</span>}
                      </p>
                      {isReview && productUrl.length > 100 && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-500/20 text-green-400">URL preserved</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Email Preview */}
            {previewHtml && (
              <div className="bg-stewart-card border border-stewart-border rounded-lg p-5 space-y-4">
                <h3 className="text-sm font-semibold text-stewart-text">Email Preview</h3>
                <div className="border border-stewart-border rounded-lg overflow-hidden bg-white">
                  <iframe srcDoc={previewHtml} className="w-full border-0" style={{ height: "350px" }} sandbox="allow-same-origin" title="Email Preview" />
                </div>
              </div>
            )}

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
                          <span className="text-xs text-stewart-muted">Build with:</span>
                          <a href="https://stripo.email" target="_blank" rel="noopener noreferrer" className="text-xs text-stewart-accent hover:underline">Stripo</a>
                          <a href="https://www.canva.com/" target="_blank" rel="noopener noreferrer" className="text-xs text-stewart-accent hover:underline">Canva</a>
                          <a href="https://beefree.io" target="_blank" rel="noopener noreferrer" className="text-xs text-stewart-accent hover:underline">BEE Free</a>
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

          </div>

          {/* ─── Right Sidebar ─── */}
          <div className="space-y-5">
            {/* Audience — multi-select */}
            <div className="bg-stewart-card border border-stewart-border rounded-lg p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-stewart-text">Audience</h3>
                <span className="text-xs text-stewart-muted">{form.audience_segments.length} selected</span>
              </div>
              <div className="space-y-1.5">
                {AUDIENCE_SEGMENTS.map((s) => {
                  const active = form.audience_segments.includes(s.key);
                  return (
                    <button
                      key={s.key}
                      onClick={() => {
                        setForm((prev) => ({
                          ...prev,
                          audience_segments: active
                            ? prev.audience_segments.filter((k) => k !== s.key)
                            : [...prev.audience_segments, s.key],
                        }));
                      }}
                      className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition-all ${
                        active
                          ? "bg-stewart-accent/15 border border-stewart-accent/50 text-stewart-text"
                          : "bg-stewart-bg border border-stewart-border text-stewart-muted hover:border-stewart-accent/30"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                          active ? "bg-stewart-accent border-stewart-accent" : "border-stewart-border"
                        }`}>
                          {active && <svg viewBox="0 0 16 16" className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth="3"><path d="M3 8l3 3 7-7" /></svg>}
                        </div>
                        <span>{s.label}</span>
                      </div>
                      <span className={`text-[10px] ${active ? "text-stewart-accent" : "text-stewart-muted"}`}>{s.count.toLocaleString()}</span>
                    </button>
                  );
                })}
              </div>
              <div className="bg-stewart-bg rounded-lg p-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-stewart-muted">Recipients</span>
                  <span className="font-bold text-stewart-text">{totalRecipients.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stewart-muted">Unsubscribed</span>
                  <span className="text-red-400">-3</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-stewart-border">
                  <span className="text-stewart-muted">Will receive</span>
                  <span className="font-bold text-green-400">{(totalRecipients - 3).toLocaleString()}</span>
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
                  <span className="text-stewart-text font-medium">{Math.max(1, Math.ceil((totalRecipients - 3) / 14 / 60))} min</span>
                </div>
              </div>
            </div>

            {/* Dry Run */}
            {campaignId && (
              <div className="bg-stewart-card border border-stewart-border rounded-lg p-4 space-y-3">
                <p className="text-xs font-semibold text-stewart-text">Dry Run</p>
                <p className="text-[11px] text-stewart-muted">Send a test to yourself first.</p>
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="recipient@example.com"
                    value={testEmail}
                    onChange={(e) => { setTestEmail(e.target.value); setTestResult(null); }}
                    className="flex-1 bg-stewart-bg border border-stewart-border rounded px-3 py-2 text-xs text-stewart-text placeholder:text-stewart-muted/50"
                  />
                  <button
                    onClick={() => handleSendTest(campaignId)}
                    disabled={testSending || !testEmail}
                    className="px-3 py-2 bg-stewart-border text-stewart-text text-xs font-medium rounded hover:bg-stewart-accent/20 transition-colors disabled:opacity-50"
                  >
                    {testSending ? "Sending..." : "Send Test"}
                  </button>
                </div>
                {testResult && (
                  <p className={`text-xs ${testResult.success ? "text-green-400" : "text-red-400"}`}>{testResult.message}</p>
                )}
              </div>
            )}

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
