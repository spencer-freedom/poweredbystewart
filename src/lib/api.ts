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
  EmailSummary,
  EmailTemplate,
  EmailCampaign,
  EmailSend,
  EmailUnsubscribe,
} from "./types";

// ─── Server-side API route ─────────────────────────────────────────────────
// All Supabase queries run server-side via /api/dealeros.
// Client components call these thin wrappers which just fetch the route.

const ROUTE = "/api/dealeros";

async function apiGet<T>(params: Record<string, string>): Promise<T> {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${ROUTE}?${qs}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `API error ${res.status}`);
  }
  return res.json();
}

async function apiPost<T>(
  params: Record<string, string>,
  body?: Record<string, unknown>
): Promise<T> {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${ROUTE}?${qs}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error || `API error ${res.status}`);
  }
  return res.json();
}

async function apiPatch<T>(
  params: Record<string, string>,
  body: Record<string, unknown>
): Promise<T> {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${ROUTE}?${qs}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error || `API error ${res.status}`);
  }
  return res.json();
}

async function apiDelete<T>(params: Record<string, string>): Promise<T> {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${ROUTE}?${qs}`, { method: "DELETE" });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error || `API error ${res.status}`);
  }
  return res.json();
}

// ─── API methods ───────────────────────────────────────────────────────────
// Interface stays identical — page components don't need changes.

export const api = {
  // Clients
  getMarketingClients: () =>
    apiGet<MarketingClient[]>({ action: "clients" }),

  getMarketingClient: (tenantId: string) =>
    apiGet<MarketingClient>({ action: "client", tenant: tenantId }),

  // Leads
  getLeads: (
    tenantId: string,
    month?: string,
    source?: string,
    segment?: string,
    status?: string,
    limit = 200,
    leadType?: string,
    startDate?: string,
    endDate?: string
  ) => {
    const params: Record<string, string> = {
      action: "leads",
      tenant: tenantId,
      limit: String(limit),
    };
    if (startDate && endDate) {
      params.start_date = startDate;
      params.end_date = endDate;
    } else if (month) {
      params.month = month;
    }
    if (source) params.source = source;
    if (segment) params.segment = segment;
    if (status) params.status = status;
    if (leadType) params.lead_type = leadType;
    return apiGet<Lead[]>(params);
  },

  createLead: (data: CreateLeadInput) =>
    apiPost<Lead>(
      { action: "create_lead", tenant: data.tenant_id },
      data as unknown as Record<string, unknown>
    ),

  updateLead: (leadId: number, data: Partial<Lead>) => {
    const tenantId = data.tenant_id || "santa_fe_kia";
    return apiPatch<Lead>(
      { action: "update_lead", tenant: tenantId, id: String(leadId) },
      data as unknown as Record<string, unknown>
    );
  },

  deleteLead: (leadId: number, tenantId = "santa_fe_kia") =>
    apiDelete<{ success: boolean }>({
      action: "delete_lead",
      tenant: tenantId,
      id: String(leadId),
    }),

  // KPI
  getMarketingKpi: (tenantId: string, month?: string) => {
    const params: Record<string, string> = { action: "kpi", tenant: tenantId };
    if (month) params.month = month;
    return apiGet<KpiMonthly>(params);
  },

  getKpiTrend: (tenantId: string, months = 6) =>
    apiGet<KpiMonthly[]>({
      action: "kpi_trend",
      tenant: tenantId,
      months: String(months),
    }),

  // Source Attribution
  getSourceAttribution: (tenantId: string, startMonth?: string, endMonth?: string) => {
    const params: Record<string, string> = {
      action: "source_attribution",
      tenant: tenantId,
    };
    if (startMonth) params.start_month = startMonth;
    if (endMonth) params.end_month = endMonth;
    return apiGet<SourceAttribution[]>(params);
  },

  // Vendors
  getVendors: (tenantId: string) =>
    apiGet<VendorBudget[]>({ action: "vendors", tenant: tenantId }),

  createVendor: (data: CreateVendorInput) =>
    apiPost<VendorBudget>(
      { action: "create_vendor", tenant: data.tenant_id },
      data as unknown as Record<string, unknown>
    ),

  updateVendor: (vendorId: number, data: Partial<VendorBudget>) => {
    const tenantId = data.tenant_id || "santa_fe_kia";
    return apiPatch<VendorBudget>(
      { action: "update_vendor", tenant: tenantId, id: String(vendorId) },
      data as unknown as Record<string, unknown>
    );
  },

  deleteVendor: (vendorId: number, tenantId = "santa_fe_kia") =>
    apiDelete<{ success: boolean }>({
      action: "delete_vendor",
      tenant: tenantId,
      id: String(vendorId),
    }),

  // Lead Sources
  getLeadSources: (tenantId: string) =>
    apiGet<LeadSource[]>({ action: "lead_sources", tenant: tenantId }),

  createLeadSource: (data: CreateLeadSourceInput) =>
    apiPost<LeadSource>(
      { action: "create_lead_source", tenant: data.tenant_id },
      data as unknown as Record<string, unknown>
    ),

  // VinSolutions
  vinUpload: async (_tenantId: string, _file: File): Promise<VinSyncResult> => {
    // File upload requires edge function — not yet migrated to Supabase route
    throw new Error("VIN file upload requires edge function — not yet migrated");
  },

  vinSyncGmail: (tenantId: string) =>
    apiPost<{ success: boolean; error?: string }>(
      { action: "vin_sync_gmail", tenant: tenantId }
    ),

  vinSyncHistory: (tenantId: string, limit = 20) =>
    apiGet<{ runs: VinSyncRun[]; count: number }>({
      action: "vin_sync_history",
      tenant: tenantId,
      limit: String(limit),
    }),

  vinSourceBreakdown: (tenantId: string, month = "") => {
    const params: Record<string, string> = {
      action: "vin_source_breakdown",
      tenant: tenantId,
    };
    if (month) params.month = month;
    return apiGet<{ sources: VinSourceRow[]; count: number }>(params);
  },

  vinSalespersonBreakdown: (tenantId: string, month = "") => {
    const params: Record<string, string> = {
      action: "vin_salesperson_breakdown",
      tenant: tenantId,
    };
    if (month) params.month = month;
    return apiGet<{ reps: VinRepRow[]; count: number }>(params);
  },

  vinResponseTimes: (tenantId: string, month = "") => {
    const params: Record<string, string> = {
      action: "vin_response_times",
      tenant: tenantId,
    };
    if (month) params.month = month;
    return apiGet<VinResponseTimeStats>(params);
  },

  vinSummary: (tenantId: string) =>
    apiGet<VinSummary>({ action: "vin_summary", tenant: tenantId }),

  // Context & Summaries
  getDealershipContext: (tenantId: string) =>
    apiGet<DealershipContext>({ action: "dealership_context", tenant: tenantId }),

  computeSummaries: (tenantId: string, month = "") => {
    const params: Record<string, string> = {
      action: "compute_summaries",
      tenant: tenantId,
    };
    if (month) params.month = month;
    return apiPost<ComputeSummariesResult>(params);
  },

  // ─── Email Marketing (The Post Office) ──────────────────────────────────────

  emailSummary: (tenantId: string) =>
    emailGet<EmailSummary>({ action: "summary", tenant: tenantId }),

  emailListTemplates: (tenantId: string, limit = 50) =>
    emailGet<EmailTemplate[]>({ action: "templates", tenant: tenantId, limit: String(limit) }),

  emailListCampaigns: (tenantId: string, status?: string, limit = 50) => {
    const params: Record<string, string> = { action: "campaigns", tenant: tenantId, limit: String(limit) };
    if (status) params.status = status;
    return emailGet<EmailCampaign[]>(params);
  },

  emailListSends: (tenantId: string, campaignId?: string, sendType?: string, status?: string, limit = 100) => {
    const params: Record<string, string> = { action: "sends", tenant: tenantId, limit: String(limit) };
    if (campaignId) params.campaign_id = campaignId;
    if (sendType) params.send_type = sendType;
    if (status) params.status = status;
    return emailGet<EmailSend[]>(params);
  },

  emailListUnsubscribes: (tenantId: string, limit = 100) =>
    emailGet<EmailUnsubscribe[]>({ action: "unsubscribes", tenant: tenantId, limit: String(limit) }),

  emailCreateTemplate: (tenantId: string, data: Record<string, unknown>) =>
    emailPost<EmailTemplate>({ action: "create_template", tenant: tenantId }, data),

  emailUpdateTemplate: (tenantId: string, templateId: string, data: Record<string, unknown>) =>
    emailPatch<EmailTemplate>({ action: "update_template", tenant: tenantId, id: templateId }, data),

  emailCreateCampaign: (tenantId: string, data: Record<string, unknown>) =>
    emailPost<EmailCampaign>({ action: "create_campaign", tenant: tenantId }, data),

  emailSendCampaign: (tenantId: string, campaignId: string, recipients: { email: string; name: string }[], dryRun = false) =>
    emailPost<Record<string, unknown>>(
      { action: "send_campaign", tenant: tenantId, campaign_id: campaignId, dry_run: String(dryRun) },
      { recipients },
    ),

  emailSendTest: (tenantId: string, campaignId: string, email: string) =>
    emailPost<{ success: boolean; email: string; error?: string }>(
      { action: "send_test", tenant: tenantId, campaign_id: campaignId },
      { email },
    ),

  emailUpdateCampaign: (tenantId: string, campaignId: string, data: Record<string, unknown>) =>
    emailPatch<EmailCampaign>({ action: "update_campaign", tenant: tenantId, id: campaignId }, data),

  emailDeleteCampaign: (tenantId: string, campaignId: string) =>
    emailDelete<{ success: boolean }>({ action: "delete_campaign", tenant: tenantId, id: campaignId }),
};

// ─── Email API helpers (separate route) ───────────────────────────────────────

const EMAIL_ROUTE = "/api/email";

async function emailGet<T>(params: Record<string, string>): Promise<T> {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${EMAIL_ROUTE}?${qs}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `API error ${res.status}`);
  }
  return res.json();
}

async function emailPost<T>(
  params: Record<string, string>,
  body?: Record<string, unknown>
): Promise<T> {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${EMAIL_ROUTE}?${qs}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error || `API error ${res.status}`);
  }
  return res.json();
}

async function emailPatch<T>(
  params: Record<string, string>,
  body: Record<string, unknown>
): Promise<T> {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${EMAIL_ROUTE}?${qs}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error || `API error ${res.status}`);
  }
  return res.json();
}

async function emailDelete<T>(params: Record<string, string>): Promise<T> {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${EMAIL_ROUTE}?${qs}`, { method: "DELETE" });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error || `API error ${res.status}`);
  }
  return res.json();
}
