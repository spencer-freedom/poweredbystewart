"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useTenant } from "@/components/tenant-provider";

/* ─── types ─── */

interface WindowStats {
  window_days: number;
  same_source_spam: number;
  all_clusters: number;
  multi_channel: number;
  clean_leads: number;
  spam_pct: number;
  cluster_pct: number;
}

interface Summary {
  total_leads: number;
  unique_customers: number;
  windows: { "7d": WindowStats; "30d": WindowStats };
}

interface SpamSource {
  source: string;
  excess_leads: number;
  affected_customers: number;
}

interface TimelineEntry {
  lead_id: string;
  date: string;
  source: string;
  source_type: string;
  sales_rep: string;
  status: string;
  vehicle: string;
  dupe_type: "unique" | "same_source_spam" | "multi_channel" | "re_engagement";
}

interface CustomerCluster {
  customer: string;
  lead_count: number;
  source_count: number;
  first_lead: string;
  last_lead: string;
  timeline: TimelineEntry[];
}

interface SourceROI {
  source: string;
  total_leads: number;
  unique_customers: number;
  excess_leads: number;
  noise_pct: number;
  sold: number;
  unique_sold: number;
  conversion_pct: number;
}

interface Journey {
  first_source: string;
  last_source: string;
  conversions: number;
}

interface FirstTouch {
  source: string;
  first_touches: number;
}

interface CleanLead {
  customer: string;
  lead_id: string;
  date: string;
  source: string;
  source_type: string;
  sales_rep: string;
  status: string;
  vehicle: string;
  total_leads: number;
  source_count: number;
}

/* ─── helpers ─── */

function fmtDate(s: string) {
  if (!s) return "—";
  const d = new Date(s);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function fmtDateTime(s: string) {
  if (!s) return "—";
  const d = new Date(s);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function pct(n: number) {
  return `${n.toFixed(1)}%`;
}

function num(n: number) {
  return n.toLocaleString();
}

const DUPE_COLORS: Record<string, string> = {
  unique: "bg-green-900/30 border-green-700",
  same_source_spam: "bg-red-900/30 border-red-700",
  multi_channel: "bg-blue-900/30 border-blue-700",
  re_engagement: "bg-yellow-900/30 border-yellow-700",
};

const DUPE_LABELS: Record<string, string> = {
  unique: "First touch",
  same_source_spam: "Same-source spam",
  multi_channel: "Multi-channel",
  re_engagement: "Re-engagement",
};

const DUPE_DOTS: Record<string, string> = {
  unique: "bg-green-400",
  same_source_spam: "bg-red-400",
  multi_channel: "bg-blue-400",
  re_engagement: "bg-yellow-400",
};

/* ─── date presets ─── */

function getPresetDates(preset: string): { start: string; end: string } {
  const now = new Date();
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  switch (preset) {
    case "7d": {
      const s = new Date(now);
      s.setDate(s.getDate() - 7);
      return { start: fmt(s), end: fmt(now) };
    }
    case "30d": {
      const s = new Date(now);
      s.setDate(s.getDate() - 30);
      return { start: fmt(s), end: fmt(now) };
    }
    case "90d": {
      const s = new Date(now);
      s.setDate(s.getDate() - 90);
      return { start: fmt(s), end: fmt(now) };
    }
    case "ytd": {
      return { start: `${now.getFullYear()}-01-01`, end: fmt(now) };
    }
    case "2025": return { start: "2025-01-01", end: "2025-12-31" };
    case "2024": return { start: "2024-01-01", end: "2024-12-31" };
    case "2023": return { start: "2023-01-01", end: "2023-12-31" };
    case "2022": return { start: "2022-01-01", end: "2022-12-31" };
    case "2021": return { start: "2021-01-01", end: "2021-12-31" };
    case "2020": return { start: "2020-01-01", end: "2020-12-31" };
    case "all":
    default:
      return { start: "", end: "" };
  }
}

/* ─── components ─── */

function StatCard({
  label,
  value,
  sub,
  color = "stewart-card",
}: {
  label: string;
  value: string;
  sub?: string;
  color?: string;
}) {
  return (
    <div className={`${color} rounded-lg p-4 border border-stewart-border`}>
      <div className="text-sm text-stewart-muted">{label}</div>
      <div className="text-2xl font-bold text-stewart-text mt-1">{value}</div>
      {sub && <div className="text-xs text-stewart-muted mt-1">{sub}</div>}
    </div>
  );
}

function Legend() {
  return (
    <div className="flex gap-4 text-xs text-stewart-muted flex-wrap">
      {Object.entries(DUPE_LABELS).map(([key, label]) => (
        <span key={key} className="flex items-center gap-1">
          <span className={`w-2 h-2 rounded-full ${DUPE_DOTS[key]}`} />
          {label}
        </span>
      ))}
    </div>
  );
}

/* ─── main page ─── */

type Tab = "summary" | "sources" | "journeys" | "clean";

export default function LeadDedupPage() {
  const { tenantId } = useTenant();
  const [tab, setTab] = useState<Tab>("summary");
  const [preset, setPreset] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [windowDays, setWindowDays] = useState(7);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Data
  const [summary, setSummary] = useState<Summary | null>(null);
  const [spamSources, setSpamSources] = useState<SpamSource[]>([]);
  const [customers, setCustomers] = useState<CustomerCluster[]>([]);
  const [sourceROI, setSourceROI] = useState<SourceROI[]>([]);
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [firstTouches, setFirstTouches] = useState<FirstTouch[]>([]);
  const [cleanLeads, setCleanLeads] = useState<CleanLead[]>([]);
  const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null);
  const [roiSort, setRoiSort] = useState<"total" | "conversion" | "noise">("total");

  const load = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    setError("");
    try {
      if (tab === "summary") {
        const s = await api.getDedupSummary(tenantId, startDate || undefined, endDate || undefined) as unknown as Summary;
        setSummary(s);
        const spam = await api.getDedupSpamSources(tenantId, windowDays, startDate || undefined, endDate || undefined);
        setSpamSources(spam.sources);
      } else if (tab === "sources") {
        const roi = await api.getDedupSourceROI(tenantId, startDate || undefined, endDate || undefined) as {
          sources: SourceROI[];
          journeys: Journey[];
          first_touch_attribution: FirstTouch[];
        };
        setSourceROI(roi.sources);
        setJourneys(roi.journeys);
        setFirstTouches(roi.first_touch_attribution);
      } else if (tab === "journeys") {
        const c = await api.getDedupCustomers(tenantId, windowDays, 30, startDate || undefined, endDate || undefined) as {
          customers: CustomerCluster[];
        };
        setCustomers(c.customers);
      } else if (tab === "clean") {
        const cl = await api.getDedupClean(tenantId, 200, startDate || undefined, endDate || undefined) as {
          leads: CleanLead[];
        };
        setCleanLeads(cl.leads);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [tenantId, tab, startDate, endDate, windowDays]);

  useEffect(() => {
    load();
  }, [load]);

  // Handle preset changes
  useEffect(() => {
    if (preset !== "custom") {
      const { start, end } = getPresetDates(preset);
      setStartDate(start);
      setEndDate(end);
    }
  }, [preset]);

  const tabs: { key: Tab; label: string }[] = [
    { key: "summary", label: "Overview" },
    { key: "sources", label: "Source ROI" },
    { key: "journeys", label: "Customer Journeys" },
    { key: "clean", label: "Clean View" },
  ];

  const presets = [
    { key: "7d", label: "7 days" },
    { key: "30d", label: "30 days" },
    { key: "90d", label: "90 days" },
    { key: "ytd", label: "YTD" },
    { key: "2025", label: "2025" },
    { key: "2024", label: "2024" },
    { key: "2023", label: "2023" },
    { key: "2022", label: "2022" },
    { key: "2021", label: "2021" },
    { key: "2020", label: "2020" },
    { key: "all", label: "All time" },
  ];

  const sortedROI = [...sourceROI].sort((a, b) => {
    if (roiSort === "conversion") return b.conversion_pct - a.conversion_pct;
    if (roiSort === "noise") return b.noise_pct - a.noise_pct;
    return b.total_leads - a.total_leads;
  });

  return (
    <div className="p-6 space-y-6 max-w-[1400px]">
      <div>
        <h1 className="text-2xl font-bold text-stewart-text">
          Lead Deduplication
        </h1>
        <p className="text-sm text-stewart-muted mt-1">
          Find spam, track customer journeys, and measure lead source ROI
        </p>
      </div>

      {/* ─── Date filters ─── */}
      <div className="flex flex-wrap gap-2 items-center">
        {presets.map((p) => (
          <button
            key={p.key}
            onClick={() => setPreset(p.key)}
            className={`px-3 py-1 rounded text-sm border ${
              preset === p.key
                ? "bg-stewart-accent text-white border-stewart-accent"
                : "bg-stewart-card text-stewart-muted border-stewart-border hover:border-stewart-accent"
            }`}
          >
            {p.label}
          </button>
        ))}
        <span className="text-stewart-muted text-xs ml-2">|</span>
        <input
          type="date"
          value={startDate}
          onChange={(e) => {
            setStartDate(e.target.value);
            setPreset("custom");
          }}
          className="bg-stewart-card border border-stewart-border text-stewart-text text-sm rounded px-2 py-1"
        />
        <span className="text-stewart-muted text-sm">to</span>
        <input
          type="date"
          value={endDate}
          onChange={(e) => {
            setEndDate(e.target.value);
            setPreset("custom");
          }}
          className="bg-stewart-card border border-stewart-border text-stewart-text text-sm rounded px-2 py-1"
        />
      </div>

      {/* ─── Tabs ─── */}
      <div className="flex gap-1 border-b border-stewart-border">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              tab === t.key
                ? "border-stewart-accent text-stewart-accent"
                : "border-transparent text-stewart-muted hover:text-stewart-text"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="text-stewart-muted text-sm">Loading...</div>
      )}
      {error && <div className="text-red-400 text-sm">{error}</div>}

      {/* ─── SUMMARY TAB ─── */}
      {!loading && tab === "summary" && summary && (
        <div className="space-y-6">
          {/* Top-level cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Total Leads"
              value={num(summary.total_leads)}
              sub="Raw VinSolutions entries"
            />
            <StatCard
              label="Unique Customers"
              value={num(summary.unique_customers)}
              sub={`${pct(
                (summary.unique_customers / summary.total_leads) * 100
              )} of total`}
            />
            <StatCard
              label="Excess Leads"
              value={num(
                summary.total_leads - summary.unique_customers
              )}
              sub="Same person, multiple entries"
            />
            <StatCard
              label="Dedup Ratio"
              value={`${(
                summary.total_leads / summary.unique_customers
              ).toFixed(1)}x`}
              sub="Avg leads per customer"
            />
          </div>

          {/* 7d vs 30d comparison */}
          <div>
            <h2 className="text-lg font-semibold text-stewart-text mb-3">
              Cluster Windows: 7-Day vs 30-Day
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(["7d", "30d"] as const).map((w) => {
                const s = summary.windows[w];
                return (
                  <div
                    key={w}
                    className="bg-stewart-card border border-stewart-border rounded-lg p-4 space-y-3"
                  >
                    <div className="text-sm font-semibold text-stewart-text">
                      {s.window_days}-Day Window
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-stewart-muted flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-red-400" />
                          Same-source spam
                        </span>
                        <span className="text-red-400 font-medium">
                          {num(s.same_source_spam)} ({pct(s.spam_pct)})
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stewart-muted flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-blue-400" />
                          Multi-channel journeys
                        </span>
                        <span className="text-blue-400 font-medium">
                          {num(s.multi_channel)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stewart-muted flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-green-400" />
                          Clean (unique)
                        </span>
                        <span className="text-green-400 font-medium">
                          {num(s.clean_leads)}
                        </span>
                      </div>
                      {/* Bar visualization */}
                      <div className="flex h-4 rounded overflow-hidden mt-2">
                        <div
                          className="bg-red-500"
                          style={{
                            width: `${s.spam_pct}%`,
                          }}
                          title={`Spam: ${pct(s.spam_pct)}`}
                        />
                        <div
                          className="bg-blue-500"
                          style={{
                            width: `${
                              (s.multi_channel / summary.total_leads) * 100
                            }%`,
                          }}
                          title="Multi-channel"
                        />
                        <div className="bg-green-600 flex-1" title="Clean" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Spam sources table */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-stewart-text">
                Top Spam Sources
              </h2>
              <div className="flex gap-2">
                {[7, 30].map((d) => (
                  <button
                    key={d}
                    onClick={() => setWindowDays(d)}
                    className={`px-3 py-1 rounded text-xs border ${
                      windowDays === d
                        ? "bg-stewart-accent text-white border-stewart-accent"
                        : "bg-stewart-card text-stewart-muted border-stewart-border"
                    }`}
                  >
                    {d}d window
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-stewart-card border border-stewart-border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stewart-border text-stewart-muted text-left">
                    <th className="px-4 py-2">Source</th>
                    <th className="px-4 py-2 text-right">Excess Leads</th>
                    <th className="px-4 py-2 text-right">Customers Hit</th>
                    <th className="px-4 py-2 text-right">Avg per Customer</th>
                  </tr>
                </thead>
                <tbody>
                  {spamSources.slice(0, 15).map((s) => (
                    <tr
                      key={s.source}
                      className="border-b border-stewart-border/50 hover:bg-stewart-border/20"
                    >
                      <td className="px-4 py-2 text-stewart-text">
                        {s.source}
                      </td>
                      <td className="px-4 py-2 text-right text-red-400 font-medium">
                        {num(s.excess_leads)}
                      </td>
                      <td className="px-4 py-2 text-right text-stewart-muted">
                        {num(s.affected_customers)}
                      </td>
                      <td className="px-4 py-2 text-right text-stewart-muted">
                        {(s.excess_leads / s.affected_customers).toFixed(1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── SOURCE ROI TAB ─── */}
      {!loading && tab === "sources" && (
        <div className="space-y-6">
          {/* Source performance table */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-stewart-text">
                Lead Source Performance
              </h2>
              <div className="flex gap-2">
                {(
                  [
                    ["total", "By Volume"],
                    ["conversion", "By Conversion"],
                    ["noise", "By Noise"],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setRoiSort(key)}
                    className={`px-3 py-1 rounded text-xs border ${
                      roiSort === key
                        ? "bg-stewart-accent text-white border-stewart-accent"
                        : "bg-stewart-card text-stewart-muted border-stewart-border"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-stewart-card border border-stewart-border rounded-lg overflow-hidden overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stewart-border text-stewart-muted text-left">
                    <th className="px-3 py-2">Source</th>
                    <th className="px-3 py-2 text-right">Leads</th>
                    <th className="px-3 py-2 text-right">Customers</th>
                    <th className="px-3 py-2 text-right">Noise</th>
                    <th className="px-3 py-2 text-right">Sold</th>
                    <th className="px-3 py-2 text-right">Conv %</th>
                    <th className="px-3 py-2">Signal</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedROI.slice(0, 30).map((s) => {
                    const signal =
                      s.conversion_pct >= 10
                        ? "text-green-400"
                        : s.conversion_pct >= 3
                        ? "text-yellow-400"
                        : "text-red-400";
                    const bar =
                      s.conversion_pct >= 10
                        ? "bg-green-500"
                        : s.conversion_pct >= 3
                        ? "bg-yellow-500"
                        : "bg-red-500";
                    return (
                      <tr
                        key={s.source}
                        className="border-b border-stewart-border/50 hover:bg-stewart-border/20"
                      >
                        <td className="px-3 py-2 text-stewart-text max-w-[250px] truncate">
                          {s.source}
                        </td>
                        <td className="px-3 py-2 text-right text-stewart-muted">
                          {num(s.total_leads)}
                        </td>
                        <td className="px-3 py-2 text-right text-stewart-text font-medium">
                          {num(s.unique_customers)}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <span
                            className={
                              s.noise_pct > 50
                                ? "text-red-400"
                                : "text-stewart-muted"
                            }
                          >
                            {pct(s.noise_pct)}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right text-green-400 font-medium">
                          {s.unique_sold > 0 ? num(s.unique_sold) : "—"}
                        </td>
                        <td className={`px-3 py-2 text-right font-bold ${signal}`}>
                          {pct(s.conversion_pct)}
                        </td>
                        <td className="px-3 py-2">
                          <div className="w-20 h-2 bg-stewart-border rounded overflow-hidden">
                            <div
                              className={`h-full ${bar}`}
                              style={{
                                width: `${Math.min(s.conversion_pct * 3, 100)}%`,
                              }}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* First touch vs last touch */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-lg font-semibold text-stewart-text mb-3">
                First Touch Attribution
              </h2>
              <p className="text-xs text-stewart-muted mb-2">
                Where do customers first enter the funnel?
              </p>
              <div className="bg-stewart-card border border-stewart-border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-stewart-border text-stewart-muted text-left">
                      <th className="px-3 py-2">Source</th>
                      <th className="px-3 py-2 text-right">Starts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {firstTouches.slice(0, 15).map((f) => (
                      <tr
                        key={f.source}
                        className="border-b border-stewart-border/50"
                      >
                        <td className="px-3 py-2 text-stewart-text">
                          {f.source}
                        </td>
                        <td className="px-3 py-2 text-right text-stewart-accent font-medium">
                          {num(f.first_touches)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-stewart-text mb-3">
                Conversion Journeys
              </h2>
              <p className="text-xs text-stewart-muted mb-2">
                First touch to last touch for customers who bought
              </p>
              <div className="bg-stewart-card border border-stewart-border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-stewart-border text-stewart-muted text-left">
                      <th className="px-3 py-2">First</th>
                      <th className="px-3 py-2 text-center">-></th>
                      <th className="px-3 py-2">Last</th>
                      <th className="px-3 py-2 text-right">Sold</th>
                    </tr>
                  </thead>
                  <tbody>
                    {journeys.slice(0, 15).map((j, i) => (
                      <tr
                        key={i}
                        className="border-b border-stewart-border/50"
                      >
                        <td className="px-3 py-2 text-stewart-text text-xs max-w-[150px] truncate">
                          {j.first_source}
                        </td>
                        <td className="px-3 py-2 text-center text-stewart-muted">
                          {j.first_source === j.last_source ? "=" : "->"}
                        </td>
                        <td className="px-3 py-2 text-stewart-text text-xs max-w-[150px] truncate">
                          {j.last_source}
                        </td>
                        <td className="px-3 py-2 text-right text-green-400 font-medium">
                          {num(j.conversions)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── CUSTOMER JOURNEYS TAB ─── */}
      {!loading && tab === "journeys" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-stewart-text">
                Customer Lead Timelines
              </h2>
              <p className="text-xs text-stewart-muted">
                Click a customer to see their full journey. Color = duplicate type.
              </p>
            </div>
            <div className="flex gap-2">
              {[7, 30].map((d) => (
                <button
                  key={d}
                  onClick={() => setWindowDays(d)}
                  className={`px-3 py-1 rounded text-xs border ${
                    windowDays === d
                      ? "bg-stewart-accent text-white border-stewart-accent"
                      : "bg-stewart-card text-stewart-muted border-stewart-border"
                  }`}
                >
                  {d}d window
                </button>
              ))}
            </div>
          </div>
          <Legend />
          {customers.map((c) => (
            <div
              key={c.customer}
              className="bg-stewart-card border border-stewart-border rounded-lg overflow-hidden"
            >
              <button
                onClick={() =>
                  setExpandedCustomer(
                    expandedCustomer === c.customer ? null : c.customer
                  )
                }
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-stewart-border/20 text-left"
              >
                <div>
                  <span className="text-stewart-text font-medium">
                    {c.customer}
                  </span>
                  <span className="text-stewart-muted text-sm ml-3">
                    {c.lead_count} leads from {c.source_count} sources
                  </span>
                </div>
                <div className="text-xs text-stewart-muted">
                  {fmtDate(c.first_lead)} — {fmtDate(c.last_lead)}
                </div>
              </button>
              {expandedCustomer === c.customer && (
                <div className="px-4 pb-4 space-y-1">
                  {c.timeline.map((t) => (
                    <div
                      key={t.lead_id}
                      className={`flex items-center gap-3 px-3 py-2 rounded border text-sm ${
                        DUPE_COLORS[t.dupe_type]
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          DUPE_DOTS[t.dupe_type]
                        }`}
                      />
                      <span className="text-stewart-muted w-32 flex-shrink-0">
                        {fmtDateTime(t.date)}
                      </span>
                      <span className="text-stewart-text flex-1 truncate">
                        {t.source}
                      </span>
                      <span className="text-stewart-muted text-xs w-24 text-right flex-shrink-0">
                        {t.sales_rep}
                      </span>
                      {t.vehicle && (
                        <span className="text-stewart-muted text-xs w-36 text-right flex-shrink-0">
                          {t.vehicle}
                        </span>
                      )}
                      <span className="text-xs w-16 text-right flex-shrink-0">
                        <span
                          className={`px-1 rounded ${
                            t.dupe_type === "same_source_spam"
                              ? "bg-red-900/50 text-red-300"
                              : t.dupe_type === "multi_channel"
                              ? "bg-blue-900/50 text-blue-300"
                              : t.dupe_type === "re_engagement"
                              ? "bg-yellow-900/50 text-yellow-300"
                              : "bg-green-900/50 text-green-300"
                          }`}
                        >
                          {DUPE_LABELS[t.dupe_type]}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ─── CLEAN VIEW TAB ─── */}
      {!loading && tab === "clean" && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-stewart-text">
              Deduplicated Leads
            </h2>
            <p className="text-xs text-stewart-muted">
              One row per customer — most recent lead wins. Shows how many raw
              leads and sources each customer has.
            </p>
          </div>
          <div className="bg-stewart-card border border-stewart-border rounded-lg overflow-hidden overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stewart-border text-stewart-muted text-left">
                  <th className="px-3 py-2">Customer</th>
                  <th className="px-3 py-2">Last Lead</th>
                  <th className="px-3 py-2">Source</th>
                  <th className="px-3 py-2">Rep</th>
                  <th className="px-3 py-2">Vehicle</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2 text-right">Raw Leads</th>
                  <th className="px-3 py-2 text-right">Sources</th>
                </tr>
              </thead>
              <tbody>
                {cleanLeads.map((l) => (
                  <tr
                    key={l.lead_id}
                    className="border-b border-stewart-border/50 hover:bg-stewart-border/20"
                  >
                    <td className="px-3 py-2 text-stewart-text font-medium">
                      {l.customer}
                    </td>
                    <td className="px-3 py-2 text-stewart-muted">
                      {fmtDate(l.date)}
                    </td>
                    <td className="px-3 py-2 text-stewart-text text-xs max-w-[200px] truncate">
                      {l.source}
                    </td>
                    <td className="px-3 py-2 text-stewart-muted text-xs">
                      {l.sales_rep}
                    </td>
                    <td className="px-3 py-2 text-stewart-muted text-xs">
                      {l.vehicle || "—"}
                    </td>
                    <td className="px-3 py-2 text-xs">
                      <span
                        className={
                          l.status?.includes("Sold")
                            ? "text-green-400"
                            : "text-stewart-muted"
                        }
                      >
                        {l.status || "—"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <span
                        className={
                          l.total_leads > 5
                            ? "text-red-400 font-medium"
                            : l.total_leads > 1
                            ? "text-yellow-400"
                            : "text-stewart-muted"
                        }
                      >
                        {l.total_leads}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right text-stewart-muted">
                      {l.source_count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
