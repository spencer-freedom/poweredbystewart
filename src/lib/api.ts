import { supabase } from "./supabase";
import type {
  MarketingClient,
  Lead,
  CreateLeadInput,
  KpiMonthly,
  SourceAttribution,
  VendorBudget,
  CreateVendorInput,
  LeadSource,
  CreateLeadSourceInput,
  VinSyncRun,
  VinSyncResult,
  VinSourceRow,
  VinRepRow,
  VinResponseTimeStats,
  VinSummary,
  DealershipContext,
  ComputeSummariesResult,
} from "./types";

// ─── Fallback API base (used for endpoints not yet migrated to Supabase) ───
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  if (!API_BASE) throw new Error("API_BASE not configured — waiting for Supabase migration");
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers as Record<string, string>),
    },
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${res.statusText}`);
  return res.json();
}

// ─── API methods ───
// These currently use the FastAPI proxy pattern (same as SpencerOS dashboard).
// They will be migrated to direct Supabase queries once the UsefulWax
// Supabase rewiring is finalized. The interface stays the same.

export const api = {
  // Clients
  getMarketingClients: () =>
    apiFetch<MarketingClient[]>("/api/marketing/clients"),

  getMarketingClient: (tenantId: string) =>
    apiFetch<MarketingClient>(`/api/marketing/clients/${tenantId}`),

  // Leads
  getLeads: (tenantId: string, month?: string, source?: string, segment?: string, status?: string, limit = 200) => {
    const params = new URLSearchParams({ tenant_id: tenantId });
    if (month) params.set("month", month);
    if (source) params.set("source", source);
    if (segment) params.set("segment", segment);
    if (status) params.set("status", status);
    params.set("limit", String(limit));
    return apiFetch<Lead[]>(`/api/marketing/leads?${params}`);
  },

  createLead: (data: CreateLeadInput) =>
    apiFetch<Lead>("/api/marketing/leads", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateLead: (leadId: number, data: Partial<Lead>) =>
    apiFetch<Lead>(`/api/marketing/leads/${leadId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteLead: (leadId: number) =>
    apiFetch<{ success: boolean }>(`/api/marketing/leads/${leadId}`, { method: "DELETE" }),

  // KPI
  getMarketingKpi: (tenantId: string, month?: string) =>
    apiFetch<KpiMonthly>(`/api/marketing/kpi?tenant_id=${tenantId}${month ? `&month=${month}` : ""}`),

  getKpiTrend: (tenantId: string, months = 6) =>
    apiFetch<KpiMonthly[]>(`/api/marketing/kpi/trend?tenant_id=${tenantId}&months=${months}`),

  // Source Attribution
  getSourceAttribution: (tenantId: string, startMonth?: string, endMonth?: string) => {
    const params = new URLSearchParams({ tenant_id: tenantId });
    if (startMonth) params.set("start_month", startMonth);
    if (endMonth) params.set("end_month", endMonth);
    return apiFetch<SourceAttribution[]>(`/api/marketing/kpi/sources?${params}`);
  },

  // Vendors
  getVendors: (tenantId: string) =>
    apiFetch<VendorBudget[]>(`/api/marketing/vendors?tenant_id=${tenantId}`),

  createVendor: (data: CreateVendorInput) =>
    apiFetch<VendorBudget>("/api/marketing/vendors", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateVendor: (vendorId: number, data: Partial<VendorBudget>) =>
    apiFetch<VendorBudget>(`/api/marketing/vendors/${vendorId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteVendor: (vendorId: number) =>
    apiFetch<{ success: boolean }>(`/api/marketing/vendors/${vendorId}`, { method: "DELETE" }),

  // Lead Sources
  getLeadSources: (tenantId: string) =>
    apiFetch<LeadSource[]>(`/api/marketing/sources?tenant_id=${tenantId}`),

  createLeadSource: (data: CreateLeadSourceInput) =>
    apiFetch<LeadSource>("/api/marketing/sources", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // VinSolutions
  vinUpload: async (tenantId: string, file: File): Promise<VinSyncResult> => {
    if (!API_BASE) throw new Error("API_BASE not configured");
    const formData = new FormData();
    formData.append("tenant_id", tenantId);
    formData.append("file", file);
    const res = await fetch(`${API_BASE}/api/marketing/vinsolutions/upload`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) throw new Error(`API error ${res.status}: ${res.statusText}`);
    return res.json();
  },

  vinSyncGmail: (tenantId: string) =>
    apiFetch<{ success: boolean; error?: string }>(`/api/marketing/vinsolutions/sync-gmail?tenant_id=${tenantId}`, {
      method: "POST",
    }),

  vinSyncHistory: (tenantId: string, limit = 20) =>
    apiFetch<{ runs: VinSyncRun[]; count: number }>(
      `/api/marketing/vinsolutions/sync-history?tenant_id=${tenantId}&limit=${limit}`
    ),

  vinSourceBreakdown: (tenantId: string, month = "") =>
    apiFetch<{ sources: VinSourceRow[]; count: number }>(
      `/api/marketing/vinsolutions/sources?tenant_id=${tenantId}${month ? `&month=${month}` : ""}`
    ),

  vinSalespersonBreakdown: (tenantId: string, month = "") =>
    apiFetch<{ reps: VinRepRow[]; count: number }>(
      `/api/marketing/vinsolutions/salesperson?tenant_id=${tenantId}${month ? `&month=${month}` : ""}`
    ),

  vinResponseTimes: (tenantId: string, month = "") =>
    apiFetch<VinResponseTimeStats>(
      `/api/marketing/vinsolutions/response-times?tenant_id=${tenantId}${month ? `&month=${month}` : ""}`
    ),

  vinSummary: (tenantId: string) =>
    apiFetch<VinSummary>(`/api/marketing/vinsolutions/summary?tenant_id=${tenantId}`),

  // Context & Summaries
  getDealershipContext: (tenantId: string) =>
    apiFetch<DealershipContext>(`/api/marketing/context/${tenantId}`),

  computeSummaries: (tenantId: string, month = "") =>
    apiFetch<ComputeSummariesResult>(`/api/marketing/summaries/compute?tenant_id=${tenantId}${month ? `&month=${month}` : ""}`, {
      method: "POST",
    }),
};
