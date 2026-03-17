"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useTenant } from "@/components/tenant-provider";
import { PageInfo } from "@/components/page-info";
import type { Lead, LeadSource } from "@/lib/types";

const SEGMENT_BADGES: Record<string, string> = {
  New: "bg-blue-500/20 text-blue-400",
  Used: "bg-green-500/20 text-green-400",
  CPO: "bg-yellow-500/20 text-yellow-400",
};

const STATUS_BADGES: Record<string, string> = {
  Working: "bg-yellow-500/20 text-yellow-400",
  Dead: "bg-stewart-border text-stewart-muted",
  Sold: "bg-green-500/20 text-green-400",
};

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function LeadsPage() {
  const { tenantId } = useTenant();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [sources, setSources] = useState<LeadSource[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [monthFilter, setMonthFilter] = useState(getCurrentMonth());
  const [sourceFilter, setSourceFilter] = useState("");
  const [segmentFilter, setSegmentFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({
    customer_name: "",
    lead_date: new Date().toISOString().split("T")[0],
    source: "",
    interest: "",
    segment: "New",
    status: "Working",
    to_salesperson: "",
  });
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<Lead>>({});

  const loadData = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    setError(null);
    try {
      const [leadsRes, sourcesRes] = await Promise.all([
        api.getLeads(tenantId, monthFilter || undefined, sourceFilter || undefined, segmentFilter || undefined, statusFilter || undefined),
        api.getLeadSources(tenantId),
      ]);
      setLeads(leadsRes);
      setSources(sourcesRes);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load leads");
    } finally {
      setLoading(false);
    }
  }, [tenantId, monthFilter, sourceFilter, segmentFilter, statusFilter]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleAddLead = async () => {
    if (!tenantId || !addForm.customer_name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await api.createLead({
        tenant_id: tenantId,
        lead_date: addForm.lead_date,
        customer_name: addForm.customer_name,
        source: addForm.source || undefined,
        interest: addForm.interest || undefined,
        segment: addForm.segment || undefined,
        status: addForm.status || undefined,
        to_salesperson: addForm.to_salesperson || undefined,
      });
      setShowAddForm(false);
      setAddForm({ customer_name: "", lead_date: new Date().toISOString().split("T")[0], source: "", interest: "", segment: "New", status: "Working", to_salesperson: "" });
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create lead");
    } finally {
      setSaving(false);
    }
  };

  const handleEditLead = async (leadId: number) => {
    setSaving(true);
    setError(null);
    try {
      await api.updateLead(leadId, editForm);
      setEditingId(null);
      setEditForm({});
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update lead");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLead = async (leadId: number) => {
    setError(null);
    try {
      await api.deleteLead(leadId);
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete lead");
    }
  };

  const startEditing = (lead: Lead) => {
    setEditingId(lead.id);
    setEditForm({
      customer_name: lead.customer_name,
      source: lead.source,
      interest: lead.interest,
      segment: lead.segment,
      status: lead.status,
      to_salesperson: lead.to_salesperson,
      appt: lead.appt,
      show: lead.show,
      turn_over: lead.turn_over,
    });
  };

  const sourceNames = sources.map((s) => s.source_name);

  if (!tenantId) {
    return <div className="p-8 text-center text-stewart-muted text-sm">No client configured.</div>;
  }

  return (
    <div className="space-y-4">
      <PageInfo pageId="leads" title="Lead tracking and source management">
        <p>Track dealership leads across sources, segments, and salespeople. Filter by month, source, segment, or status.</p>
      </PageInfo>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <label className="text-xs text-stewart-muted block mb-1">Month</label>
          <input type="month" value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} className="px-3 py-1.5 bg-stewart-card border border-stewart-border rounded-md text-sm text-stewart-text" />
        </div>
        <div>
          <label className="text-xs text-stewart-muted block mb-1">Source</label>
          <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} className="px-3 py-1.5 bg-stewart-card border border-stewart-border rounded-md text-sm text-stewart-text">
            <option value="">All Sources</option>
            {sourceNames.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-stewart-muted block mb-1">Segment</label>
          <select value={segmentFilter} onChange={(e) => setSegmentFilter(e.target.value)} className="px-3 py-1.5 bg-stewart-card border border-stewart-border rounded-md text-sm text-stewart-text">
            <option value="">All Segments</option>
            <option value="New">New</option>
            <option value="Used">Used</option>
            <option value="CPO">CPO</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-stewart-muted block mb-1">Status</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-1.5 bg-stewart-card border border-stewart-border rounded-md text-sm text-stewart-text">
            <option value="">All Statuses</option>
            <option value="Working">Working</option>
            <option value="Dead">Dead</option>
            <option value="Sold">Sold</option>
          </select>
        </div>
        <div className="ml-auto self-end">
          <button onClick={() => setShowAddForm(!showAddForm)} className="px-4 py-1.5 bg-stewart-accent text-stewart-bg rounded-md text-sm font-medium hover:bg-stewart-accent/90">
            {showAddForm ? "Cancel" : "Add Lead"}
          </button>
        </div>
      </div>

      {error && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-md text-red-400 text-sm">{error}</div>}

      {/* Summary bar */}
      <div className="flex gap-4 text-xs text-stewart-muted">
        <span>{leads.length} leads</span>
        <span>{leads.filter((l) => l.status === "Sold").length} sold</span>
        <span>{leads.filter((l) => l.appt).length} appts</span>
        <span>{leads.filter((l) => l.show).length} shows</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stewart-border text-left">
              <th className="px-3 py-2 text-xs text-stewart-muted font-medium">Date</th>
              <th className="px-3 py-2 text-xs text-stewart-muted font-medium">Name</th>
              <th className="px-3 py-2 text-xs text-stewart-muted font-medium">Source</th>
              <th className="px-3 py-2 text-xs text-stewart-muted font-medium">Interest</th>
              <th className="px-3 py-2 text-xs text-stewart-muted font-medium">N/U/CPO</th>
              <th className="px-3 py-2 text-xs text-stewart-muted font-medium text-center">Appt</th>
              <th className="px-3 py-2 text-xs text-stewart-muted font-medium text-center">Show</th>
              <th className="px-3 py-2 text-xs text-stewart-muted font-medium text-center">T/O</th>
              <th className="px-3 py-2 text-xs text-stewart-muted font-medium">Salesperson</th>
              <th className="px-3 py-2 text-xs text-stewart-muted font-medium">Status</th>
              <th className="px-3 py-2 text-xs text-stewart-muted font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {showAddForm && (
              <tr className="border-b border-stewart-border bg-stewart-accent/5">
                <td className="px-3 py-2"><input type="date" value={addForm.lead_date} onChange={(e) => setAddForm({ ...addForm, lead_date: e.target.value })} className="w-28 px-2 py-1 bg-stewart-bg border border-stewart-border rounded text-xs text-stewart-text" /></td>
                <td className="px-3 py-2"><input type="text" placeholder="Customer name" value={addForm.customer_name} onChange={(e) => setAddForm({ ...addForm, customer_name: e.target.value })} className="w-full px-2 py-1 bg-stewart-bg border border-stewart-border rounded text-xs text-stewart-text" /></td>
                <td className="px-3 py-2"><select value={addForm.source} onChange={(e) => setAddForm({ ...addForm, source: e.target.value })} className="w-full px-2 py-1 bg-stewart-bg border border-stewart-border rounded text-xs text-stewart-text"><option value="">--</option>{sourceNames.map((s) => <option key={s} value={s}>{s}</option>)}</select></td>
                <td className="px-3 py-2"><input type="text" placeholder="Interest" value={addForm.interest} onChange={(e) => setAddForm({ ...addForm, interest: e.target.value })} className="w-full px-2 py-1 bg-stewart-bg border border-stewart-border rounded text-xs text-stewart-text" /></td>
                <td className="px-3 py-2"><select value={addForm.segment} onChange={(e) => setAddForm({ ...addForm, segment: e.target.value })} className="w-24 px-2 py-1 bg-stewart-bg border border-stewart-border rounded text-xs text-stewart-text"><option value="New">New</option><option value="Used">Used</option><option value="CPO">CPO</option></select></td>
                <td className="px-3 py-2" /><td className="px-3 py-2" /><td className="px-3 py-2" />
                <td className="px-3 py-2"><input type="text" placeholder="Salesperson" value={addForm.to_salesperson} onChange={(e) => setAddForm({ ...addForm, to_salesperson: e.target.value })} className="w-full px-2 py-1 bg-stewart-bg border border-stewart-border rounded text-xs text-stewart-text" /></td>
                <td className="px-3 py-2"><select value={addForm.status} onChange={(e) => setAddForm({ ...addForm, status: e.target.value })} className="w-24 px-2 py-1 bg-stewart-bg border border-stewart-border rounded text-xs text-stewart-text"><option value="Working">Working</option><option value="Dead">Dead</option><option value="Sold">Sold</option></select></td>
                <td className="px-3 py-2"><button onClick={handleAddLead} disabled={saving || !addForm.customer_name.trim()} className="px-3 py-1 bg-stewart-accent text-stewart-bg rounded text-xs font-medium hover:bg-stewart-accent/90 disabled:opacity-50 disabled:cursor-not-allowed">{saving ? "..." : "Save"}</button></td>
              </tr>
            )}
            {loading && leads.length === 0 ? (
              <tr><td colSpan={11} className="px-3 py-8 text-center text-stewart-muted text-sm">Loading leads...</td></tr>
            ) : leads.length === 0 ? (
              <tr><td colSpan={11} className="px-3 py-8 text-center text-stewart-muted text-sm">No leads found for this period.</td></tr>
            ) : (
              leads.map((lead) => (
                <tr key={lead.id} className="border-b border-stewart-border/50 hover:bg-stewart-card/50 transition-colors">
                  {editingId === lead.id ? (
                    <>
                      <td className="px-3 py-2 text-xs text-stewart-muted">{formatDate(lead.lead_date)}</td>
                      <td className="px-3 py-2"><input type="text" value={editForm.customer_name || ""} onChange={(e) => setEditForm({ ...editForm, customer_name: e.target.value })} className="w-full px-2 py-1 bg-stewart-bg border border-stewart-border rounded text-xs text-stewart-text" /></td>
                      <td className="px-3 py-2"><select value={editForm.source || ""} onChange={(e) => setEditForm({ ...editForm, source: e.target.value })} className="w-full px-2 py-1 bg-stewart-bg border border-stewart-border rounded text-xs text-stewart-text"><option value="">--</option>{sourceNames.map((s) => <option key={s} value={s}>{s}</option>)}</select></td>
                      <td className="px-3 py-2"><input type="text" value={editForm.interest || ""} onChange={(e) => setEditForm({ ...editForm, interest: e.target.value })} className="w-full px-2 py-1 bg-stewart-bg border border-stewart-border rounded text-xs text-stewart-text" /></td>
                      <td className="px-3 py-2"><select value={editForm.segment || ""} onChange={(e) => setEditForm({ ...editForm, segment: e.target.value })} className="w-24 px-2 py-1 bg-stewart-bg border border-stewart-border rounded text-xs text-stewart-text"><option value="New">New</option><option value="Used">Used</option><option value="CPO">CPO</option></select></td>
                      <td className="px-3 py-2 text-center"><input type="checkbox" checked={!!editForm.appt} onChange={(e) => setEditForm({ ...editForm, appt: e.target.checked ? 1 : 0 })} className="accent-stewart-accent" /></td>
                      <td className="px-3 py-2 text-center"><input type="checkbox" checked={!!editForm.show} onChange={(e) => setEditForm({ ...editForm, show: e.target.checked ? 1 : 0 })} className="accent-stewart-accent" /></td>
                      <td className="px-3 py-2 text-center"><input type="checkbox" checked={!!editForm.turn_over} onChange={(e) => setEditForm({ ...editForm, turn_over: e.target.checked ? 1 : 0 })} className="accent-stewart-accent" /></td>
                      <td className="px-3 py-2"><input type="text" value={editForm.to_salesperson || ""} onChange={(e) => setEditForm({ ...editForm, to_salesperson: e.target.value })} className="w-full px-2 py-1 bg-stewart-bg border border-stewart-border rounded text-xs text-stewart-text" /></td>
                      <td className="px-3 py-2"><select value={editForm.status || ""} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })} className="w-24 px-2 py-1 bg-stewart-bg border border-stewart-border rounded text-xs text-stewart-text"><option value="Working">Working</option><option value="Dead">Dead</option><option value="Sold">Sold</option></select></td>
                      <td className="px-3 py-2 flex gap-1">
                        <button onClick={() => handleEditLead(lead.id)} disabled={saving} className="px-2 py-1 bg-stewart-accent text-stewart-bg rounded text-xs hover:bg-stewart-accent/90 disabled:opacity-50">{saving ? "..." : "Save"}</button>
                        <button onClick={() => { setEditingId(null); setEditForm({}); }} className="px-2 py-1 text-stewart-muted hover:text-stewart-text text-xs">Cancel</button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-3 py-2 text-xs text-stewart-muted">{formatDate(lead.lead_date)}</td>
                      <td className="px-3 py-2 text-sm text-stewart-text font-medium">{lead.customer_name}</td>
                      <td className="px-3 py-2 text-xs text-stewart-muted">{lead.source || "--"}</td>
                      <td className="px-3 py-2 text-xs text-stewart-muted">{lead.interest || "--"}</td>
                      <td className="px-3 py-2"><span className={`px-2 py-0.5 rounded text-xs font-mono ${SEGMENT_BADGES[lead.segment] || "bg-stewart-border text-stewart-muted"}`}>{lead.segment || "--"}</span></td>
                      <td className="px-3 py-2 text-center">{lead.appt ? <span className="text-green-400 text-xs font-bold">&#10003;</span> : <span className="text-stewart-muted text-xs">--</span>}</td>
                      <td className="px-3 py-2 text-center">{lead.show ? <span className="text-green-400 text-xs font-bold">&#10003;</span> : <span className="text-stewart-muted text-xs">--</span>}</td>
                      <td className="px-3 py-2 text-center">{lead.turn_over ? <span className="text-green-400 text-xs font-bold">&#10003;</span> : <span className="text-stewart-muted text-xs">--</span>}</td>
                      <td className="px-3 py-2 text-xs text-stewart-muted">{lead.to_salesperson || "--"}</td>
                      <td className="px-3 py-2"><span className={`px-2 py-0.5 rounded text-xs font-mono ${STATUS_BADGES[lead.status] || "bg-stewart-border text-stewart-muted"}`}>{lead.status || "--"}</span></td>
                      <td className="px-3 py-2 flex gap-1">
                        <button onClick={() => startEditing(lead)} className="px-2 py-1 text-stewart-muted hover:text-stewart-accent text-xs transition-colors">Edit</button>
                        <button onClick={() => handleDeleteLead(lead.id)} className="px-2 py-1 text-stewart-muted hover:text-red-400 text-xs transition-colors">Del</button>
                      </td>
                    </>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
