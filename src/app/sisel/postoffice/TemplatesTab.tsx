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

export function TemplatesTab({ tenantId, onReloadSummary }: Props) {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selected, setSelected] = useState<EmailTemplate | null>(null);
  const [showForm, setShowForm] = useState(false);
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

  const handleEdit = (t: EmailTemplate) => {
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
    setShowForm(true);
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
      setShowForm(false);
      setEditing(null);
      setForm(defaultForm);
      load();
    } catch {
      setError(editing ? "Failed to update template" : "Failed to create template");
    }
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
    setForm(defaultForm);
  };

  if (error) {
    return (
      <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-md text-red-400 text-sm">
        {error}
        <button onClick={() => { setError(""); load(); }} className="ml-3 underline">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => { setShowForm(true); setEditing(null); setForm(defaultForm); setSelected(null); }}
          className="px-3 py-1.5 text-xs bg-stewart-accent/10 text-stewart-accent border border-stewart-accent/30 rounded-md hover:bg-stewart-accent/20 transition-colors"
        >
          + New Template
        </button>
      </div>

      <div className="flex gap-4">
        <div className={`${selected ? "w-1/2" : "w-full"} space-y-4`}>
          {/* Create/Edit Form */}
          {showForm && (
            <div className="bg-stewart-card border border-stewart-accent/30 rounded-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-semibold">{editing ? "Edit Template" : "New Template"}</h3>
                <button onClick={closeForm} className="text-xs text-stewart-muted hover:text-stewart-text">Cancel</button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-stewart-muted">Template Name</label>
                  <input
                    value={form.template_name}
                    onChange={(e) => setForm({ ...form, template_name: e.target.value })}
                    className="w-full bg-stewart-bg border border-stewart-border rounded px-2 py-1 text-sm mt-1"
                    placeholder="e.g. Distributor Welcome"
                  />
                </div>
                <div>
                  <label className="text-xs text-stewart-muted">Type</label>
                  <select
                    value={form.template_type}
                    onChange={(e) => setForm({ ...form, template_type: e.target.value })}
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
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full bg-stewart-bg border border-stewart-border rounded px-2 py-1 text-sm mt-1"
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-stewart-muted">Variables (comma-separated)</label>
                  <input
                    value={form.variables}
                    onChange={(e) => setForm({ ...form, variables: e.target.value })}
                    className="w-full bg-stewart-bg border border-stewart-border rounded px-2 py-1 text-sm mt-1"
                    placeholder="name, unsubscribe_url"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-stewart-muted">Subject Template</label>
                  <input
                    value={form.subject_template}
                    onChange={(e) => setForm({ ...form, subject_template: e.target.value })}
                    className="w-full bg-stewart-bg border border-stewart-border rounded px-2 py-1 text-sm mt-1"
                    placeholder="e.g. Welcome to the Sisel Family, {name}"
                  />
                </div>
                <div className="col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-stewart-muted">HTML Content</label>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-stewart-muted">Build with:</span>
                      <a href="https://stripo.email" target="_blank" rel="noopener noreferrer" className="text-[10px] text-stewart-accent hover:underline">Stripo</a>
                      <a href="https://www.canva.com/email-newsletters/" target="_blank" rel="noopener noreferrer" className="text-[10px] text-stewart-accent hover:underline">Canva</a>
                      <a href="https://beefree.io" target="_blank" rel="noopener noreferrer" className="text-[10px] text-stewart-accent hover:underline">BEE Free</a>
                      <span className="text-[10px] text-stewart-muted">then paste HTML below</span>
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
                    className="w-full bg-stewart-bg border border-stewart-border rounded px-3 py-2 text-sm mt-1 font-mono text-green-300"
                    rows={12}
                    placeholder="Paste HTML email template — supports long URLs, custom CTA buttons, tracking parameters."
                  />
                  {form.html_content && (
                    <p className="text-[10px] text-stewart-muted mt-1">
                      {form.html_content.length.toLocaleString()} characters
                    </p>
                  )}
                </div>
                {showPreview && form.html_content && (
                  <div className="col-span-2">
                    <p className="text-xs text-stewart-muted mb-1">Live Preview</p>
                    <div className="border border-stewart-border rounded-lg overflow-hidden bg-white">
                      <iframe srcDoc={form.html_content} className="w-full border-0" style={{ height: "350px" }} sandbox="allow-same-origin" title="Template Preview" />
                    </div>
                  </div>
                )}
                <div className="col-span-2">
                  <label className="text-xs text-stewart-muted">Text Content (plain text fallback)</label>
                  <textarea
                    value={form.text_content}
                    onChange={(e) => setForm({ ...form, text_content: e.target.value })}
                    className="w-full bg-stewart-bg border border-stewart-border rounded px-2 py-1 text-sm mt-1 h-16 font-mono"
                    placeholder="Plain text version"
                  />
                </div>
              </div>
              <div className="mt-3 flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={!form.template_name}
                  className="px-4 py-1.5 text-sm bg-stewart-accent/20 text-stewart-accent border border-stewart-accent/30 rounded hover:bg-stewart-accent/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editing ? "Save Changes" : "Create Template"}
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
                  onClick={() => setSelected(selected?.id === t.id ? null : t)}
                  className={`w-full text-left px-4 py-3 hover:bg-stewart-border/20 transition-colors ${
                    selected?.id === t.id ? "bg-stewart-border/30" : ""
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

        {/* Detail Panel */}
        {selected && (
          <div className="w-1/2 bg-stewart-card border border-stewart-border rounded-lg p-4 space-y-4 h-fit">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-semibold">{selected.template_name}</h3>
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

            {selected.html_content && (
              <div>
                <p className="text-[10px] text-stewart-muted uppercase tracking-wide mb-1">Email Preview</p>
                <div className="border border-stewart-border rounded-lg overflow-hidden bg-white">
                  <iframe srcDoc={selected.html_content} className="w-full border-0" style={{ height: "300px" }} sandbox="allow-same-origin" title="Template Preview" />
                </div>
              </div>
            )}

            {selected.text_content && (
              <div>
                <p className="text-[10px] text-stewart-muted uppercase tracking-wide mb-1">Text Preview</p>
                <div className="bg-stewart-bg rounded p-3 text-xs max-h-32 overflow-auto whitespace-pre-wrap">
                  {selected.text_content}
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2 border-t border-stewart-border/50">
              <button
                onClick={() => handleEdit(selected)}
                className="px-3 py-1 text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded hover:bg-blue-500/30 transition-colors"
              >
                Edit
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
