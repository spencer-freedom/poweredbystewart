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

interface TimeGapBucket {
  key: string;
  label: string;
  gap_count: number;
  affected_customers: number;
  same_source_count: number;
  multi_channel_count: number;
  pct_of_gaps: number;
}

interface LeadsPerCustomerBucket {
  key: string;
  label: string;
  min: number;
  max: number | null;
  customer_count: number;
  sold_count: number;
  pct_of_customers: number;
  sold_pct: number;
}

interface TimeGapResponse {
  total_leads: number;
  unique_customers: number;
  customers_with_repeats: number;
  total_gaps: number;
  histogram: TimeGapBucket[];
  leads_per_customer: LeadsPerCustomerBucket[];
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
    case "2026": return { start: "2026-01-01", end: "2026-12-31" };
    case "2025": return { start: "2025-01-01", end: "2025-12-31" };
    case "2024": return { start: "2024-01-01", end: "2024-12-31" };
    case "2023": return { start: "2023-01-01", end: "2023-12-31" };
    case "2022": return { start: "2022-01-01", end: "2022-12-31" };
    case "2021": return { start: "2021-01-01", end: "2021-12-31" };
    case "2020": return { start: "2020-01-01", end: "2020-12-31" };
    case "2019": return { start: "2019-01-01", end: "2019-12-31" };
    case "2018": return { start: "2018-01-01", end: "2018-12-31" };
    case "2017": return { start: "2017-01-01", end: "2017-12-31" };
    case "2016": return { start: "2016-01-01", end: "2016-12-31" };
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

/* ─── Response Time view ─── */

function fmtMinutes(m: number | null): string {
  if (m === null) return "—";
  if (m < 1) return `${Math.round(m * 60)}s`;
  if (m < 60) return `${Math.round(m)} min`;
  if (m < 1440) return `${(m / 60).toFixed(1)} hr`;
  return `${(m / 1440).toFixed(1)} days`;
}

function ResponseTimeView({ data, phoneJourney }: { data: ResponseTimeData; phoneJourney: PhoneJourney | null }) {
  const maxLeadCount = Math.max(...data.distribution.map((b) => b.lead_count));
  const maxSoldPct = Math.max(...data.distribution.map((b) => b.sold_pct), 1);

  // Fast (<15 min) vs. slow (>1hr) conversion — headline framing
  const fast = data.distribution.filter((b) => b.key === "lt_5" || b.key === "5_15");
  const slow = data.distribution.filter((b) => b.key === "4_24h" || b.key === "24h_plus");
  const fastLeads = fast.reduce((s, b) => s + b.lead_count, 0);
  const fastSold = fast.reduce((s, b) => s + b.sold_count, 0);
  const slowLeads = slow.reduce((s, b) => s + b.lead_count, 0);
  const slowSold = slow.reduce((s, b) => s + b.sold_count, 0);
  const fastPct = fastLeads > 0 ? (fastSold / fastLeads) * 100 : 0;
  const slowPct = slowLeads > 0 ? (slowSold / slowLeads) * 100 : 0;
  const speedLift = slowPct > 0 ? fastPct / slowPct : 0;

  const bh = data.business_hours;
  const bhVsOverall = bh.median_response_min > 0 && data.median_response_min > 0
    ? ((data.median_response_min - bh.median_response_min) / data.median_response_min) * 100
    : 0;

  // Pinned key findings — compute lift for called-back segment if available
  const cb = phoneJourney?.segments.called_back;
  const io = phoneJourney?.segments.internet_only;
  const calledBackLift = cb && io && io.sold_pct > 0 ? cb.sold_pct / io.sold_pct : 0;

  return (
    <div className="space-y-6">
      {/* ── Pinned: Hottest Signals ── */}
      <div className="stewart-card p-4 border-l-4 border-green-600/70 bg-green-900/5">
        <div className="text-sm font-semibold text-green-400 uppercase tracking-wide mb-2">
          Key findings — don&apos;t lose these
        </div>
        <ul className="space-y-2 text-sm text-stewart-text">
          {cb && calledBackLift > 1.2 && (
            <li>
              <span className="text-green-400">▲</span>{" "}
              <strong>Internet lead → called in themselves</strong> closes at{" "}
              <span className="font-mono font-bold text-green-400">{pct(cb.sold_pct)}</span> —{" "}
              <span className="font-bold">{calledBackLift.toFixed(1)}×</span> the rate of internet-only leads ({pct(io!.sold_pct)}).{" "}
              These are the hottest leads in the pipeline and you only see them because they got impatient.{" "}
              <span className="text-stewart-muted">({num(cb.customer_count)} customers in range)</span>
            </li>
          )}
          <li>
            <span className="text-red-400">▼</span>{" "}
            <strong>Median digital response time: </strong>
            <span className="font-mono font-bold text-red-400">{fmtMinutes(data.median_response_min)}</span>{" "}
            overall,{" "}
            <span className="font-mono font-bold">{fmtMinutes(bh.median_response_min)}</span>{" "}
            during business hours (Mon–Sat 8am–8pm).{" "}
            {bhVsOverall > 25
              ? <span className="text-stewart-muted">The overall number is inflated by nights/Sundays, but business-hours response is still the actionable metric — and it&apos;s still too slow.</span>
              : <span className="text-stewart-muted">Even in prime hours we&apos;re too slow. This isn&apos;t a staffing problem.</span>
            }
          </li>
          <li>
            <span className="text-red-400">▼</span>{" "}
            <strong>Never contacted:</strong>{" "}
            <span className="font-mono font-bold text-red-400">{pct(data.never_contacted_pct)}</span>{" "}
            of digital leads ({num(data.never_contacted_leads)} total){" "}
            get no reply. Their close rate is{" "}
            <span className="font-mono font-bold">{pct(data.never_contacted_sold_pct)}</span>.
          </li>
        </ul>
      </div>

      {/* Headline */}
      <div className="stewart-card p-5 border-l-4 border-stewart-accent">
        <div className="text-sm font-semibold text-stewart-accent uppercase tracking-wide mb-2">
          Speed-to-contact = money (digital leads only)
        </div>
        <div className="text-lg text-stewart-text leading-relaxed">
          Digital leads contacted in <strong>under 15 minutes</strong> close at{" "}
          <span className="text-stewart-accent font-bold">{pct(fastPct)}</span>.
          Waited <strong>over 4 hours</strong>: <span className="text-red-400 font-bold">{pct(slowPct)}</span>.
          {speedLift > 1 && (
            <>
              {" "}That&apos;s{" "}
              <span className="text-stewart-accent font-bold">{speedLift.toFixed(1)}×</span>{" "}
              the conversion rate just for picking up the phone faster.
            </>
          )}
          <br />
          <span className="text-red-400 font-bold">
            {pct(data.never_contacted_pct)}
          </span>{" "}
          of digital leads were never contacted at all.
          They close at{" "}
          <span className="text-red-400 font-bold">{pct(data.never_contacted_sold_pct)}</span>{" "}
          vs.{" "}
          <span className="text-stewart-accent font-bold">{pct(data.contacted_sold_pct)}</span>{" "}
          when a rep reaches them.
        </div>
      </div>

      {/* Phone Up standalone */}
      <div className="stewart-card p-4 border-l-4 border-yellow-600/60">
        <div className="flex items-baseline justify-between mb-1">
          <h3 className="text-base font-semibold text-stewart-text">
            Phone Up (standalone)
          </h3>
          <span className="text-xs text-stewart-muted">
            Separated from digital metrics — Fresh Up/Walk-In excluded as unreliable
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
          <StatCard
            label="Phone Up Leads"
            value={num(data.phone_up.leads)}
            sub={`${num(data.phone_up.unique_customers)} unique customers`}
          />
          <StatCard
            label="Close Rate"
            value={pct(data.phone_up.sold_pct)}
            sub={`${num(data.phone_up.sold_customers)} sold`}
            color="bg-stewart-accent/10 border-stewart-accent"
          />
          <StatCard
            label="Digital Baseline"
            value={pct(data.contacted_sold_pct)}
            sub="Contacted digital leads"
          />
          <StatCard
            label="Phone Up Lift"
            value={data.contacted_sold_pct > 0 ? `${(data.phone_up.sold_pct / data.contacted_sold_pct).toFixed(1)}×` : "—"}
            sub="Phone Up vs. digital contacted"
          />
        </div>
      </div>

      {/* Summary cards — overall */}
      <div>
        <div className="text-xs text-stewart-muted uppercase tracking-wide mb-2">All digital leads</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Median Response"
            value={fmtMinutes(data.median_response_min)}
            sub={`Avg: ${fmtMinutes(data.avg_response_min)}`}
          />
          <StatCard
            label="Never Contacted"
            value={pct(data.never_contacted_pct)}
            sub={`${num(data.never_contacted_leads)} leads`}
          />
          <StatCard
            label="Contacted Close Rate"
            value={pct(data.contacted_sold_pct)}
            sub={`${num(data.contacted_leads)} contacted leads`}
            color="bg-stewart-accent/10 border-stewart-accent"
          />
          <StatCard
            label="Speed Lift"
            value={speedLift > 0 ? `${speedLift.toFixed(1)}×` : "—"}
            sub="<15 min vs. >4 hr conversion"
          />
        </div>
      </div>

      {/* Summary cards — business hours only */}
      <div>
        <div className="text-xs text-stewart-muted uppercase tracking-wide mb-2">
          Business hours only (Mon–Sat 8am–8pm) — {num(bh.total_leads)} of {num(data.total_leads)} leads
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Median Response (BH)"
            value={fmtMinutes(bh.median_response_min)}
            sub={bhVsOverall > 0 ? `${bhVsOverall.toFixed(0)}% faster than overall` : `Avg: ${fmtMinutes(bh.avg_response_min)}`}
            color="bg-green-900/10 border-green-700/40"
          />
          <StatCard
            label="Never Contacted (BH)"
            value={pct(bh.never_contacted_pct)}
            sub={`${num(bh.never_contacted_leads)} leads`}
          />
          <StatCard
            label="Contacted Close (BH)"
            value={pct(bh.contacted_sold_pct)}
            sub={`${num(bh.contacted_leads)} contacted`}
          />
          <StatCard
            label="Time Saved vs. Overall"
            value={bhVsOverall > 0 ? `${fmtMinutes(data.median_response_min - bh.median_response_min)}` : "—"}
            sub="Gap blamed on off-hours leads"
          />
        </div>
      </div>

      {/* ── OPTION 1: Bubble scatter ── */}
      <div className="stewart-card p-4 space-y-3">
        <div>
          <h3 className="text-base font-semibold text-stewart-text">
            Response time × deals closed × close rate
          </h3>
          <p className="text-xs text-stewart-muted mt-1">
            Each bubble is a response-time bucket.{" "}
            <strong>Horizontal position</strong> = how fast reps answered.{" "}
            <strong>Vertical position</strong> = close rate.{" "}
            <strong>Bubble size</strong> = number of deals closed in that bucket.
            The sweet spot is the highest bubble that&apos;s also reasonably big.
          </p>
        </div>

        {(() => {
          const n = data.distribution.length;
          const W = 680, H = 300, PAD_L = 60, PAD_R = 20, PAD_T = 24, PAD_B = 56;
          const plotW = W - PAD_L - PAD_R;
          const plotH = H - PAD_T - PAD_B;
          const maxPct = Math.max(...data.distribution.map((b) => b.sold_pct)) * 1.15 || 1;
          const maxSold = Math.max(...data.distribution.map((b) => b.sold_count)) || 1;
          const baselineY = PAD_T + plotH * (1 - data.contacted_sold_pct / maxPct);

          return (
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
              {/* Y-axis gridlines */}
              {[0, 0.25, 0.5, 0.75, 1].map((t) => (
                <g key={t}>
                  <line
                    x1={PAD_L}
                    y1={PAD_T + plotH * (1 - t)}
                    x2={W - PAD_R}
                    y2={PAD_T + plotH * (1 - t)}
                    stroke="#374151"
                    strokeDasharray="2,4"
                    strokeWidth={0.5}
                  />
                  <text
                    x={PAD_L - 6}
                    y={PAD_T + plotH * (1 - t) + 4}
                    textAnchor="end"
                    fill="#9ca3af"
                    fontSize={10}
                    fontFamily="ui-monospace, monospace"
                  >
                    {(maxPct * t).toFixed(1)}%
                  </text>
                </g>
              ))}

              {/* Baseline line */}
              <line
                x1={PAD_L}
                y1={baselineY}
                x2={W - PAD_R}
                y2={baselineY}
                stroke="#3b82f6"
                strokeDasharray="4,4"
                strokeWidth={1.5}
              />
              <text x={W - PAD_R - 4} y={baselineY - 4} textAnchor="end" fill="#3b82f6" fontSize={10}>
                Baseline {pct(data.contacted_sold_pct)}
              </text>

              {/* Bubbles */}
              {data.distribution.map((b, i) => {
                const cx = PAD_L + plotW * ((i + 0.5) / n);
                const cy = PAD_T + plotH * (1 - b.sold_pct / maxPct);
                const r = 6 + Math.sqrt(b.sold_count / maxSold) * 28;
                const lift = b.sold_pct - data.contacted_sold_pct;
                const color = lift > 1 ? "#22c55e" : lift < -1 ? "#ef4444" : "#60a5fa";
                return (
                  <g key={b.key}>
                    <circle cx={cx} cy={cy} r={r} fill={color} fillOpacity={0.35} stroke={color} strokeWidth={2} />
                    <text x={cx} y={cy + 4} textAnchor="middle" fill="white" fontSize={12} fontWeight="bold">
                      {b.sold_count}
                    </text>
                    <text
                      x={cx}
                      y={H - PAD_B + 16}
                      textAnchor="middle"
                      fill="#e5e7eb"
                      fontSize={10}
                    >
                      {b.label}
                    </text>
                    <text
                      x={cx}
                      y={H - PAD_B + 30}
                      textAnchor="middle"
                      fill="#9ca3af"
                      fontSize={9}
                      fontFamily="ui-monospace, monospace"
                    >
                      {pct(b.sold_pct)}
                    </text>
                  </g>
                );
              })}

              {/* Axis labels */}
              <text x={PAD_L + plotW / 2} y={H - 4} textAnchor="middle" fill="#9ca3af" fontSize={10}>
                Response time →
              </text>
              <text
                x={14}
                y={PAD_T + plotH / 2}
                textAnchor="middle"
                fill="#9ca3af"
                fontSize={10}
                transform={`rotate(-90, 14, ${PAD_T + plotH / 2})`}
              >
                Close rate %
              </text>
            </svg>
          );
        })()}

        <div className="pt-2 text-xs text-stewart-muted border-t border-stewart-border">
          Number inside each bubble = deals closed. Bigger bubble = more absolute sold. Higher bubble = better close rate per lead.
          The best bucket balances both — a tall bubble that&apos;s also reasonably sized.
        </div>
      </div>

      {/* ── OPTION 3: Dual bars — volume vs. deals closed ── */}
      <div className="stewart-card p-4 space-y-3">
        <div>
          <h3 className="text-base font-semibold text-stewart-text">
            Lead volume vs. deals closed
          </h3>
          <p className="text-xs text-stewart-muted mt-1">
            For each response-time bucket, the gray bar is how many leads
            we had there; the colored bar is how many of those actually
            closed. The gap between them is the waste. Where the deal bar
            is longest relative to the volume bar = best conversion.
          </p>
        </div>

        {(() => {
          const maxLeads = Math.max(...data.distribution.map((b) => b.lead_count)) || 1;
          const maxSold = Math.max(...data.distribution.map((b) => b.sold_count)) || 1;
          return (
            <div className="space-y-3">
              {data.distribution.map((b) => {
                const volWidth = (b.lead_count / maxLeads) * 100;
                const soldWidth = (b.sold_count / maxSold) * 100;
                const lift = b.sold_pct - data.contacted_sold_pct;
                const soldColor = lift > 1 ? "bg-green-500" : lift < -1 ? "bg-red-500" : "bg-stewart-accent";
                const textColor = lift > 1 ? "text-green-400" : lift < -1 ? "text-red-400" : "text-stewart-text";
                return (
                  <div key={b.key} className="space-y-1">
                    <div className="flex items-baseline justify-between text-xs">
                      <span className="text-stewart-text font-medium">{b.label}</span>
                      <span className="text-stewart-muted font-mono">
                        {num(b.lead_count)} leads → {num(b.sold_count)} sold ·{" "}
                        <span className={`font-bold ${textColor}`}>{pct(b.sold_pct)}</span>
                      </span>
                    </div>
                    <div className="relative">
                      <div className="h-4 bg-stewart-bg rounded overflow-hidden">
                        <div className="h-full bg-stewart-muted/40" style={{ width: `${volWidth}%` }} />
                      </div>
                    </div>
                    <div className="relative">
                      <div className="h-4 bg-stewart-bg rounded overflow-hidden">
                        <div className={`h-full ${soldColor}`} style={{ width: `${soldWidth}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}

        <div className="pt-2 text-xs text-stewart-muted border-t border-stewart-border flex items-center gap-4 flex-wrap">
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-stewart-muted/40" />
            Leads (volume)
          </span>
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-stewart-accent" />
            Deals closed
          </span>
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-green-500" />
            Above baseline
          </span>
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-red-500" />
            Below baseline
          </span>
        </div>
      </div>

      {/* Per-bucket sold % — absolute scale with baseline line */}
      <div className="stewart-card p-4 space-y-3">
        <div>
          <h3 className="text-base font-semibold text-stewart-text">
            Closing rate by response time
          </h3>
          <p className="text-xs text-stewart-muted mt-1">
            Sold % for each response-time bucket, on an absolute scale
            (0% to the chart max). The dotted line is the{" "}
            <span className="text-stewart-accent font-mono">{pct(data.contacted_sold_pct)}</span>{" "}
            contacted baseline — bars to the right of it are above average,
            to the left are below.
          </p>
        </div>

        {(() => {
          const chartMax = Math.ceil(Math.max(...data.distribution.map((b) => b.sold_pct), data.contacted_sold_pct) * 1.15);
          // Find the biggest drop between consecutive per-bucket rates — that's the cliff
          let biggestDrop = 0;
          let cliffIdx = -1;
          for (let i = 1; i < data.distribution.length; i++) {
            const drop = data.distribution[i - 1].sold_pct - data.distribution[i].sold_pct;
            if (drop > biggestDrop && data.distribution[i].lead_count >= 20) {
              biggestDrop = drop;
              cliffIdx = i;
            }
          }
          return (
            <>
              {cliffIdx >= 0 && biggestDrop > 1 && (
                <div className="bg-red-900/20 border border-red-700/40 rounded p-3 text-sm mb-2">
                  <span className="text-red-400 font-semibold">Cliff detected:</span>{" "}
                  <span className="text-stewart-text">
                    Close rate drops{" "}
                    <span className="font-mono font-bold">{biggestDrop.toFixed(1)} pts</span>{" "}
                    from <strong>{data.distribution[cliffIdx - 1].label}</strong>{" "}
                    ({pct(data.distribution[cliffIdx - 1].sold_pct)}) to <strong>{data.distribution[cliffIdx].label}</strong>{" "}
                    ({pct(data.distribution[cliffIdx].sold_pct)}).
                  </span>{" "}
                  <span className="text-stewart-muted">
                    That&apos;s the SLA target — past this window, performance falls off.
                  </span>
                </div>
              )}
              <div className="space-y-2">
                {data.distribution.map((b, i) => {
                  const widthPct = chartMax > 0 ? (b.sold_pct / chartMax) * 100 : 0;
                  const baselinePos = chartMax > 0 ? (data.contacted_sold_pct / chartMax) * 100 : 0;
                  const liftVsBase = b.sold_pct - data.contacted_sold_pct;
                  const color = liftVsBase > 1 ? "bg-green-500" : liftVsBase < -1 ? "bg-red-500" : "bg-stewart-accent";
                  const textColor = liftVsBase > 1 ? "text-green-400" : liftVsBase < -1 ? "text-red-400" : "text-stewart-text";
                  const isCliffBefore = i === cliffIdx - 1;
                  const isCliffAfter = i === cliffIdx;
                  return (
                    <div key={b.key} className="grid grid-cols-12 gap-2 items-center text-xs">
                      <div className={`col-span-3 font-medium ${isCliffBefore ? "text-green-400" : isCliffAfter ? "text-red-400" : "text-stewart-text"}`}>
                        {isCliffBefore && "▲ "}
                        {isCliffAfter && "▼ "}
                        {b.label}
                      </div>
                      <div className="col-span-6 relative">
                        <div className="h-6 bg-stewart-bg rounded overflow-hidden relative">
                          <div className={`h-full ${color}`} style={{ width: `${widthPct}%` }} />
                        </div>
                        <div
                          className="absolute top-0 bottom-0 border-l-2 border-dotted border-stewart-muted pointer-events-none"
                          style={{ left: `${baselinePos}%` }}
                          title={`Baseline ${pct(data.contacted_sold_pct)}`}
                        />
                      </div>
                      <div className="col-span-1 text-right font-mono text-stewart-muted">{num(b.lead_count)}</div>
                      <div className={`col-span-2 text-right font-mono font-bold ${textColor}`}>{pct(b.sold_pct)}</div>
                    </div>
                  );
                })}
              </div>
            </>
          );
        })()}

        <div className="pt-3 text-xs text-stewart-muted border-t border-stewart-border">
          <span className="text-stewart-text font-semibold">Watch for small samples.</span>{" "}
          Buckets with few leads produce noisy close rates. The cumulative
          chart below is usually the more honest read.
        </div>
      </div>

      {/* Cumulative: "Answered within X → close rate" — the honest chart */}
      <div className="stewart-card p-4 space-y-3">
        <div>
          <h3 className="text-base font-semibold text-stewart-text">
            If reps answer within X, closing rate is Y
          </h3>
          <p className="text-xs text-stewart-muted mt-1">
            Cumulative view — rolls up every lead answered by each cutoff.
            This is the honest speed-to-contact curve, because each row
            shares a larger sample with the rows below it. If the top rows
            (fast response) close higher than the bottom rows, speed matters.
          </p>
        </div>

        {(() => {
          // First compute all rows, then identify peak
          let cumLeads = 0;
          let cumSold = 0;
          const rows = data.distribution.map((b) => {
            cumLeads += b.lead_count;
            cumSold += b.sold_count;
            const cumPct = cumLeads > 0 ? (cumSold / cumLeads) * 100 : 0;
            return { ...b, cumLeads, cumSold, cumPct };
          });
          const peakPct = Math.max(...rows.map((r) => r.cumPct));
          const peakIdx = rows.findIndex((r) => r.cumPct === peakPct);
          const peakRow = rows[peakIdx];

          return (
            <>
              <div className="bg-green-900/20 border border-green-700/40 rounded p-3 text-sm">
                <span className="text-green-400 font-semibold">Peak conversion:</span>{" "}
                <span className="text-stewart-text">
                  Leads answered within{" "}
                  <span className="font-bold">{peakRow.label.toLowerCase()}</span> close at{" "}
                  <span className="font-mono font-bold">{pct(peakRow.cumPct)}</span>.
                </span>{" "}
                <span className="text-stewart-muted">
                  ({num(peakRow.cumLeads)} leads, {num(peakRow.cumSold)} sold.) After this point, every additional slower-response lead drags the closing rate down.
                </span>
              </div>

              <table className="w-full text-xs mt-3">
                <thead className="text-stewart-muted border-b border-stewart-border">
                  <tr>
                    <th className="text-left py-2">Cutoff</th>
                    <th className="text-right py-2">Leads answered by cutoff</th>
                    <th className="text-right py-2">Sold</th>
                    <th className="text-right py-2">Sold %</th>
                    <th className="text-right py-2">Drop from peak</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => {
                    const isPeak = i === peakIdx;
                    const dropFromPeak = r.cumPct - peakPct;
                    const afterPeak = i > peakIdx;
                    return (
                      <tr key={r.key} className={`border-b border-stewart-border/50 ${isPeak ? "bg-green-900/20" : ""}`}>
                        <td className="py-2 text-stewart-text font-medium">
                          {isPeak && <span className="text-green-400 mr-1">▶</span>}
                          Answered within {r.label.toLowerCase()}
                        </td>
                        <td className="py-2 text-right font-mono">{num(r.cumLeads)}</td>
                        <td className="py-2 text-right font-mono text-stewart-muted">{num(r.cumSold)}</td>
                        <td className={`py-2 text-right font-mono font-bold ${isPeak ? "text-green-400" : "text-stewart-text"}`}>
                          {pct(r.cumPct)}
                        </td>
                        <td className={`py-2 text-right font-mono ${afterPeak ? "text-red-400" : "text-stewart-muted"}`}>
                          {isPeak ? "—" : `${dropFromPeak.toFixed(1)} pts`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </>
          );
        })()}

        <div className="pt-3 text-xs text-stewart-muted border-t border-stewart-border">
          Each row is the running total of every lead answered by that point.
          If &ldquo;answered within 15 min&rdquo; closes at a higher rate
          than &ldquo;answered within 24 hours,&rdquo; faster is genuinely
          better. If the rates look flat, the effect is weaker than the
          conventional wisdom suggests in your data.
        </div>
      </div>

      {/* ── Phone Up Journey — did slow response drive the call-in? ── */}
      {phoneJourney && (() => {
        const cb = phoneJourney.segments.called_back;
        const io = phoneJourney.segments.internet_only;
        const po = phoneJourney.segments.phone_only;
        const calledBackLift = io.sold_pct > 0 ? cb.sold_pct / io.sold_pct : 0;
        return (
          <div className="stewart-card p-4 space-y-4 border-l-4 border-yellow-600/60">
            <div>
              <h3 className="text-base font-semibold text-stewart-text">
                Did slow response drive the phone up?
              </h3>
              <p className="text-xs text-stewart-muted mt-1">
                Customers who submitted an internet lead <em>and</em> later
                phoned in themselves. If they called back because we were too
                slow, that&apos;s the most fixable revenue leak here.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-stewart-bg rounded p-3">
                <div className="text-xs text-stewart-muted">Internet lead, never called in</div>
                <div className="text-2xl font-bold text-stewart-text">{pct(io.sold_pct)}</div>
                <div className="text-xs text-stewart-muted">{num(io.customer_count)} customers, {num(io.sold_count)} sold</div>
              </div>
              <div className="bg-stewart-bg rounded p-3">
                <div className="text-xs text-stewart-muted">Phone Up only (no prior internet lead)</div>
                <div className="text-2xl font-bold text-stewart-text">{pct(po.sold_pct)}</div>
                <div className="text-xs text-stewart-muted">{num(po.customer_count)} customers, {num(po.sold_count)} sold</div>
              </div>
              <div className="bg-yellow-900/20 border border-yellow-700/40 rounded p-3 md:col-span-2">
                <div className="text-xs text-yellow-400 uppercase tracking-wide font-semibold mb-1">
                  The Called-Back Segment
                </div>
                <div className="text-xs text-stewart-muted mb-1">{cb.label}</div>
                <div className="text-2xl font-bold text-green-400">{pct(cb.sold_pct)}</div>
                <div className="text-xs text-stewart-muted">
                  {num(cb.customer_count)} customers, {num(cb.sold_count)} sold
                  {calledBackLift > 1 && (
                    <>
                      {" "}—{" "}
                      <span className="text-green-400 font-bold">{calledBackLift.toFixed(1)}×</span>{" "}
                      the conversion rate of internet-only customers
                    </>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t border-yellow-700/40 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="text-stewart-muted">Median time before self-calling</div>
                    <div className="text-base font-mono text-stewart-text">
                      {cb.median_gap_hours !== null ? fmtMinutes(cb.median_gap_hours * 60) : "—"}
                    </div>
                    <div className="text-stewart-muted">Avg: {cb.avg_gap_hours !== null ? fmtMinutes(cb.avg_gap_hours * 60) : "—"}</div>
                  </div>
                  <div>
                    <div className="text-stewart-muted">Had no rep reply before calling</div>
                    <div className="text-base font-mono text-red-400 font-bold">
                      {pct(cb.never_responded_pct)}
                    </div>
                    <div className="text-stewart-muted">{num(cb.never_responded_count)} customers — reps never replied before the customer gave up and phoned in</div>
                  </div>
                </div>

                <div className="mt-3 text-xs text-stewart-text leading-relaxed">
                  <span className="font-semibold text-yellow-400">Interpretation:</span>{" "}
                  {cb.never_responded_pct >= 30 ? (
                    <>These customers had to call themselves because reps never replied. That&apos;s your strongest automation case — every one is a near-miss the store already paid for.</>
                  ) : (
                    <>Most called-back customers did get a digital reply — they chose to call anyway. Still higher-intent than pure internet leads.</>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Intensity × response time — the bombshell */}
      <div className="stewart-card p-4 space-y-3">
        <div>
          <h3 className="text-base font-semibold text-stewart-text">
            Hottest leads — are they actually getting contacted faster?
          </h3>
          <p className="text-xs text-stewart-muted mt-1">
            For customers bucketed by first-hour intensity, how fast did reps
            respond to their first lead and what % closed. If reps are slower
            on the highest-intent leads, that&apos;s the most fixable revenue
            leak in the whole dataset.
          </p>
        </div>

        <table className="w-full text-xs">
          <thead className="text-stewart-muted border-b border-stewart-border">
            <tr>
              <th className="text-left py-2">First-hour intensity</th>
              <th className="text-right py-2">Customers</th>
              <th className="text-right py-2">Contacted %</th>
              <th className="text-right py-2">Median response</th>
              <th className="text-right py-2">Avg response</th>
              <th className="text-right py-2">Sold %</th>
            </tr>
          </thead>
          <tbody>
            {data.intensity.map((r) => {
              const liftVsBase = r.sold_pct - data.contacted_sold_pct;
              const soldColor = liftVsBase > 2 ? "text-green-400" : liftVsBase < -2 ? "text-red-400" : "text-stewart-text";
              return (
                <tr key={r.key} className="border-b border-stewart-border/50">
                  <td className="py-2 text-stewart-text font-medium">{r.label}</td>
                  <td className="py-2 text-right font-mono">{num(r.customer_count)}</td>
                  <td className="py-2 text-right font-mono">{pct(r.contacted_pct)}</td>
                  <td className="py-2 text-right font-mono text-stewart-text">{fmtMinutes(r.median_response_min)}</td>
                  <td className="py-2 text-right font-mono text-stewart-muted">{fmtMinutes(r.avg_response_min)}</td>
                  <td className={`py-2 text-right font-mono font-bold ${soldColor}`}>{pct(r.sold_pct)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── Action Window (sales-rep facing urgency view) ─── */

function ActionWindowView({ data }: { data: ActionWindow }) {
  const maxCustomers = Math.max(...data.intensity.map((b) => b.customer_count));

  // Headline intensity → conversion callout
  const multiTouch = data.intensity.filter((b) => b.key !== "1");
  const multiTouchCustomers = multiTouch.reduce((s, b) => s + b.customer_count, 0);
  const multiTouchSold = multiTouch.reduce((s, b) => s + b.sold_count, 0);
  const multiTouchSoldPct = multiTouchCustomers > 0 ? (multiTouchSold / multiTouchCustomers) * 100 : 0;

  const single = data.intensity.find((b) => b.key === "1");
  const singleSoldPct = single ? single.sold_pct : 0;
  const intensityLift = singleSoldPct > 0 ? multiTouchSoldPct / singleSoldPct : 0;

  // Dropout headline — what % of unsold never come back
  const neverReturned = data.dropout.find((b) => b.key === "no")?.pct || 0;

  return (
    <div className="space-y-6">
      {/* ─── Sales-rep headline ─── */}
      <div className="stewart-card p-5 border-l-4 border-stewart-accent">
        <div className="text-sm font-semibold text-stewart-accent uppercase tracking-wide mb-2">
          What this means for the phones
        </div>
        <div className="text-lg text-stewart-text leading-relaxed">
          When a customer submits <strong>2+ leads in their first hour</strong>, they buy at{" "}
          <span className="text-stewart-accent font-bold">{pct(multiTouchSoldPct)}</span>
          {" "}— that&apos;s{" "}
          <span className="text-stewart-accent font-bold">{intensityLift.toFixed(1)}×</span>{" "}
          the rate of single-lead customers ({pct(singleSoldPct)}).
          <br />
          And of the customers who <em>don&apos;t</em> buy,{" "}
          <span className="text-red-400 font-bold">{pct(neverReturned)}</span>{" "}
          <strong>never come back</strong>. If you don&apos;t reach them in the first hour, most are gone.
        </div>
      </div>

      {/* ─── Top cards ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Customers Analyzed"
          value={num(data.total_customers)}
          sub={`${num(data.total_leads)} total leads`}
        />
        <StatCard
          label="Baseline Conversion"
          value={pct(data.baseline_sold_pct)}
          sub="All customers"
        />
        <StatCard
          label="Multi-touch Lift"
          value={`${intensityLift.toFixed(1)}×`}
          sub="2+ leads vs. single-lead"
          color="bg-stewart-accent/10 border-stewart-accent"
        />
        <StatCard
          label="Never Return"
          value={pct(neverReturned)}
          sub="Of customers who didn&rsquo;t buy"
        />
      </div>

      {/* ─── Intensity → Conversion ─── */}
      <div className="stewart-card p-4 space-y-3">
        <div>
          <h3 className="text-base font-semibold text-stewart-text">
            First-hour intensity → conversion
          </h3>
          <p className="text-xs text-stewart-muted mt-1">
            Count of leads a customer submits in their first hour, paired with
            whether they eventually bought. More action in the first hour means
            higher intent — and the gap is real.
          </p>
        </div>

        <div className="grid grid-cols-12 gap-2 text-xs text-stewart-muted border-b border-stewart-border pb-2">
          <div className="col-span-2">First-hour leads</div>
          <div className="col-span-4">Customers</div>
          <div className="col-span-2 text-right">Count</div>
          <div className="col-span-2 text-right">Sold</div>
          <div className="col-span-1 text-right">Sold %</div>
          <div className="col-span-1 text-right">Multi-src</div>
        </div>

        {data.intensity.map((b) => {
          const widthPct = maxCustomers > 0 ? (b.customer_count / maxCustomers) * 100 : 0;
          const liftVsBase = b.sold_pct - data.baseline_sold_pct;
          const liftColor = liftVsBase > 2 ? "text-green-400" : liftVsBase < -2 ? "text-red-400" : "text-stewart-muted";
          return (
            <div key={b.key} className="grid grid-cols-12 gap-2 items-center text-xs">
              <div className="col-span-2 text-stewart-text font-medium">{b.label}</div>
              <div className="col-span-4">
                <div className="h-5 bg-stewart-bg rounded overflow-hidden">
                  <div
                    className="h-full bg-stewart-accent"
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
              </div>
              <div className="col-span-2 text-right font-mono text-stewart-text">{num(b.customer_count)}</div>
              <div className="col-span-2 text-right font-mono text-stewart-muted">{num(b.sold_count)}</div>
              <div className={`col-span-1 text-right font-mono font-bold ${liftColor}`}>{pct(b.sold_pct)}</div>
              <div className="col-span-1 text-right font-mono text-stewart-muted">{pct(b.multi_source_pct)}</div>
            </div>
          );
        })}

        <div className="pt-3 text-xs text-stewart-muted border-t border-stewart-border">
          Green = above {pct(data.baseline_sold_pct)} baseline. Red = below.{" "}
          Multi-src column shows % whose first-hour leads came from 2+ different
          channels — a strong buying-intent signal.
        </div>
      </div>

      {/* ─── Dropout fate ─── */}
      <div className="stewart-card p-4 space-y-3">
        <div>
          <h3 className="text-base font-semibold text-stewart-text">
            If they don&apos;t buy — do they come back?
          </h3>
          <p className="text-xs text-stewart-muted mt-1">
            Of the {num(data.unsold_count)} customers who didn&apos;t buy, this is
            when (or if) they came back after their first-hour session.
            This is the disengagement pattern.
          </p>
        </div>

        <div className="space-y-2">
          {data.dropout.map((b) => {
            const maxDropoutPct = Math.max(...data.dropout.map((d) => d.pct));
            const widthPct = maxDropoutPct > 0 ? (b.pct / maxDropoutPct) * 100 : 0;
            const isNever = b.key === "no";
            return (
              <div key={b.key} className="grid grid-cols-12 gap-2 items-center text-xs">
                <div className={`col-span-3 ${isNever ? "text-red-400 font-semibold" : "text-stewart-text"}`}>
                  {b.label}
                </div>
                <div className="col-span-6">
                  <div className="h-5 bg-stewart-bg rounded overflow-hidden">
                    <div
                      className={`h-full ${isNever ? "bg-red-500" : "bg-stewart-accent"}`}
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                </div>
                <div className="col-span-2 text-right font-mono text-stewart-muted">{num(b.count)}</div>
                <div className={`col-span-1 text-right font-mono ${isNever ? "text-red-400 font-bold" : "text-stewart-text"}`}>{pct(b.pct)}</div>
              </div>
            );
          })}
        </div>

        <div className="pt-3 text-xs text-stewart-muted border-t border-stewart-border leading-relaxed">
          <span className="text-stewart-text font-semibold">The takeaway for reps:</span>{" "}
          Most unsold customers are one-and-done. The first hour isn&apos;t
          just important — it&apos;s often the <em>only</em> hour you have.
          Same-day follow-up isn&apos;t fast enough.
        </div>
      </div>
    </div>
  );
}

/* ─── Pie chart (SVG, no dependencies) ─── */

interface PieSlice {
  label: string;
  value: number;
  color: string;
}

function PieChart({ slices, size = 180 }: { slices: PieSlice[]; size?: number }) {
  const total = slices.reduce((s, x) => s + x.value, 0);
  if (total === 0) return null;
  const radius = size / 2;
  const cx = radius;
  const cy = radius;

  let cumAngle = -Math.PI / 2;
  const paths = slices.map((slice, idx) => {
    const frac = slice.value / total;
    const angle = frac * Math.PI * 2;
    const x1 = cx + radius * Math.cos(cumAngle);
    const y1 = cy + radius * Math.sin(cumAngle);
    cumAngle += angle;
    const x2 = cx + radius * Math.cos(cumAngle);
    const y2 = cy + radius * Math.sin(cumAngle);
    const largeArc = frac > 0.5 ? 1 : 0;
    // Full circle edge case — draw as two semicircles
    const d = frac === 1
      ? `M ${cx} ${cy - radius} A ${radius} ${radius} 0 1 1 ${cx} ${cy + radius} A ${radius} ${radius} 0 1 1 ${cx} ${cy - radius} Z`
      : `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    return <path key={idx} d={d} fill={slice.color} />;
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {paths}
    </svg>
  );
}

/* ─── Leads per customer (intent proxy) ─── */

function LeadsPerCustomerView({ data }: { data: LeadsPerCustomerBucket[] }) {
  const maxCount = Math.max(...data.map((b) => b.customer_count));
  const totalCustomers = data.reduce((s, b) => s + b.customer_count, 0);
  const totalSold = data.reduce((s, b) => s + b.sold_count, 0);
  const baselineSoldPct = totalCustomers > 0 ? (totalSold / totalCustomers) * 100 : 0;

  // Highest-intent bucket (by sold %)
  const bestIntent = [...data]
    .filter((b) => b.customer_count >= 5)
    .sort((a, b) => b.sold_pct - a.sold_pct)[0];

  return (
    <div className="stewart-card p-4 space-y-4">
      <div>
        <h3 className="text-base font-semibold text-stewart-text">
          Intent signal — more leads per customer = higher intent?
        </h3>
        <p className="text-xs text-stewart-muted mt-1">
          How many leads each unique customer submitted, and what % of
          those customers eventually bought. More touches usually means
          higher intent. Baseline conversion: <span className="text-stewart-accent font-mono">{pct(baselineSoldPct)}</span> across all customers.
        </p>
      </div>

      <div className="space-y-2">
        <div className="grid grid-cols-12 gap-2 text-xs text-stewart-muted border-b border-stewart-border pb-2">
          <div className="col-span-2">Leads per customer</div>
          <div className="col-span-5">Customers</div>
          <div className="col-span-2 text-right">Count</div>
          <div className="col-span-1 text-right">Share</div>
          <div className="col-span-1 text-right">Sold</div>
          <div className="col-span-1 text-right">Sold %</div>
        </div>
        {data.map((b) => {
          const widthPct = maxCount > 0 ? (b.customer_count / maxCount) * 100 : 0;
          const liftVsBaseline = b.sold_pct - baselineSoldPct;
          const liftColor = liftVsBaseline > 2 ? "text-green-400" : liftVsBaseline < -2 ? "text-red-400" : "text-stewart-muted";
          return (
            <div key={b.key} className="grid grid-cols-12 gap-2 items-center text-xs">
              <div className="col-span-2 text-stewart-text">{b.label}</div>
              <div className="col-span-5">
                <div className="h-5 bg-stewart-bg rounded overflow-hidden">
                  <div
                    className="h-full bg-stewart-accent"
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
              </div>
              <div className="col-span-2 text-right font-mono text-stewart-text">{num(b.customer_count)}</div>
              <div className="col-span-1 text-right font-mono text-stewart-muted">{pct(b.pct_of_customers)}</div>
              <div className="col-span-1 text-right font-mono text-stewart-muted">{num(b.sold_count)}</div>
              <div className={`col-span-1 text-right font-mono ${liftColor}`}>{pct(b.sold_pct)}</div>
            </div>
          );
        })}
      </div>

      {bestIntent && (
        <div className="text-xs text-stewart-muted pt-2 border-t border-stewart-border">
          <span className="text-stewart-text">Highest-intent bucket:</span>{" "}
          <span className="text-stewart-accent">{bestIntent.label}</span>{" "}
          converts at <span className="font-mono">{pct(bestIntent.sold_pct)}</span> vs.{" "}
          <span className="font-mono">{pct(baselineSoldPct)}</span> baseline — that&apos;s{" "}
          <span className="font-mono">{(bestIntent.sold_pct / Math.max(baselineSoldPct, 0.1)).toFixed(1)}×</span>{" "}
          the average conversion rate.
        </div>
      )}
    </div>
  );
}

/* ─── Customer Behavior ─── */

const BEHAVIOR_GROUPS: { title: string; takeaway: string; keys: string[] }[] = [
  {
    title: "Same-session (under 1 day)",
    takeaway:
      "These look like website behavior — form submits within minutes or hours of each other. Safe to treat as one lead.",
    keys: ["lt_1h", "1_6h", "6_24h"],
  },
  {
    title: "Active shopping window (1–14 days)",
    takeaway:
      "Active buyers comparing options. Every repeat here is a real signal, not spam — but it is the same shopper.",
    keys: ["1_3d", "3_7d", "7_14d"],
  },
  {
    title: "Re-engagement (14–90 days)",
    takeaway:
      "Customer came back later. If they convert, first-touch source usually gets undercounted — worth knowing.",
    keys: ["14_30d", "30_90d"],
  },
  {
    title: "Separate intent (90+ days)",
    takeaway:
      "Long enough that this is almost certainly a new shopping cycle. Don't count as duplicate at all.",
    keys: ["90_180d", "gt_180d"],
  },
];

function BehaviorView({ data }: { data: TimeGapResponse }) {
  if (data.total_gaps === 0) {
    return (
      <div className="text-stewart-muted text-sm">
        No repeat-customer gaps in this range. Widen the date window.
      </div>
    );
  }

  const maxPct = Math.max(...data.histogram.map((h) => h.pct_of_gaps));
  const byKey: Record<string, TimeGapBucket> = Object.fromEntries(
    data.histogram.map((h) => [h.key, h]),
  );

  // Dominant group — highest combined pct
  const groupTotals = BEHAVIOR_GROUPS.map((g) => ({
    title: g.title,
    pct: g.keys.reduce((s, k) => s + (byKey[k]?.pct_of_gaps || 0), 0),
  }));
  const dominant = groupTotals.reduce((a, b) => (a.pct >= b.pct ? a : b));

  return (
    <div className="space-y-6">
      {/* Top-line cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Leads (sales only)"
          value={num(data.total_leads)}
          sub="Service leads excluded"
        />
        <StatCard
          label="Unique Customers"
          value={num(data.unique_customers)}
          sub={`${num(data.customers_with_repeats)} came back more than once`}
        />
        <StatCard
          label="Repeat Lead Events"
          value={num(data.total_gaps)}
          sub="Times the same person submitted again"
        />
        <StatCard
          label="Dominant Pattern"
          value={dominant.title.split(" ")[0]}
          sub={`${pct(dominant.pct)} of repeats`}
          color="bg-stewart-accent/10 border-stewart-accent"
        />
      </div>

      {/* Explainer */}
      <div className="stewart-card p-4 text-sm text-stewart-text">
        <p className="mb-1 font-semibold">What this shows</p>
        <p className="text-stewart-muted">
          Every time the same customer submits a lead after an earlier one, we
          measure how long between them. The chart below buckets those gaps
          from &ldquo;under 1 hour&rdquo; to &ldquo;6 months later&rdquo; so
          you can see which patterns are website noise, real shopping, or
          re-engagement — and pick the right spam window from real data.
        </p>
      </div>

      {/* Pie chart — behavior group share */}
      <div className="stewart-card p-4">
        <h3 className="text-base font-semibold text-stewart-text mb-1">
          Where are the repeats happening?
        </h3>
        <p className="text-xs text-stewart-muted mb-4">
          Share of every repeat-lead event by behavior group.
        </p>
        <div className="flex flex-wrap items-center gap-8">
          <PieChart
            slices={BEHAVIOR_GROUPS.map((g, i) => ({
              label: g.title,
              value: g.keys.reduce((s, k) => s + (byKey[k]?.gap_count || 0), 0),
              color: ["#60a5fa", "#34d399", "#fbbf24", "#f87171"][i % 4],
            }))}
          />
          <div className="space-y-2 text-sm">
            {BEHAVIOR_GROUPS.map((g, i) => {
              const val = g.keys.reduce((s, k) => s + (byKey[k]?.gap_count || 0), 0);
              const p = data.total_gaps > 0 ? (val / data.total_gaps) * 100 : 0;
              const color = ["#60a5fa", "#34d399", "#fbbf24", "#f87171"][i % 4];
              return (
                <div key={g.title} className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
                  <span className="text-stewart-text w-64">{g.title}</span>
                  <span className="font-mono text-stewart-accent w-16 text-right">{pct(p)}</span>
                  <span className="font-mono text-stewart-muted text-xs">{num(val)} events</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Leads per customer — intent proxy */}
      <LeadsPerCustomerView data={data.leads_per_customer} />

      {/* Grouped histogram */}
      {BEHAVIOR_GROUPS.map((group) => {
        const groupPct = group.keys.reduce(
          (s, k) => s + (byKey[k]?.pct_of_gaps || 0),
          0,
        );
        return (
          <div key={group.title} className="stewart-card p-4 space-y-3">
            <div className="flex items-baseline justify-between">
              <h3 className="text-base font-semibold text-stewart-text">
                {group.title}
              </h3>
              <span className="text-sm text-stewart-accent font-mono">
                {pct(groupPct)} of repeats
              </span>
            </div>
            <p className="text-xs text-stewart-muted">{group.takeaway}</p>

            <div className="space-y-2 pt-2">
              {group.keys.map((k) => {
                const b = byKey[k];
                if (!b) return null;
                const widthPct = maxPct > 0 ? (b.pct_of_gaps / maxPct) * 100 : 0;
                return (
                  <div key={k} className="grid grid-cols-12 gap-2 items-center text-xs">
                    <div className="col-span-3 text-stewart-muted">{b.label}</div>
                    <div className="col-span-6">
                      <div className="h-5 bg-stewart-bg rounded overflow-hidden">
                        <div
                          className="h-full bg-stewart-accent"
                          style={{ width: `${widthPct}%` }}
                        />
                      </div>
                    </div>
                    <div className="col-span-1 text-right font-mono text-stewart-text">
                      {pct(b.pct_of_gaps)}
                    </div>
                    <div className="col-span-2 text-right font-mono text-stewart-muted">
                      {num(b.gap_count)} gaps
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Same-source vs multi-channel breakdown */}
      <div className="stewart-card p-4">
        <h3 className="text-base font-semibold text-stewart-text mb-1">
          Same source vs. different source
        </h3>
        <p className="text-xs text-stewart-muted mb-3">
          When a customer comes back, did the same source generate the
          duplicate (spam signal) or a different one (shopping signal)?
        </p>
        <table className="w-full text-xs">
          <thead className="text-stewart-muted border-b border-stewart-border">
            <tr>
              <th className="text-left py-2">Gap range</th>
              <th className="text-right py-2">Repeats</th>
              <th className="text-right py-2">Same source</th>
              <th className="text-right py-2">Different source</th>
              <th className="text-right py-2">Same-source share</th>
            </tr>
          </thead>
          <tbody>
            {data.histogram.map((b) => {
              const sameShare = b.gap_count > 0 ? (b.same_source_count / b.gap_count) * 100 : 0;
              return (
                <tr key={b.key} className="border-b border-stewart-border/50">
                  <td className="py-2 text-stewart-text">{b.label}</td>
                  <td className="py-2 text-right font-mono">{num(b.gap_count)}</td>
                  <td className="py-2 text-right font-mono text-red-400">{num(b.same_source_count)}</td>
                  <td className="py-2 text-right font-mono text-blue-400">{num(b.multi_channel_count)}</td>
                  <td className="py-2 text-right font-mono">{pct(sameShare)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── main page ─── */

type Tab = "summary" | "behavior" | "action" | "response" | "sources" | "journeys" | "clean";

interface PhoneJourney {
  total_customers: number;
  segments: {
    internet_only: { label: string; customer_count: number; sold_count: number; sold_pct: number };
    phone_only: { label: string; customer_count: number; sold_count: number; sold_pct: number };
    called_back: {
      label: string;
      customer_count: number;
      sold_count: number;
      sold_pct: number;
      median_gap_hours: number | null;
      avg_gap_hours: number | null;
      never_responded_count: number;
      never_responded_pct: number;
      slow_responded_count: number;
      slow_responded_pct: number;
      never_responded_sold_pct: number;
    };
    pre_phoned: { label: string; customer_count: number; sold_count: number; sold_pct: number };
  };
}

interface ResponseTimeData {
  total_leads: number;
  contacted_leads: number;
  never_contacted_leads: number;
  never_contacted_pct: number;
  contacted_sold_pct: number;
  never_contacted_sold_pct: number;
  phone_up: {
    leads: number;
    unique_customers: number;
    sold_customers: number;
    sold_pct: number;
  };
  business_hours: {
    total_leads: number;
    contacted_leads: number;
    never_contacted_leads: number;
    never_contacted_pct: number;
    contacted_sold_pct: number;
    never_contacted_sold_pct: number;
    avg_response_min: number;
    median_response_min: number;
  };
  avg_response_min: number;
  median_response_min: number;
  distribution: Array<{
    key: string;
    label: string;
    lead_count: number;
    sold_count: number;
    sold_pct: number;
    pct_of_contacted: number;
  }>;
  intensity: Array<{
    key: string;
    label: string;
    customer_count: number;
    contacted_count: number;
    contacted_pct: number;
    sold_count: number;
    sold_pct: number;
    avg_response_min: number | null;
    median_response_min: number | null;
  }>;
}

interface ActionWindow {
  total_leads: number;
  total_customers: number;
  baseline_sold_pct: number;
  unsold_count: number;
  intensity: Array<{
    key: string;
    label: string;
    customer_count: number;
    sold_count: number;
    sold_pct: number;
    multi_source_count: number;
    multi_source_pct: number;
    avg_hours_to_sale: number | null;
  }>;
  dropout: Array<{
    key: string;
    label: string;
    count: number;
    pct: number;
  }>;
}

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
  const [timeGaps, setTimeGaps] = useState<TimeGapResponse | null>(null);
  const [actionWindow, setActionWindow] = useState<ActionWindow | null>(null);
  const [responseTime, setResponseTime] = useState<ResponseTimeData | null>(null);
  const [phoneJourney, setPhoneJourney] = useState<PhoneJourney | null>(null);
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
      } else if (tab === "behavior") {
        const tg = await api.getDedupTimeGaps(tenantId, startDate || undefined, endDate || undefined);
        setTimeGaps(tg);
      } else if (tab === "action") {
        const aw = await api.getDedupActionWindow(tenantId, startDate || undefined, endDate || undefined);
        setActionWindow(aw);
      } else if (tab === "response") {
        const [rt, pj] = await Promise.all([
          api.getDedupResponseTime(tenantId, startDate || undefined, endDate || undefined),
          api.getDedupPhoneJourney(tenantId, startDate || undefined, endDate || undefined),
        ]);
        setResponseTime(rt);
        setPhoneJourney(pj);
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
    { key: "behavior", label: "Customer Behavior" },
    { key: "action", label: "Action Window" },
    { key: "response", label: "Response Time" },
    { key: "sources", label: "Source ROI" },
    { key: "journeys", label: "Customer Journeys" },
    { key: "clean", label: "Clean View" },
  ];

  const presets = [
    { key: "7d", label: "7 days" },
    { key: "30d", label: "30 days" },
    { key: "90d", label: "90 days" },
    { key: "ytd", label: "YTD" },
    { key: "2026", label: "2026" },
    { key: "2025", label: "2025" },
    { key: "2024", label: "2024" },
    { key: "2023", label: "2023" },
    { key: "2022", label: "2022" },
    { key: "2021", label: "2021" },
    { key: "2020", label: "2020" },
    { key: "2019", label: "2019" },
    { key: "2018", label: "2018" },
    { key: "2017", label: "2017" },
    { key: "2016", label: "2016" },
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

      {/* ─── CUSTOMER BEHAVIOR TAB ─── */}
      {!loading && tab === "behavior" && timeGaps && (
        <BehaviorView data={timeGaps} />
      )}

      {/* ─── ACTION WINDOW TAB ─── */}
      {!loading && tab === "action" && actionWindow && (
        <ActionWindowView data={actionWindow} />
      )}

      {/* ─── RESPONSE TIME TAB ─── */}
      {!loading && tab === "response" && responseTime && (
        <ResponseTimeView data={responseTime} phoneJourney={phoneJourney} />
      )}

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
                      <th className="px-3 py-2 text-center">{"->"}</th>
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
