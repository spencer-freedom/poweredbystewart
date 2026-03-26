// ─── Marketing / DealerOS Types ───
// Mirrors the SpencerOS dashboard types for the marketing dashboards.
// These match the Supabase table schemas used by DealerOS.

export interface MarketingClient {
  tenant_id: string;
  display_name: string;
  business_type: string;
  crm_provider: string;
  meta_ad_account_id: string;
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  benchmarks: Record<string, number>;
  status: string;
  created_at: string;
}

export type LeadType = "internet" | "walkin" | "phone" | "service";

export interface Lead {
  id: number;
  tenant_id: string;
  lead_date: string;
  customer_name: string;
  source: string;
  source_confidence: string;
  interest: string;
  segment: string;
  lead_type: LeadType;
  past_actions: string;
  appt: number;
  show: number;
  turn_over: number;
  to_date: string | null;
  to_salesperson: string;
  status: string;
  future_actions: string;
  crm_lead_id: string;
  metadata: string;
  created_at: string;
  updated_at: string;
}

export interface CreateLeadInput {
  tenant_id: string;
  lead_date: string;
  customer_name: string;
  source?: string;
  interest?: string;
  segment?: string;
  lead_type?: LeadType;
  appt?: boolean;
  show?: boolean;
  turn_over?: boolean;
  to_salesperson?: string;
  status?: string;
  past_actions?: string;
  future_actions?: string;
}

export interface KpiMonthly {
  tenant_id: string;
  month: string;
  total_leads: number;
  total_contacted: number;
  total_appts: number;
  total_shows: number;
  total_sold: number;
  total_turns: number;
  new_leads: number;
  new_appts: number;
  new_shows: number;
  new_sold: number;
  used_leads: number;
  used_appts: number;
  used_shows: number;
  used_sold: number;
  cpo_leads: number;
  cpo_appts: number;
  cpo_shows: number;
  cpo_sold: number;
  appt_showed: number;
  new_appt_showed: number;
  used_appt_showed: number;
  cpo_appt_showed: number;
  walk_ins: number;
  sold_from_appt: number;
  sold_from_walkin: number;
  beback_total?: number;
  beback_appt?: number;
  beback_sold?: number;
  beback_appt_sold?: number;
  beback_walkin?: number;
  beback_walkin_sold?: number;
  pct_contacted: number;
  pct_appt_set: number;
  pct_show_set: number;
  pct_show_sold: number;
  pct_overall: number;
  source_breakdown: Record<string, { leads: number; sold: number }>;
  salesperson_breakdown: Record<string, { leads: number; sold: number }>;
  total_showroom_visits?: number;
  total_test_drives?: number;
  total_walkarounds?: number;
  total_write_ups?: number;
  total_trade_appraisals?: number;
  total_be_backs?: number;
  avg_response_time_minutes?: number | null;
  total_dms_confirmed?: number;
  total_front_gross?: number | null;
  total_back_gross?: number | null;
  total_total_gross?: number | null;
  avg_days_to_sell?: number | null;
  engagement_breakdown?: Record<string, { visits: number; test_drives: number; write_ups: number }>;
  gross_breakdown?: Record<string, { front: number; back: number; total: number; deals: number }>;
}

export interface SourceAttribution {
  source: string;
  leads: number;
  new_leads: number;
  used_leads: number;
  cpo_leads: number;
  sold: number;
  pct_of_sold: number;
  budget: number;
  cost_per_lead: number | null;
  cost_per_sold: number | null;
}

export interface VendorBudget {
  id: number;
  tenant_id: string;
  vendor_name: string;
  service: string;
  monthly_budget: number;
  coop_amount: number;
  true_budget: number;
  is_active: number;
  notes: string;
  created_at: string;
}

export interface CreateVendorInput {
  tenant_id: string;
  vendor_name: string;
  service?: string;
  monthly_budget?: number;
  coop_amount?: number;
  notes?: string;
}

export interface LeadSource {
  id: number;
  tenant_id: string;
  source_name: string;
  source_key: string;
  attribution_type: string;
  is_active: number;
  created_at: string;
}

export interface CreateLeadSourceInput {
  tenant_id: string;
  source_name: string;
  source_key: string;
  attribution_type?: string;
}

export interface VinSyncRun {
  id: number;
  tenant_id: string;
  sync_type: string;
  file_name: string;
  status: string;
  total_rows: number;
  leads_upserted: number;
  appointments_upserted: number;
  crm_sales_upserted: number;
  dms_sales_upserted: number;
  visits_upserted: number;
  trade_ins_upserted: number;
  sources_created: number;
  leads_synced: number;
  kpi_months_recomputed: number;
  duration_seconds: number;
  error: string | null;
  created_at: string;
}

export interface VinSyncResult {
  success: boolean;
  sync_id?: number;
  file_name?: string;
  duration_seconds?: number;
  leads_upserted?: number;
  appointments_upserted?: number;
  crm_sales_upserted?: number;
  dms_sales_upserted?: number;
  visits_upserted?: number;
  trade_ins_upserted?: number;
  sources_created?: number;
  leads_synced?: { created: number; updated: number; total: number };
  kpi_months_recomputed?: number;
  error?: string;
}

export interface VinSourceRow {
  lead_source: string;
  leads: number;
  appointments: number;
  shows: number;
  sold: number;
  total_gross: number | null;
  avg_response_min: number | null;
}

export interface VinRepRow {
  sales_rep: string;
  leads: number;
  contacted: number;
  avg_response_min: number | null;
  appointments: number;
  shows: number;
  sold: number;
  front_gross: number | null;
  back_gross: number | null;
  total_gross: number | null;
  test_drives: number;
  write_ups: number;
}

export interface VinShowroomStats {
  total_visits: number;
  test_drives: number;
  walkarounds: number;
  write_ups: number;
  trade_appraisals: number;
  be_backs: number;
}

export interface VinResponseTimeStats {
  overall: {
    avg_minutes: number | null;
    min_minutes: number | null;
    max_minutes: number | null;
    total_with_response: number;
  };
  by_source: { lead_source: string; avg_minutes: number; count: number }[];
  by_rep: { sales_rep: string; avg_minutes: number; count: number }[];
}

export interface VinSummary {
  total_leads: number;
  total_appointments: number;
  total_crm_sales: number;
  total_dms_sales: number;
  total_showroom_visits: number;
  total_trade_ins: number;
  last_sync: VinSyncRun | null;
}

export interface DealershipContext {
  tenant_id: string;
  context_text: string;
  context_json: {
    health?: { score?: number; flags?: string[] };
    funnel?: { leads?: number; sold?: number; close_rate?: number };
    response?: { avg_minutes?: number | null };
    reps?: { best?: { name?: string; sold?: number }; worst?: { name?: string; sold?: number } };
    sources?: { top?: { name?: string; leads?: number; cpl?: number | null }; bottom?: { name?: string } };
    budget?: { total?: number; spent?: number; utilization_pct?: number; days_remaining?: number };
    gross?: { total?: number; per_deal?: number };
    [key: string]: unknown;
  };
  token_estimate: number;
  current_month: string;
  months_included: string[];
  computed_at: string;
  tier1_freshness: string | null;
  source_freshness: string | null;
  version: number;
  error?: string;
}

export interface SalespersonSummary {
  salesperson: string;
  leads_assigned: number;
  leads_contacted: number;
  appointments_set: number;
  shows: number;
  sold: number;
  avg_response_minutes: number | null;
  best_response_minutes: number | null;
  worst_response_minutes: number | null;
  contact_rate: number;
  close_rate: number;
  appt_set_rate: number;
  show_rate: number;
  test_drives: number;
  write_ups: number;
  walkarounds: number;
  front_gross: number;
  back_gross: number;
  total_gross: number;
  leads_trend_pct: number | null;
  sold_trend_pct: number | null;
  response_trend_pct: number | null;
  rank_by_sold: number | null;
  rank_by_response: number | null;
  rank_by_close_rate: number | null;
  total_peers: number;
  computed_at: string;
  source_freshness: string | null;
}

export interface SourceSummary {
  source_key: string;
  lead_count: number;
  appointments: number;
  shows: number;
  sold: number;
  avg_response_minutes: number | null;
  conversion_rate: number;
  appt_rate: number;
  show_rate: number;
  monthly_spend: number;
  cpl: number | null;
  cps: number | null;
  roi: number | null;
  budget_utilization_pct: number | null;
  total_gross: number;
  leads_trend_pct: number | null;
  sold_trend_pct: number | null;
  cpl_trend_pct: number | null;
  rank_by_leads: number | null;
  rank_by_sold: number | null;
  rank_by_roi: number | null;
  total_sources: number;
  computed_at: string;
  source_freshness: string | null;
}

export interface DealershipSummary {
  tenant_id: string;
  month: string;
  total_leads: number;
  total_appointments: number;
  total_shows: number;
  total_sold: number;
  avg_response_minutes: number | null;
  median_response_minutes: number | null;
  overall_close_rate: number;
  appt_set_rate: number;
  show_set_rate: number;
  best_rep: string;
  best_rep_sold: number;
  best_rep_close_rate: number;
  worst_rep: string;
  worst_rep_sold: number;
  worst_rep_close_rate: number;
  top_source: string;
  top_source_leads: number;
  top_source_cpl: number | null;
  bottom_source: string;
  bottom_source_leads: number;
  bottom_source_cpl: number | null;
  total_budget: number;
  total_spend: number;
  budget_utilization_pct: number;
  days_remaining: number;
  front_gross: number;
  back_gross: number;
  total_gross: number;
  avg_gross_per_deal: number;
  health_score: number;
  health_flags: string[];
  leads_trend_pct: number | null;
  sold_trend_pct: number | null;
  response_trend_pct: number | null;
  computed_at: string;
  source_freshness: string | null;
}

export interface ComputeSummariesResult {
  tenant_id: string;
  month: string;
  salesperson_rows: number;
  source_rows: number;
  health_score: number | null;
  token_estimate: number | null;
  version: number | null;
}

// ─── User roles ───

export type UserRole = "admin" | "rep";

export interface StewartUser {
  id: string;
  role: UserRole;
  tenantId: string;
  name: string;
}

// ─── Email Marketing (The Post Office) ───

export interface EmailSummary {
  campaigns: { total: number; sent: number; draft: number; scheduled: number; sending: number };
  sends: { total: number; campaign: number; transactional: number; sent: number; failed: number };
  templates: number;
  unsubscribes: number;
}

export interface EmailTemplate {
  id: string;
  tenant_id: string;
  template_name: string;
  template_type: string;
  subject_template: string;
  html_content: string;
  text_content: string;
  variables: string[];
  status: string;
  created_at: string;
  updated_at: string;
}

export interface EmailCampaign {
  id: string;
  tenant_id: string;
  campaign_name: string;
  template_id: string | null;
  subject: string;
  body_html: string;
  body_text: string;
  status: string;
  scheduled_at: string | null;
  sent_at: string | null;
  total_recipients: number;
  sent_count: number;
  delivered_count: number;
  opened_count: number;
  clicked_count: number;
  bounced_count: number;
  unsubscribed_count: number;
  audience_criteria: string | Record<string, unknown>;
  metadata: string;
  created_at: string;
  updated_at: string;
}

export interface EmailSend {
  id: number;
  tenant_id: string;
  campaign_id: string | null;
  customer_id: string;
  email: string;
  customer_name: string;
  send_type: string;
  template_type: string;
  subject: string;
  status: string;
  sent_at: string | null;
  error: string;
  created_at: string;
}

export interface EmailUnsubscribe {
  id: number;
  tenant_id: string;
  email: string;
  reason: string;
  source: string;
  created_at: string;
}
