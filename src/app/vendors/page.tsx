"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useTenant } from "@/components/tenant-provider";
import { PageInfo } from "@/components/page-info";
import type { VendorBudget } from "@/lib/types";

function fmtCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return "$0.00";
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function VendorsPage() {
  const { tenantId } = useTenant();
  const [vendors, setVendors] = useState<VendorBudget[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ vendor_name: "", service: "", monthly_budget: "", coop_amount: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ vendor_name: "", service: "", monthly_budget: "", coop_amount: "", notes: "", is_active: 1 });

  const loadData = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.getVendors(tenantId);
      setVendors(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load vendors");
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleAddVendor = async () => {
    if (!tenantId || !addForm.vendor_name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await api.createVendor({ tenant_id: tenantId, vendor_name: addForm.vendor_name, service: addForm.service || undefined, monthly_budget: addForm.monthly_budget ? parseFloat(addForm.monthly_budget) : undefined, coop_amount: addForm.coop_amount ? parseFloat(addForm.coop_amount) : undefined, notes: addForm.notes || undefined });
      setShowAddForm(false);
      setAddForm({ vendor_name: "", service: "", monthly_budget: "", coop_amount: "", notes: "" });
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create vendor");
    } finally {
      setSaving(false);
    }
  };

  const handleEditVendor = async (vendorId: number) => {
    setSaving(true);
    setError(null);
    try {
      await api.updateVendor(vendorId, { vendor_name: editForm.vendor_name, service: editForm.service, monthly_budget: parseFloat(editForm.monthly_budget) || 0, coop_amount: parseFloat(editForm.coop_amount) || 0, notes: editForm.notes, is_active: editForm.is_active });
      setEditingId(null);
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update vendor");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteVendor = async (vendorId: number) => {
    setError(null);
    try { await api.deleteVendor(vendorId); await loadData(); } catch (e) { setError(e instanceof Error ? e.message : "Failed to delete vendor"); }
  };

  const startEditing = (v: VendorBudget) => {
    setEditingId(v.id);
    setEditForm({ vendor_name: v.vendor_name, service: v.service, monthly_budget: String(v.monthly_budget), coop_amount: String(v.coop_amount), notes: v.notes, is_active: v.is_active });
  };

  const totalBudget = vendors.reduce((sum, v) => sum + (v.monthly_budget || 0), 0);
  const totalCoop = vendors.reduce((sum, v) => sum + (v.coop_amount || 0), 0);
  const totalTrue = vendors.reduce((sum, v) => sum + (v.true_budget || 0), 0);

  if (!tenantId) return <div className="p-8 text-center text-stewart-muted text-sm">No client configured.</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-stewart-muted uppercase tracking-wider">Vendor Budgets</h2>
        <button onClick={() => setShowAddForm(!showAddForm)} className="px-4 py-1.5 bg-stewart-accent text-stewart-bg rounded-md text-sm font-medium hover:bg-stewart-accent/90">{showAddForm ? "Cancel" : "Add Vendor"}</button>
      </div>

      <PageInfo pageId="vendors" title="Manage vendor budgets and co-op allocations">
        <p>Track monthly spend for each marketing vendor, including co-op contributions. True Budget = Monthly Budget minus Co-Op.</p>
      </PageInfo>

      {error && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-md text-red-400 text-sm">{error}</div>}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stewart-border text-left">
              <th className="px-3 py-2 text-xs text-stewart-muted font-medium">Vendor</th>
              <th className="px-3 py-2 text-xs text-stewart-muted font-medium">Service</th>
              <th className="px-3 py-2 text-xs text-stewart-muted font-medium text-right">Monthly Budget</th>
              <th className="px-3 py-2 text-xs text-stewart-muted font-medium text-right">Co-Op</th>
              <th className="px-3 py-2 text-xs text-stewart-muted font-medium text-right">True Budget</th>
              <th className="px-3 py-2 text-xs text-stewart-muted font-medium text-center">Active</th>
              <th className="px-3 py-2 text-xs text-stewart-muted font-medium">Notes</th>
              <th className="px-3 py-2 text-xs text-stewart-muted font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {showAddForm && (
              <tr className="border-b border-stewart-border bg-stewart-accent/5">
                <td className="px-3 py-2"><input type="text" placeholder="Vendor name" value={addForm.vendor_name} onChange={(e) => setAddForm({ ...addForm, vendor_name: e.target.value })} className="w-full px-2 py-1 bg-stewart-bg border border-stewart-border rounded text-xs text-stewart-text" /></td>
                <td className="px-3 py-2"><input type="text" placeholder="Service" value={addForm.service} onChange={(e) => setAddForm({ ...addForm, service: e.target.value })} className="w-full px-2 py-1 bg-stewart-bg border border-stewart-border rounded text-xs text-stewart-text" /></td>
                <td className="px-3 py-2"><input type="number" placeholder="0.00" value={addForm.monthly_budget} onChange={(e) => setAddForm({ ...addForm, monthly_budget: e.target.value })} className="w-28 px-2 py-1 bg-stewart-bg border border-stewart-border rounded text-xs text-stewart-text text-right" /></td>
                <td className="px-3 py-2"><input type="number" placeholder="0.00" value={addForm.coop_amount} onChange={(e) => setAddForm({ ...addForm, coop_amount: e.target.value })} className="w-28 px-2 py-1 bg-stewart-bg border border-stewart-border rounded text-xs text-stewart-text text-right" /></td>
                <td className="px-3 py-2 text-xs text-stewart-muted text-right">--</td>
                <td className="px-3 py-2" />
                <td className="px-3 py-2"><input type="text" placeholder="Notes" value={addForm.notes} onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })} className="w-full px-2 py-1 bg-stewart-bg border border-stewart-border rounded text-xs text-stewart-text" /></td>
                <td className="px-3 py-2"><button onClick={handleAddVendor} disabled={saving || !addForm.vendor_name.trim()} className="px-3 py-1 bg-stewart-accent text-stewart-bg rounded text-xs font-medium hover:bg-stewart-accent/90 disabled:opacity-50 disabled:cursor-not-allowed">{saving ? "..." : "Save"}</button></td>
              </tr>
            )}
            {loading && vendors.length === 0 ? (
              <tr><td colSpan={8} className="px-3 py-8 text-center text-stewart-muted text-sm">Loading vendors...</td></tr>
            ) : vendors.length === 0 ? (
              <tr><td colSpan={8} className="px-3 py-8 text-center text-stewart-muted text-sm">No vendors configured yet.</td></tr>
            ) : (
              vendors.map((v) => (
                <tr key={v.id} className="border-b border-stewart-border/50 hover:bg-stewart-card/50 transition-colors">
                  {editingId === v.id ? (
                    <>
                      <td className="px-3 py-2"><input type="text" value={editForm.vendor_name} onChange={(e) => setEditForm({ ...editForm, vendor_name: e.target.value })} className="w-full px-2 py-1 bg-stewart-bg border border-stewart-border rounded text-xs text-stewart-text" /></td>
                      <td className="px-3 py-2"><input type="text" value={editForm.service} onChange={(e) => setEditForm({ ...editForm, service: e.target.value })} className="w-full px-2 py-1 bg-stewart-bg border border-stewart-border rounded text-xs text-stewart-text" /></td>
                      <td className="px-3 py-2"><input type="number" value={editForm.monthly_budget} onChange={(e) => setEditForm({ ...editForm, monthly_budget: e.target.value })} className="w-28 px-2 py-1 bg-stewart-bg border border-stewart-border rounded text-xs text-stewart-text text-right" /></td>
                      <td className="px-3 py-2"><input type="number" value={editForm.coop_amount} onChange={(e) => setEditForm({ ...editForm, coop_amount: e.target.value })} className="w-28 px-2 py-1 bg-stewart-bg border border-stewart-border rounded text-xs text-stewart-text text-right" /></td>
                      <td className="px-3 py-2 text-xs text-stewart-text text-right">{fmtCurrency((parseFloat(editForm.monthly_budget) || 0) - (parseFloat(editForm.coop_amount) || 0))}</td>
                      <td className="px-3 py-2 text-center"><input type="checkbox" checked={!!editForm.is_active} onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked ? 1 : 0 })} className="accent-stewart-accent" /></td>
                      <td className="px-3 py-2"><input type="text" value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} className="w-full px-2 py-1 bg-stewart-bg border border-stewart-border rounded text-xs text-stewart-text" /></td>
                      <td className="px-3 py-2 flex gap-1">
                        <button onClick={() => handleEditVendor(v.id)} disabled={saving} className="px-2 py-1 bg-stewart-accent text-stewart-bg rounded text-xs hover:bg-stewart-accent/90 disabled:opacity-50">{saving ? "..." : "Save"}</button>
                        <button onClick={() => setEditingId(null)} className="px-2 py-1 text-stewart-muted hover:text-stewart-text text-xs">Cancel</button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-3 py-2 text-sm text-stewart-text font-medium">{v.vendor_name}</td>
                      <td className="px-3 py-2 text-xs text-stewart-muted">{v.service || "--"}</td>
                      <td className="px-3 py-2 text-xs text-stewart-text text-right">{fmtCurrency(v.monthly_budget)}</td>
                      <td className="px-3 py-2 text-xs text-stewart-text text-right">{fmtCurrency(v.coop_amount)}</td>
                      <td className="px-3 py-2 text-xs text-stewart-text text-right font-medium">{fmtCurrency(v.true_budget)}</td>
                      <td className="px-3 py-2 text-center"><span className={`inline-block w-2.5 h-2.5 rounded-full ${v.is_active ? "bg-green-400" : "bg-gray-500"}`} /></td>
                      <td className="px-3 py-2 text-xs text-stewart-muted max-w-[200px] truncate">{v.notes || "--"}</td>
                      <td className="px-3 py-2 flex gap-1">
                        <button onClick={() => startEditing(v)} className="px-2 py-1 text-stewart-muted hover:text-stewart-accent text-xs transition-colors">Edit</button>
                        <button onClick={() => handleDeleteVendor(v.id)} className="px-2 py-1 text-stewart-muted hover:text-red-400 text-xs transition-colors">Del</button>
                      </td>
                    </>
                  )}
                </tr>
              ))
            )}
            {vendors.length > 0 && (
              <tr className="border-t-2 border-stewart-border bg-stewart-card/30">
                <td className="px-3 py-2 text-xs text-stewart-text font-bold" colSpan={2}>Totals</td>
                <td className="px-3 py-2 text-xs text-stewart-text text-right font-bold">{fmtCurrency(totalBudget)}</td>
                <td className="px-3 py-2 text-xs text-stewart-text text-right font-bold">{fmtCurrency(totalCoop)}</td>
                <td className="px-3 py-2 text-xs text-stewart-accent text-right font-bold">{fmtCurrency(totalTrue)}</td>
                <td colSpan={3} />
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
