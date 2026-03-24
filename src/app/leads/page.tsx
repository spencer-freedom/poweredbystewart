"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { useTenant } from "@/components/tenant-provider";
import { PageInfo } from "@/components/page-info";
import type { Lead, LeadSource } from "@/lib/types";

const SEGMENT_BADGES: Record<string, string> = {
  new: "bg-blue-500/20 text-blue-400",
  used: "bg-green-500/20 text-green-400",
  cpo: "bg-yellow-500/20 text-yellow-400",
  New: "bg-blue-500/20 text-blue-400",
  Used: "bg-green-500/20 text-green-400",
  CPO: "bg-yellow-500/20 text-yellow-400",
};

const STATUS_BADGES: Record<string, string> = {
  working: "bg-yellow-500/20 text-yellow-400",
  dead: "bg-stewart-border text-stewart-muted",
  sold: "bg-green-500/20 text-green-400",
  Working: "bg-yellow-500/20 text-yellow-400",
  Dead: "bg-stewart-border text-stewart-muted",
  Sold: "bg-green-500/20 text-green-400",
};

const CONTACTED_KEYWORDS = ["contacted", "conacted", "yes", "called", "emailed", "texted"];

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthStart(month: string): string {
  return `${month}-01`;
}

function getMonthEnd(month: string): string {
  const [y, m] = month.split("-").map(Number);
  const lastDay = new Date(y, m, 0).getDate();
  return `${month}-${String(lastDay).padStart(2, "0")}`;
}

type DateMode = "month" | "custom";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function isContacted(pastActions: string): boolean {
  if (!pastActions) return false;
  const lower = pastActions.toLowerCase();
  return CONTACTED_KEYWORDS.some((kw) => lower.includes(kw));
}

export default function LeadsPage() {
  const { tenantId } = useTenant();
  const searchParams = useSearchParams();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [sources, setSources] = useState<LeadSource[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [dateMode, setDateMode] = useState<DateMode>(searchParams.get("start_date") ? "custom" : "month");
  const [monthFilter, setMonthFilter] = useState(searchParams.get("month") || getCurrentMonth());
  const [startDate, setStartDate] = useState(searchParams.get("start_date") || getMonthStart(getCurrentMonth()));
  const [endDate, setEndDate] = useState(searchParams.get("end_date") || getMonthEnd(getCurrentMonth()));
  const [sourceFilter, setSourceFilter] = useState(searchParams.get("source") || "");
  const [segmentFilter, setSegmentFilter] = useState(searchParams.get("segment") || "");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "");
  const [leadTypeFilter, setLeadTypeFilter] = useState("");


  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({
    customer_name: "",
    lead_date: new Date().toISOString().split("T")[0],
    source: "",
    interest: "",
    segment: "new",
    status: "working",
    to_salesperson: "",
    past_actions: "",
    future_actions: "",
    appt: 0,
    show: 0,
    turn_over: 0,
  });
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<Lead>>({});
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  const loadData = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    setError(null);
    try {
      const [leadsRes, sourcesRes] = await Promise.all([
        dateMode === "custom"
          ? api.getLeads(tenantId, undefined, sourceFilter || undefined, segmentFilter || undefined, statusFilter || undefined, 1000, leadTypeFilter || undefined, startDate, endDate)
          : api.getLeads(tenantId, monthFilter || undefined, sourceFilter || undefined, segmentFilter || undefined, statusFilter || undefined, 1000, leadTypeFilter || undefined),
        api.getLeadSources(tenantId),
      ]);
      setLeads(leadsRes as Lead[]);
      setSources(sourcesRes);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load leads");
    } finally {
      setLoading(false);
    }
  }, [tenantId, dateMode, monthFilter, startDate, endDate, sourceFilter, segmentFilter, statusFilter, leadTypeFilter]);

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
        appt: addForm.appt ? true : false,
        show: addForm.show ? true : false,
        turn_over: addForm.turn_over ? true : false,
      });
      setShowAddForm(false);
      setAddForm({ customer_name: "", lead_date: new Date().toISOString().split("T")[0], source: "", interest: "", segment: "new", status: "working", to_salesperson: "", past_actions: "", future_actions: "", appt: 0, show: 0, turn_over: 0 });
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
    if (!confirm("Delete this lead? This cannot be undone.")) return;
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
      past_actions: lead.past_actions,
      future_actions: lead.future_actions,
      appt: lead.appt,
      show: lead.show,
      turn_over: lead.turn_over,
    });
  };

  const sourceNames = sources.map((s) => s.source_name);
  const filteredLeads = leads;
  const contacted = filteredLeads.filter((l) => isContacted(l.past_actions)).length;

  if (!tenantId) {
    return <div className="p-8 text-center text-stewart-muted text-sm">No client configured.</div>;
  }

  return (
    <div className="space-y-4">
      <PageInfo pageId="leads" title="Lead tracking and source management">
        <p>Track dealership leads across sources, segments, and salespeople. Filter by month, source, segment, or status.</p>
      </PageInfo>

      {/* Help Panel */}
      <div className="bg-stewart-card border border-stewart-border rounded-lg overflow-hidden">
        <button onClick={() => setShowHelp(!showHelp)} className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-stewart-text hover:bg-stewart-card/80 transition-colors">
          <span className="font-medium">How to use the Leads Dashboard</span>
          <span className="text-stewart-muted text-xs">{showHelp ? "Hide" : "Show"}</span>
        </button>
        {showHelp && (
          <div className="px-4 pb-4 pt-1 border-t border-stewart-border text-xs text-stewart-muted space-y-3">
            <div>
              <h4 className="font-semibold text-stewart-text mb-1">Adding a Lead</h4>
              <ol className="list-decimal list-inside space-y-0.5">
                <li>Click the <strong className="text-stewart-accent">&quot;+ New Lead&quot;</strong> button in the top right</li>
                <li>Fill in the customer name (required), date, source, interest, and segment</li>
                <li>Check Appt / Show / T/O as applicable</li>
                <li>Add past actions (e.g. &quot;Contacted&quot;, &quot;Left VM&quot;) and future actions (e.g. &quot;Follow up Friday&quot;)</li>
                <li>Click <strong>&quot;Save Lead&quot;</strong></li>
              </ol>
            </div>
            <div>
              <h4 className="font-semibold text-stewart-text mb-1">Editing a Lead</h4>
              <p>Click <strong>&quot;Edit&quot;</strong> on any row to update fields inline. Hit <strong>&quot;Save&quot;</strong> when done. You can update status (Working / Dead / Sold), past actions, salesperson, and all checkboxes.</p>
            </div>
            <div>
              <h4 className="font-semibold text-stewart-text mb-1">Viewing Lead Details</h4>
              <p>Click any row to expand and see all details including T/O date, lead type, and full past/future actions.</p>
            </div>
            <div>
              <h4 className="font-semibold text-stewart-text mb-1">Filtering</h4>
              <ul className="list-disc list-inside space-y-0.5">
                <li><strong>Month</strong> &mdash; switch between months to view that month&#39;s leads</li>
                <li><strong>Source</strong> &mdash; filter by lead source (e.g. AutoTrader, TrueCar, Website)</li>
                <li><strong>Segment</strong> &mdash; filter by New, Used, or CPO</li>
                <li><strong>Status</strong> &mdash; filter by Working, Dead, or Sold</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-stewart-text mb-1">Summary Bar</h4>
              <p>The counts above the table show total leads, contacted, appointments set, shows, and sold for the current view.</p>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <label className="text-xs text-stewart-muted block mb-1">Date Range</label>
          <div className="flex items-center gap-1">
            <select value={dateMode} onChange={(e) => {
              const mode = e.target.value as DateMode;
              setDateMode(mode);
              if (mode === "month") {
                setStartDate(getMonthStart(monthFilter));
                setEndDate(getMonthEnd(monthFilter));
              }
            }} className="px-2 py-1.5 bg-stewart-card border border-stewart-border rounded-md text-sm text-stewart-text">
              <option value="month">Month</option>
              <option value="custom">Custom</option>
            </select>
            {dateMode === "month" ? (
              <input type="month" value={monthFilter} onChange={(e) => {
                setMonthFilter(e.target.value);
                setStartDate(getMonthStart(e.target.value));
                setEndDate(getMonthEnd(e.target.value));
              }} className="px-3 py-1.5 bg-stewart-card border border-stewart-border rounded-md text-sm text-stewart-text" />
            ) : (
              <>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="px-2 py-1.5 bg-stewart-card border border-stewart-border rounded-md text-sm text-stewart-text" />
                <span className="text-stewart-muted text-xs">to</span>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="px-2 py-1.5 bg-stewart-card border border-stewart-border rounded-md text-sm text-stewart-text" />
              </>
            )}
          </div>
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
            <option value="new">New</option>
            <option value="used">Used</option>
            <option value="cpo">CPO</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-stewart-muted block mb-1">Status</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-1.5 bg-stewart-card border border-stewart-border rounded-md text-sm text-stewart-text">
            <option value="">All Statuses</option>
            <option value="working">Working</option>
            <option value="dead">Dead</option>
            <option value="sold">Sold</option>
          </select>
        </div>
        <div className="ml-auto self-end">
          <button onClick={() => setShowAddForm(!showAddForm)} className="px-4 py-1.5 bg-stewart-accent text-stewart-bg rounded-md text-sm font-medium hover:bg-stewart-accent/90">
            {showAddForm ? "Cancel" : "+ New Lead"}
          </button>
        </div>
      </div>

      {error && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-md text-red-400 text-sm">{error}</div>}

      {/* Summary bar */}
      <div className="flex gap-4 text-xs text-stewart-muted">
        <span><strong className="text-stewart-text">{filteredLeads.length}</strong> leads</span>
        <span><strong className="text-stewart-text">{contacted}</strong> contacted</span>
        <span><strong className="text-stewart-text">{filteredLeads.filter((l) => l.appt).length}</strong> appts</span>
        <span><strong className="text-stewart-text">{filteredLeads.filter((l) => l.show).length}</strong> shows</span>
        <span><strong className="text-green-400">{filteredLeads.filter((l) => l.status === "sold" || l.status === "Sold").length}</strong> sold</span>
      </div>

      {/* Add Lead Form — card style */}
      {showAddForm && (
        <div className="bg-stewart-card border border-stewart-border rounded-lg p-4 space-y-3">
          <h3 className="text-sm font-semibold text-stewart-text">New Lead</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-xs text-stewart-muted block mb-1">Date</label>
              <input type="date" value={addForm.lead_date} onChange={(e) => setAddForm({ ...addForm, lead_date: e.target.value })} className="w-full px-2 py-1.5 bg-stewart-bg border border-stewart-border rounded text-sm text-stewart-text" />
            </div>
            <div>
              <label className="text-xs text-stewart-muted block mb-1">Customer Name *</label>
              <input type="text" placeholder="John Smith" value={addForm.customer_name} onChange={(e) => setAddForm({ ...addForm, customer_name: e.target.value })} className="w-full px-2 py-1.5 bg-stewart-bg border border-stewart-border rounded text-sm text-stewart-text" />
            </div>
            <div>
              <label className="text-xs text-stewart-muted block mb-1">Source</label>
              <select value={addForm.source} onChange={(e) => setAddForm({ ...addForm, source: e.target.value })} className="w-full px-2 py-1.5 bg-stewart-bg border border-stewart-border rounded text-sm text-stewart-text">
                <option value="">Select source</option>
                {sourceNames.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-stewart-muted block mb-1">Interest</label>
              <input type="text" placeholder="2026 Sportage" value={addForm.interest} onChange={(e) => setAddForm({ ...addForm, interest: e.target.value })} className="w-full px-2 py-1.5 bg-stewart-bg border border-stewart-border rounded text-sm text-stewart-text" />
            </div>
            <div>
              <label className="text-xs text-stewart-muted block mb-1">Segment</label>
              <select value={addForm.segment} onChange={(e) => setAddForm({ ...addForm, segment: e.target.value })} className="w-full px-2 py-1.5 bg-stewart-bg border border-stewart-border rounded text-sm text-stewart-text">
                <option value="new">New</option>
                <option value="used">Used</option>
                <option value="cpo">CPO</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-stewart-muted block mb-1">Salesperson</label>
              <input type="text" placeholder="Rep name" value={addForm.to_salesperson} onChange={(e) => setAddForm({ ...addForm, to_salesperson: e.target.value })} className="w-full px-2 py-1.5 bg-stewart-bg border border-stewart-border rounded text-sm text-stewart-text" />
            </div>
            <div>
              <label className="text-xs text-stewart-muted block mb-1">Status</label>
              <select value={addForm.status} onChange={(e) => setAddForm({ ...addForm, status: e.target.value })} className="w-full px-2 py-1.5 bg-stewart-bg border border-stewart-border rounded text-sm text-stewart-text">
                <option value="working">Working</option>
                <option value="dead">Dead</option>
                <option value="sold">Sold</option>
              </select>
            </div>
            <div className="flex items-end gap-4 pb-1">
              <label className="flex items-center gap-1.5 text-xs text-stewart-muted cursor-pointer">
                <input type="checkbox" checked={!!addForm.appt} onChange={(e) => setAddForm({ ...addForm, appt: e.target.checked ? 1 : 0 })} className="accent-stewart-accent" /> Appt
              </label>
              <label className="flex items-center gap-1.5 text-xs text-stewart-muted cursor-pointer">
                <input type="checkbox" checked={!!addForm.show} onChange={(e) => setAddForm({ ...addForm, show: e.target.checked ? 1 : 0 })} className="accent-stewart-accent" /> Show
              </label>
              <label className="flex items-center gap-1.5 text-xs text-stewart-muted cursor-pointer">
                <input type="checkbox" checked={!!addForm.turn_over} onChange={(e) => setAddForm({ ...addForm, turn_over: e.target.checked ? 1 : 0 })} className="accent-stewart-accent" /> T/O
              </label>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-stewart-muted block mb-1">Past Actions</label>
              <input type="text" placeholder="Contacted, left VM, etc." value={addForm.past_actions} onChange={(e) => setAddForm({ ...addForm, past_actions: e.target.value })} className="w-full px-2 py-1.5 bg-stewart-bg border border-stewart-border rounded text-sm text-stewart-text" />
            </div>
            <div>
              <label className="text-xs text-stewart-muted block mb-1">Future Actions</label>
              <input type="text" placeholder="Follow up, schedule appt, etc." value={addForm.future_actions} onChange={(e) => setAddForm({ ...addForm, future_actions: e.target.value })} className="w-full px-2 py-1.5 bg-stewart-bg border border-stewart-border rounded text-sm text-stewart-text" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button onClick={() => setShowAddForm(false)} className="px-4 py-1.5 text-stewart-muted hover:text-stewart-text text-sm">Cancel</button>
            <button onClick={handleAddLead} disabled={saving || !addForm.customer_name.trim()} className="px-4 py-1.5 bg-stewart-accent text-stewart-bg rounded-md text-sm font-medium hover:bg-stewart-accent/90 disabled:opacity-50 disabled:cursor-not-allowed">{saving ? "Saving..." : "Save Lead"}</button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stewart-border text-left">
              <th className="px-2 py-2 text-xs text-stewart-muted font-medium w-[80px]"></th>
              <th className="px-3 py-2 text-xs text-stewart-muted font-medium">Date</th>
              <th className="px-3 py-2 text-xs text-stewart-muted font-medium">Name</th>
              <th className="px-3 py-2 text-xs text-stewart-muted font-medium">Source</th>
              <th className="px-3 py-2 text-xs text-stewart-muted font-medium">Interest</th>
              <th className="px-3 py-2 text-xs text-stewart-muted font-medium">Seg</th>
              <th className="px-3 py-2 text-xs text-stewart-muted font-medium">Past Actions</th>
              <th className="px-3 py-2 text-xs text-stewart-muted font-medium text-center">Appt</th>
              <th className="px-3 py-2 text-xs text-stewart-muted font-medium text-center">Show</th>
              <th className="px-3 py-2 text-xs text-stewart-muted font-medium text-center">T/O</th>
              <th className="px-3 py-2 text-xs text-stewart-muted font-medium">Salesperson</th>
              <th className="px-3 py-2 text-xs text-stewart-muted font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading && filteredLeads.length === 0 ? (
              <tr><td colSpan={12} className="px-3 py-8 text-center text-stewart-muted text-sm">Loading leads...</td></tr>
            ) : filteredLeads.length === 0 ? (
              <tr><td colSpan={12} className="px-3 py-8 text-center text-stewart-muted text-sm">No leads found for this period.</td></tr>
            ) : (
              filteredLeads.map((lead) => (
                editingId === lead.id ? (
                  <tr key={lead.id} className="border-b border-stewart-border bg-stewart-accent/5">
                    <td className="px-2 py-2">
                      <div className="flex gap-1">
                        <button onClick={() => handleEditLead(lead.id)} disabled={saving} className="px-2.5 py-1 bg-stewart-accent text-stewart-bg rounded text-xs font-medium hover:bg-stewart-accent/90 disabled:opacity-50">{saving ? "..." : "Save"}</button>
                        <button onClick={() => { setEditingId(null); setEditForm({}); }} className="px-2 py-1 bg-stewart-border text-stewart-text rounded text-xs hover:bg-stewart-border/70">X</button>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-xs text-stewart-muted">{formatDate(lead.lead_date)}</td>
                    <td className="px-3 py-2"><input type="text" value={editForm.customer_name || ""} onChange={(e) => setEditForm({ ...editForm, customer_name: e.target.value })} className="w-full px-2 py-1 bg-stewart-bg border border-stewart-border rounded text-xs text-stewart-text" /></td>
                    <td className="px-3 py-2"><select value={editForm.source || ""} onChange={(e) => setEditForm({ ...editForm, source: e.target.value })} className="w-full px-2 py-1 bg-stewart-bg border border-stewart-border rounded text-xs text-stewart-text"><option value="">--</option>{sourceNames.map((s) => <option key={s} value={s}>{s}</option>)}</select></td>
                    <td className="px-3 py-2"><input type="text" value={editForm.interest || ""} onChange={(e) => setEditForm({ ...editForm, interest: e.target.value })} className="w-full px-2 py-1 bg-stewart-bg border border-stewart-border rounded text-xs text-stewart-text" /></td>
                    <td className="px-3 py-2"><select value={editForm.segment || ""} onChange={(e) => setEditForm({ ...editForm, segment: e.target.value })} className="w-20 px-2 py-1 bg-stewart-bg border border-stewart-border rounded text-xs text-stewart-text"><option value="new">New</option><option value="used">Used</option><option value="cpo">CPO</option></select></td>
                    <td className="px-3 py-2"><input type="text" value={editForm.past_actions || ""} onChange={(e) => setEditForm({ ...editForm, past_actions: e.target.value })} className="w-full px-2 py-1 bg-stewart-bg border border-stewart-border rounded text-xs text-stewart-text" /></td>
                    <td className="px-3 py-2 text-center"><input type="checkbox" checked={!!editForm.appt} onChange={(e) => setEditForm({ ...editForm, appt: e.target.checked ? 1 : 0 })} className="accent-stewart-accent" /></td>
                    <td className="px-3 py-2 text-center"><input type="checkbox" checked={!!editForm.show} onChange={(e) => setEditForm({ ...editForm, show: e.target.checked ? 1 : 0 })} className="accent-stewart-accent" /></td>
                    <td className="px-3 py-2 text-center"><input type="checkbox" checked={!!editForm.turn_over} onChange={(e) => setEditForm({ ...editForm, turn_over: e.target.checked ? 1 : 0 })} className="accent-stewart-accent" /></td>
                    <td className="px-3 py-2"><input type="text" value={editForm.to_salesperson || ""} onChange={(e) => setEditForm({ ...editForm, to_salesperson: e.target.value })} className="w-full px-2 py-1 bg-stewart-bg border border-stewart-border rounded text-xs text-stewart-text" /></td>
                    <td className="px-3 py-2"><select value={editForm.status || ""} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })} className="w-20 px-2 py-1 bg-stewart-bg border border-stewart-border rounded text-xs text-stewart-text"><option value="working">Working</option><option value="dead">Dead</option><option value="sold">Sold</option></select></td>
                  </tr>
                ) : (
                  <tr key={lead.id} className="border-b border-stewart-border/50 hover:bg-stewart-card/50 transition-colors cursor-pointer" onClick={() => setExpandedId(expandedId === lead.id ? null : lead.id)}>
                    <td className="px-2 py-2" onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-1">
                        <button onClick={() => startEditing(lead)} className="px-2.5 py-1 bg-stewart-accent/20 text-stewart-accent rounded text-xs font-medium hover:bg-stewart-accent/30 transition-colors">Edit</button>
                        <button onClick={() => handleDeleteLead(lead.id)} className="px-2 py-1 bg-red-500/10 text-red-400 rounded text-xs font-medium hover:bg-red-500/20 transition-colors">Del</button>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-xs text-stewart-muted">{formatDate(lead.lead_date)}</td>
                    <td className="px-3 py-2 text-sm text-stewart-text font-medium">{lead.customer_name}</td>
                    <td className="px-3 py-2 text-xs text-stewart-muted">{lead.source || "--"}</td>
                    <td className="px-3 py-2 text-xs text-stewart-muted max-w-[140px] truncate">{lead.interest || "--"}</td>
                    <td className="px-3 py-2"><span className={`px-2 py-0.5 rounded text-xs font-mono ${SEGMENT_BADGES[lead.segment] || "bg-stewart-border text-stewart-muted"}`}>{lead.segment || "--"}</span></td>
                    <td className="px-3 py-2 text-xs text-stewart-muted max-w-[160px] truncate">{lead.past_actions || <span className="text-stewart-border">--</span>}</td>
                    <td className="px-3 py-2 text-center">{lead.appt ? <span className="text-green-400 text-xs font-bold">&#10003;</span> : <span className="text-stewart-border">--</span>}</td>
                    <td className="px-3 py-2 text-center">{lead.show ? <span className="text-green-400 text-xs font-bold">&#10003;</span> : <span className="text-stewart-border">--</span>}</td>
                    <td className="px-3 py-2 text-center">{lead.turn_over ? <span className="text-green-400 text-xs font-bold">&#10003;</span> : <span className="text-stewart-border">--</span>}</td>
                    <td className="px-3 py-2 text-xs text-stewart-muted">{lead.to_salesperson || "--"}</td>
                    <td className="px-3 py-2"><span className={`px-2 py-0.5 rounded text-xs font-mono ${STATUS_BADGES[lead.status] || "bg-stewart-border text-stewart-muted"}`}>{lead.status || "--"}</span></td>
                  </tr>
                )
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Expanded lead detail */}
      {expandedId && (() => {
        const lead = filteredLeads.find((l) => l.id === expandedId);
        if (!lead) return null;
        return (
          <div className="bg-stewart-card border border-stewart-border rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between items-start">
              <h3 className="font-semibold text-stewart-text">{lead.customer_name}</h3>
              <button onClick={() => setExpandedId(null)} className="text-stewart-muted hover:text-stewart-text text-xs">Close</button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-1 text-xs">
              <div><span className="text-stewart-muted">Date:</span> <span className="text-stewart-text">{lead.lead_date}</span></div>
              <div><span className="text-stewart-muted">Source:</span> <span className="text-stewart-text">{lead.source || "--"}</span></div>
              <div><span className="text-stewart-muted">Interest:</span> <span className="text-stewart-text">{lead.interest || "--"}</span></div>
              <div><span className="text-stewart-muted">Segment:</span> <span className="text-stewart-text">{lead.segment}</span></div>
              <div><span className="text-stewart-muted">Status:</span> <span className="text-stewart-text">{lead.status}</span></div>
              <div><span className="text-stewart-muted">Salesperson:</span> <span className="text-stewart-text">{lead.to_salesperson || "--"}</span></div>
              <div><span className="text-stewart-muted">T/O Date:</span> <span className="text-stewart-text">{lead.to_date || "--"}</span></div>
              <div><span className="text-stewart-muted">Type:</span> <span className="text-stewart-text">{lead.lead_type || "internet"}</span></div>
            </div>
            {lead.past_actions && (
              <div className="text-xs"><span className="text-stewart-muted">Past Actions:</span> <span className="text-stewart-text">{lead.past_actions}</span></div>
            )}
            {lead.future_actions && (
              <div className="text-xs"><span className="text-stewart-muted">Future Actions:</span> <span className="text-stewart-text">{lead.future_actions}</span></div>
            )}
          </div>
        );
      })()}
    </div>
  );
}
