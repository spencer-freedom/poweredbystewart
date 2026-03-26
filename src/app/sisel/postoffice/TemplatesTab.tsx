"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import type { EmailTemplate } from "@/lib/types";
import { statusBadge } from "@/lib/ui/badges";
import { ProductGrid, buildPreviewHtml } from "./ProductGrid";

interface Props {
  tenantId: string;
  onReloadSummary: () => void;
}

const defaultForm = {
  template_name: "",
  template_type: "custom",
  subject_template: "",
  html_content: "",
  text_content: "",
  variables: "",
  status: "draft",
};

type View = "list" | "edit";

export function TemplatesTab({ tenantId, onReloadSummary }: Props) {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [view, setView] = useState<View>("list");
  const [selected, setSelected] = useState<EmailTemplate | null>(null);
  const [editing, setEditing] = useState<EmailTemplate | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [productUrl, setProductUrl] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setTemplates(await api.emailListTemplates(tenantId, 50));
    } catch {
      setError("Failed to load templates");
    }
  }, [tenantId]);

  useEffect(() => { load(); }, [load]);

  const goToList = () => {
    setView("list");
    setEditing(null);
    setForm(defaultForm);

    setSelectedProducts([]);
    setProductUrl("");
  };

  const DEMO_REVIEW_URL =
    "https://sisel.net/products/sisel-h2-stix-hydrogen-water?variant=43298574336123" +
    "&utm_source=email&utm_medium=distributor_blast&utm_campaign=product_review_march2026" +
    "&utm_content=cta_button_primary&utm_term=hydrogen_water" +
    "&ref=distributor_network&tracking_id=dist_blast_20260315" +
    "&session_source=email_marketing_platform&click_id=clk_9f8e7d6c5b4a3" +
    "&distributor_tier=gold&region=north_america&promo_code=SPRING2026" +
    "&ab_test=variant_b&personalization_token=usr_abc123def456ghi789" +
    "&redirect_after_review=https%3A%2F%2Fsisel.net%2Fthank-you%3Freviewer%3D{name}" +
    "%26product%3Dh2-stix%26submitted%3Dtrue%26reward_points%3D50";

  const goToEdit = (t?: EmailTemplate) => {
    if (t) {
      setEditing(t);
      setForm({
        template_name: t.template_name,
        template_type: t.template_type,
        subject_template: t.subject_template,
        html_content: t.html_content,
        text_content: t.text_content,
        variables: (t.variables || []).join(", "),
        status: t.status,
      });
      // Pre-fill demo data for Product Review Request template
      if (t.template_name?.toLowerCase().includes("review")) {
        setSelectedProducts(["h2stix"]);
        setProductUrl(DEMO_REVIEW_URL);
      } else {
        setSelectedProducts([]);
        setProductUrl("");
      }
    } else {
      setEditing(null);
      setForm(defaultForm);
      setSelectedProducts([]);
      setProductUrl("");
    }
    setView("edit");
    setSelected(null);
  };

  const handleSave = async () => {
    const payload = {
      template_name: form.template_name,
      template_type: form.template_type,
      subject_template: form.subject_template,
      html_content: form.html_content,
      text_content: form.text_content,
      variables: form.variables ? form.variables.split(",").map((v: string) => v.trim()).filter(Boolean) : [],
      status: form.status,
    };
    try {
      if (editing) {
        await api.emailUpdateTemplate(tenantId, editing.id, payload);
      } else {
        await api.emailCreateTemplate(tenantId, payload);
        onReloadSummary();
      }
      goToList();
      load();
    } catch {
      setError(editing ? "Failed to update template" : "Failed to create template");
    }
  };

  if (error) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
        {error}
        <button onClick={() => { setError(""); load(); }} className="ml-3 underline">Retry</button>
      </div>
    );
  }

  // ─── LIST VIEW ────────────────────────────────────────────────

  if (view === "list") {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-stewart-muted uppercase tracking-wide">Email Templates</h2>
          <button
            onClick={() => goToEdit()}
            className="px-4 py-2 bg-stewart-accent text-white text-sm font-medium rounded-lg hover:bg-stewart-accent/80 transition-colors"
          >
            + New Template
          </button>
        </div>

        {/* Template List — compact rows */}
        {templates.length === 0 ? (
          <div className="bg-stewart-card border border-stewart-border rounded-lg px-4 py-12 text-center text-stewart-muted text-sm">
            No templates yet. Click + New Template to create one.
          </div>
        ) : (
          <div className="bg-stewart-card border border-stewart-border rounded-lg divide-y divide-stewart-border">
            {templates.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelected(selected?.id === t.id ? null : t)}
                className={`w-full flex items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-stewart-accent/5 ${selected?.id === t.id ? "bg-stewart-accent/10" : ""}`}
              >
                <div className="w-8 h-8 rounded-lg bg-stewart-accent/10 flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 24 24" className="w-4 h-4 text-stewart-accent" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M2 8l10 6 10-6" /></svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-stewart-text truncate">{t.template_name}</p>
                  <p className="text-xs text-stewart-muted truncate">{t.subject_template || "No subject"}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-stewart-border text-stewart-muted">{t.template_type}</span>
                  {(t.variables || []).length > 0 && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-stewart-border text-stewart-muted">{(t.variables || []).length} vars</span>
                  )}
                  {statusBadge(t.status)}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Detail Panel — slides below the grid */}
        {selected && (
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 space-y-5">
              <div className="bg-stewart-card border border-stewart-border rounded-lg p-5 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-semibold text-stewart-text">{selected.template_name}</h3>
                    <p className="text-xs text-stewart-muted mt-0.5">{selected.subject_template}</p>
                  </div>
                  <div className="flex gap-1">
                    {statusBadge(selected.template_type)}
                    {statusBadge(selected.status)}
                  </div>
                </div>

                {selected.variables && selected.variables.length > 0 && (
                  <div>
                    <p className="text-[10px] text-stewart-muted uppercase tracking-wide mb-1">Variables</p>
                    <div className="flex flex-wrap gap-1">
                      {selected.variables.map((v) => (
                        <span key={v} className="px-2 py-0.5 bg-stewart-border rounded text-xs font-mono">{`{${v}}`}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {selected.html_content && (
                <div className="bg-stewart-card border border-stewart-border rounded-lg p-5 space-y-4">
                  <h3 className="text-sm font-semibold text-stewart-text">Email Preview</h3>
                  <div className="border border-stewart-border rounded-lg overflow-hidden bg-white">
                    <iframe srcDoc={selected.html_content} className="w-full border-0" style={{ height: "350px" }} sandbox="allow-same-origin" title="Template Preview" />
                  </div>
                </div>
              )}

              {selected.text_content && (
                <div className="bg-stewart-card border border-stewart-border rounded-lg p-5 space-y-3">
                  <h3 className="text-sm font-semibold text-stewart-text">Text Preview</h3>
                  <div className="bg-stewart-bg rounded-lg p-3 text-xs max-h-32 overflow-auto whitespace-pre-wrap text-stewart-muted">
                    {selected.text_content}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-5">
              <div className="bg-stewart-card border border-stewart-border rounded-lg p-5 space-y-3">
                <h3 className="text-sm font-semibold text-stewart-text">Summary</h3>
                <div className="bg-stewart-bg rounded-lg p-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-stewart-muted">Type</span>
                    <span className="text-stewart-text">{selected.template_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stewart-muted">Status</span>
                    <span className="text-stewart-text">{selected.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stewart-muted">Variables</span>
                    <span className="text-stewart-text">{(selected.variables || []).length}</span>
                  </div>
                  {selected.html_content && (
                    <div className="flex justify-between">
                      <span className="text-stewart-muted">HTML size</span>
                      <span className="text-stewart-text">{selected.html_content.length.toLocaleString()} chars</span>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() => goToEdit(selected)}
                className="w-full px-4 py-2.5 bg-stewart-accent text-white text-sm font-medium rounded-lg hover:bg-stewart-accent/80 transition-colors"
              >
                Edit Template
              </button>
              <button
                onClick={() => setSelected(null)}
                className="w-full px-4 py-2 text-stewart-muted text-sm hover:text-stewart-text transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── EDIT VIEW ────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm">
        <button onClick={goToList} className="text-stewart-accent hover:underline">Templates</button>
        <span className="text-stewart-muted">/</span>
        <span className="text-stewart-text">{editing ? editing.template_name : "New Template"}</span>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-5">
          <div className="bg-stewart-card border border-stewart-border rounded-lg p-5 space-y-4">
            <h3 className="text-sm font-semibold text-stewart-text">Template Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-stewart-muted block mb-1">Template Name</label>
                <input
                  value={form.template_name}
                  onChange={(e) => setForm({ ...form, template_name: e.target.value })}
                  className="w-full bg-stewart-bg border border-stewart-border rounded-lg px-4 py-2.5 text-sm text-stewart-text"
                  placeholder="e.g. Distributor Welcome"
                />
              </div>
              <div>
                <label className="text-xs text-stewart-muted block mb-1">Type</label>
                <select
                  value={form.template_type}
                  onChange={(e) => setForm({ ...form, template_type: e.target.value })}
                  className="w-full bg-stewart-bg border border-stewart-border rounded-lg px-3 py-2.5 text-sm text-stewart-text appearance-none cursor-pointer"
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
                <label className="text-xs text-stewart-muted block mb-1">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full bg-stewart-bg border border-stewart-border rounded-lg px-3 py-2.5 text-sm text-stewart-text appearance-none cursor-pointer"
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-stewart-muted block mb-1">Variables (comma-separated)</label>
                <input
                  value={form.variables}
                  onChange={(e) => setForm({ ...form, variables: e.target.value })}
                  className="w-full bg-stewart-bg border border-stewart-border rounded-lg px-4 py-2.5 text-sm text-stewart-text"
                  placeholder="name, unsubscribe_url"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-stewart-muted block mb-1">Subject Template</label>
              <input
                value={form.subject_template}
                onChange={(e) => setForm({ ...form, subject_template: e.target.value })}
                className="w-full bg-stewart-bg border border-stewart-border rounded-lg px-4 py-2.5 text-sm text-stewart-text"
                placeholder="e.g. Welcome to the Sisel Family, {name}"
              />
            </div>
          </div>

          {/* Product Grid — only for templates that use product variables */}
          {form.html_content?.includes("{product_") && (
            <ProductGrid
              selectedProducts={selectedProducts}
              onToggle={(id) => setSelectedProducts((prev) => prev[0] === id ? [] : [id])}
            />
          )}

          {/* Review / Product URL */}
          {selectedProducts.length > 0 && (() => {
            const isReview = form.template_name?.toLowerCase().includes("review");
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

          {/* Email Preview — above HTML editor */}
          {form.html_content && (
            <div className="bg-stewart-card border border-stewart-border rounded-lg p-5 space-y-4">
              <h3 className="text-sm font-semibold text-stewart-text">Email Preview</h3>
              <div className="border border-stewart-border rounded-lg overflow-hidden bg-white">
                <iframe srcDoc={buildPreviewHtml(form.html_content, selectedProducts, productUrl || undefined)} className="w-full border-0" style={{ height: "350px" }} sandbox="allow-same-origin" title="Template Preview" />
              </div>
            </div>
          )}

          <div className="bg-stewart-card border border-stewart-border rounded-lg p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-stewart-text">HTML Content</h3>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-stewart-muted">Build with:</span>
                <a href="https://stripo.email" target="_blank" rel="noopener noreferrer" className="text-[10px] text-stewart-accent hover:underline">Stripo</a>
                <a href="https://www.canva.com/" target="_blank" rel="noopener noreferrer" className="text-[10px] text-stewart-accent hover:underline">Canva</a>
                <a href="https://beefree.io" target="_blank" rel="noopener noreferrer" className="text-[10px] text-stewart-accent hover:underline">BEE Free</a>
              </div>
            </div>
            <textarea
              value={form.html_content}
              onChange={(e) => setForm({ ...form, html_content: e.target.value })}
              className="w-full bg-stewart-bg border border-stewart-border rounded-lg px-4 py-2.5 text-sm font-mono text-green-300"
              rows={14}
              placeholder="Paste HTML email template — supports long URLs, custom CTA buttons, tracking parameters."
            />
            {form.html_content && (
              <p className="text-[10px] text-stewart-muted">{form.html_content.length.toLocaleString()} characters</p>
            )}
            <div>
              <label className="text-xs text-stewart-muted block mb-1">Plain Text Fallback</label>
              <textarea
                value={form.text_content}
                onChange={(e) => setForm({ ...form, text_content: e.target.value })}
                className="w-full bg-stewart-bg border border-stewart-border rounded-lg px-4 py-2.5 text-sm font-mono h-16"
                placeholder="Plain text version"
              />
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-5">
          <div className="bg-stewart-card border border-stewart-border rounded-lg p-5 space-y-3">
            <h3 className="text-sm font-semibold text-stewart-text">Summary</h3>
            <div className="bg-stewart-bg rounded-lg p-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-stewart-muted">Type</span>
                <span className="text-stewart-text">{form.template_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stewart-muted">Status</span>
                <span className="text-stewart-text">{form.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stewart-muted">Variables</span>
                <span className="text-stewart-text">{form.variables ? form.variables.split(",").filter(Boolean).length : 0}</span>
              </div>
              {form.html_content && (
                <div className="flex justify-between">
                  <span className="text-stewart-muted">HTML size</span>
                  <span className="text-stewart-text">{form.html_content.length.toLocaleString()} chars</span>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={!form.template_name}
            className="w-full px-4 py-2.5 bg-stewart-accent text-white text-sm font-medium rounded-lg hover:bg-stewart-accent/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {editing ? "Save Changes" : "Create Template"}
          </button>
          <button onClick={goToList} className="w-full px-4 py-2 text-stewart-muted text-sm hover:text-stewart-text transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
