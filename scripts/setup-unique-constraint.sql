-- Run this in Supabase SQL Editor BEFORE running the backfill
-- Creates the unique constraint needed for lead upserts

-- Unique constraint on leads (for upsert by tenant + date + name)
ALTER TABLE leads
ADD CONSTRAINT leads_tenant_date_name_unique
UNIQUE (tenant_id, lead_date, customer_name);

-- Unique constraint on kpi_monthly (for upsert by tenant + month)
ALTER TABLE kpi_monthly
ADD CONSTRAINT kpi_monthly_tenant_month_unique
UNIQUE (tenant_id, month);

-- Unique constraint on vendor_budgets (for upsert by tenant + vendor name)
ALTER TABLE vendor_budgets
ADD CONSTRAINT vendor_budgets_tenant_vendor_unique
UNIQUE (tenant_id, vendor_name);
