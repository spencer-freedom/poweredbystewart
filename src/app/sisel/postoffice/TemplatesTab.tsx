"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import type { EmailTemplate } from "@/lib/types";
import { statusBadge } from "@/lib/ui/badges";

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
  const [showPreview, setShowPreview] = useState(false);
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
    setShowPreview(false);
  };

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
    } else {
      setEditing(null);
      setForm(defaultForm);
    }
    setView("edit");
    setSelected(null);
    setShowPreview(false);
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

        <div className="flex gap-4">
          <div className={`${selected ? "w-1/2" : "w-full"}`}>
            <div className="bg-stewart-card border border-stewart-border rounded-lg overflow-hidden">
              {templates.length === 0 ? (
                <div className="px-4 py-12 text-center text-stewart-muted text-sm">
                  No templates yet. Click + New Template to create one.
                </div>
              ) : (
                <div className="divide-y divide-stewart-border/30">
                  {templates.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setSelected(selected?.id === t.id ? null : t)}
                      className={`w-full text-left px-5 py-3.5 hover:bg-stewart-border/20 transition-colors group ${selected?.id === t.id ? "bg-stewart-border/30" : ""}`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-stewart-text group-hover:text-stewart-accent transition-colors">{t.template_name}</span>
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
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Detail Panel */}
          {selected && (
            <div className="w-1/2 space-y-5">
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
                    <iframe srcDoc={selected.html_content} className="w-full border-0" style={{ height: "300px" }} sandbox="allow-same-origin" title="Template Preview" />
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

              <button
                onClick={() => goToEdit(selected)}
                className="w-full px-4 py-2.5 bg-stewart-card border border-stewart-border text-stewart-text text-sm font-medium rounded-lg hover:bg-stewart-border/50 transition-colors"
              >
                Edit Template
              </button>
            </div>
          )}
        </div>
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

          <div className="bg-stewart-card border border-stewart-border rounded-lg p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-stewart-text">HTML Content</h3>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-stewart-muted">Build with:</span>
                <a href="https://stripo.email" target="_blank" rel="noopener noreferrer" className="text-[10px] text-stewart-accent hover:underline">Stripo</a>
                <a href="https://www.canva.com/email-newsletters/" target="_blank" rel="noopener noreferrer" className="text-[10px] text-stewart-accent hover:underline">Canva</a>
                <a href="https://beefree.io" target="_blank" rel="noopener noreferrer" className="text-[10px] text-stewart-accent hover:underline">BEE Free</a>
                {form.html_content && (
                  <button onClick={() => setShowPreview(!showPreview)} className="text-[10px] text-stewart-accent hover:underline">
                    {showPreview ? "Hide Preview" : "Show Preview"}
                  </button>
                )}
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
            {showPreview && form.html_content && (
              <div>
                <p className="text-xs text-stewart-muted mb-1">Live Preview</p>
                <div className="border border-stewart-border rounded-lg overflow-hidden bg-white">
                  <iframe srcDoc={form.html_content} className="w-full border-0" style={{ height: "350px" }} sandbox="allow-same-origin" title="Template Preview" />
                </div>
              </div>
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
