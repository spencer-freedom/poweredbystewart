# Powered by Stewart — Handoff to Supabase Migration Claude

## What This Is

`stewart-site/` is a standalone Next.js 15 app at **poweredbystewart.com** — a client-facing dashboard for Jamie (marketing admin) and 2 BDC reps at Kia Santa Fe. It's a clean fork of the SpencerOS/UsefulWax marketing dashboards, rebranded so dealership employees don't log into a record store platform.

**The build passes cleanly** (`npx next build` succeeds). All 10 pages compile. It's ready for deployment once the DB connection is wired.

## Current State: API Layer Needs Supabase Migration

The critical file is **`src/lib/api.ts`**. Right now it uses a `apiFetch()` wrapper that hits a FastAPI proxy (`NEXT_PUBLIC_API_URL`). This is the same pattern the SpencerOS dashboard used before your Supabase migration.

**What needs to happen:** Replace the `apiFetch()` calls in `api.ts` with direct Supabase queries — the same migration you're doing on the UsefulWax side. The page components don't need to change — they all consume the `api.*` methods and render the results.

## File Structure

```
stewart-site/
├── package.json                    # Next.js 15, React 19, Clerk, Supabase
├── tailwind.config.ts              # "stewart-*" color theme (dark)
├── .env.local.example              # Env vars needed
├── src/
│   ├── lib/
│   │   ├── api.ts                  # ⚡ THE FILE TO MIGRATE — all API methods
│   │   ├── types.ts                # All TypeScript interfaces (30+)
│   │   ├── supabase.ts             # Supabase client (already initialized)
│   │   ├── roles.ts                # Role-based page access (admin vs rep)
│   │   └── utils.ts                # cn() utility
│   ├── components/
│   │   ├── sidebar.tsx             # "Powered by Stewart" branded nav
│   │   ├── tenant-provider.tsx     # React context providing tenantId
│   │   ├── auth-provider.tsx       # Clerk token accessor
│   │   └── page-info.tsx           # Collapsible info panels
│   ├── middleware.ts               # Clerk auth middleware
│   └── app/
│       ├── layout.tsx              # Root layout (Clerk + TenantProvider)
│       ├── page.tsx                # Overview dashboard (KPI summary, funnel)
│       ├── leads/page.tsx          # Full CRUD leads table with filters
│       ├── kpi/page.tsx            # KPI benchmarks, trends, segments
│       ├── vendors/page.tsx        # Vendor budget CRUD
│       ├── sources/page.tsx        # Source attribution (3/6/12mo)
│       ├── vinsync/page.tsx        # VinSolutions file upload + sync history
│       ├── compass/page.tsx        # Rep scorecards with COACH flags
│       ├── gauge/page.tsx          # Response time monitoring with grades
│       ├── sentry/page.tsx         # Source ROI flagging (ROI/BURN)
│       └── service/page.tsx        # Coming Soon placeholder
```

## api.ts — All Methods That Need Supabase Queries

Every method below currently calls `apiFetch()` → FastAPI. Each needs to be replaced with a direct Supabase query. The `supabase` client is already imported at the top of the file.

### Read Methods (SELECT queries)

| Method | Current Endpoint | Supabase Table(s) | Notes |
|--------|-----------------|-------------------|-------|
| `getMarketingClients()` | `GET /api/marketing/clients` | `marketing_clients` | |
| `getMarketingClient(tenantId)` | `GET /api/marketing/clients/:id` | `marketing_clients` | Filter by tenant_id |
| `getLeads(tenantId, month?, source?, segment?, status?)` | `GET /api/marketing/leads` | `marketing_leads` | Multiple optional filters, limit param |
| `getMarketingKpi(tenantId, month?)` | `GET /api/marketing/kpi` | `marketing_kpi_monthly` | Single row per tenant+month |
| `getKpiTrend(tenantId, months)` | `GET /api/marketing/kpi/trend` | `marketing_kpi_monthly` | Last N months, ordered by month |
| `getSourceAttribution(tenantId, startMonth?, endMonth?)` | `GET /api/marketing/kpi/sources` | `marketing_source_summaries` or computed | Date range filter |
| `getVendors(tenantId)` | `GET /api/marketing/vendors` | `marketing_vendors` | Filter by tenant_id |
| `getLeadSources(tenantId)` | `GET /api/marketing/sources` | `marketing_lead_sources` | Filter by tenant_id |
| `vinSyncHistory(tenantId, limit)` | `GET /api/marketing/vinsolutions/sync-history` | `vin_sync_runs` | Order by created_at desc |
| `vinSourceBreakdown(tenantId, month?)` | `GET /api/marketing/vinsolutions/sources` | `vin_source_breakdown` or computed | |
| `vinSalespersonBreakdown(tenantId, month?)` | `GET /api/marketing/vinsolutions/salesperson` | `vin_salesperson_breakdown` or computed | |
| `vinResponseTimes(tenantId, month?)` | `GET /api/marketing/vinsolutions/response-times` | `vin_response_times` or computed | Returns overall + by_source + by_rep |
| `vinSummary(tenantId)` | `GET /api/marketing/vinsolutions/summary` | `vin_*` tables aggregated | Totals + last_sync |
| `getDealershipContext(tenantId)` | `GET /api/marketing/context/:id` | `marketing_dealership_context` | |

### Write Methods (INSERT/UPDATE/DELETE)

| Method | Current Endpoint | Supabase Table | Operation |
|--------|-----------------|----------------|-----------|
| `createLead(data)` | `POST /api/marketing/leads` | `marketing_leads` | INSERT |
| `updateLead(leadId, data)` | `PATCH /api/marketing/leads/:id` | `marketing_leads` | UPDATE by id |
| `deleteLead(leadId)` | `DELETE /api/marketing/leads/:id` | `marketing_leads` | DELETE by id |
| `createVendor(data)` | `POST /api/marketing/vendors` | `marketing_vendors` | INSERT |
| `updateVendor(vendorId, data)` | `PATCH /api/marketing/vendors/:id` | `marketing_vendors` | UPDATE by id |
| `deleteVendor(vendorId)` | `DELETE /api/marketing/vendors/:id` | `marketing_vendors` | DELETE by id |
| `createLeadSource(data)` | `POST /api/marketing/sources` | `marketing_lead_sources` | INSERT |
| `computeSummaries(tenantId, month?)` | `POST /api/marketing/summaries/compute` | Multiple | Triggers recomputation |

### Special: File Upload

| Method | Current Endpoint | Notes |
|--------|-----------------|-------|
| `vinUpload(tenantId, file)` | `POST /api/marketing/vinsolutions/upload` | FormData upload — this one may need a Supabase Edge Function or keep the FastAPI endpoint for file processing |

## TypeScript Interfaces

All interfaces are in `src/lib/types.ts`. They match the Supabase table schemas. Key ones:

- `Lead` — 20 fields including `id`, `tenant_id`, `lead_date`, `customer_name`, `source`, `segment`, `appt`, `show`, `status`, etc.
- `KpiMonthly` — 60+ fields covering leads/appts/shows/sold by segment (new/used/cpo), percentages, gross, response times, breakdowns
- `VendorBudget` — `id`, `tenant_id`, `vendor_name`, `service`, `monthly_budget`, `coop_amount`, `true_budget`
- `VinSyncRun` — sync history row with counts per entity type
- `VinSyncResult` — upload response
- `VinSourceRow`, `VinRepRow`, `VinResponseTimeStats` — VinSolutions analytics views
- `SalespersonSummary`, `SourceSummary`, `DealershipSummary` — computed summary types

## Environment Variables Needed

```bash
# Clerk Auth (set up separately for poweredbystewart.com)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Supabase — SAME project as UsefulWax (shares the marketing/DealerOS tables)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Default tenant for auto-selection
NEXT_PUBLIC_DEFAULT_TENANT=kia_santa_fe
```

## How Pages Consume Data

Every page follows the same pattern:
1. `const { tenantId } = useTenant();` — gets tenant from Clerk metadata or env default
2. Calls `api.someMethod(tenantId, ...)` in a `useCallback` + `useEffect`
3. Renders the response with loading/error states

**The pages don't need to change.** Only `api.ts` needs to swap from `apiFetch()` to `supabase.from('table').select()` etc.

## Supabase Client

Already set up in `src/lib/supabase.ts`:
```typescript
import { createClient } from "@supabase/supabase-js";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

Already imported in `api.ts` line 1: `import { supabase } from "./supabase";`

## Role System

Two roles set via Clerk `publicMetadata.role`:
- **admin** (Jamie): sees all 10 pages — Leads, KPI, Vendors, Sources, VinSync, Compass, Gauge, Sentry, Service
- **rep** (BDC reps): sees 4 pages — Overview, Leads, Compass, Gauge

Tenant is set via Clerk `publicMetadata.tenantId` with fallback to `NEXT_PUBLIC_DEFAULT_TENANT`.

## Deployment

Target: Vercel at **poweredbystewart.com**. Standard Next.js deployment. Once env vars are set and api.ts is migrated to Supabase, it's deploy-ready.

## Key Differences from SpencerOS Dashboard

1. **Standalone app** — separate repo/deploy, not a route in the SpencerOS dashboard
2. **CSS prefix**: `stewart-*` instead of `workshop-*` (same dark color scheme)
3. **TenantProvider context** instead of URL search params (`useTenant()` vs `useSearchParams`)
4. **No StewartChat widget** — clean dashboard only
5. **Clerk conditional imports** — all Clerk usage wrapped in try/catch require() so the app builds and runs without Clerk configured (for local dev)
6. **Brand**: "Powered by Stewart — Marketing Intelligence" in sidebar

## What's NOT Needed

- No FastAPI server — once api.ts is migrated, it's 100% client-side Supabase
- No localhost:8000 dependency
- No SpencerOS imports — fully self-contained
