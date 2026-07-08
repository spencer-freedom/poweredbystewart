"use client";

import { useState } from "react";

// Build #6 — ROI calculator. Dual-output by design: every dollar metric
// is paired with an opportunity-count metric. The VP reads the dollar
// column; Kenny reads the opportunity column; same data satisfies both
// buyers at once. Defaults are industry benchmarks for V1 (badged as
// placeholder) — swap to Ion's real numbers post-Kenny dry run.

const DEFAULTS = {
  costPerLead: 35,
  leadsPerMonth: 4000,
  closeRate: 0.06,
  aov: 15000,
  coachingLift: 0.1, // relative lift on close rate from coaching
  leakRecovery: 0.05, // share of leads recovered from leakage
  ipoMultiple: 4, // revenue → enterprise value multiple (shadow only)
};

const money = (n: number) =>
  isFinite(n)
    ? n.toLocaleString(undefined, {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      })
    : "—";
const num = (n: number) => Math.round(n).toLocaleString();
const pct = (n: number) => `${Math.round(n * 100)}%`;

export function RoiCalculator() {
  const [costPerLead, setCostPerLead] = useState(DEFAULTS.costPerLead);
  const [leadsPerMonth, setLeadsPerMonth] = useState(DEFAULTS.leadsPerMonth);
  const [closeRate, setCloseRate] = useState(DEFAULTS.closeRate);
  const [aov, setAov] = useState(DEFAULTS.aov);
  const [coachingLift, setCoachingLift] = useState(DEFAULTS.coachingLift);
  const [leakRecovery, setLeakRecovery] = useState(DEFAULTS.leakRecovery);

  // Baseline
  const currentCloses = leadsPerMonth * closeRate;
  const leadSpend = costPerLead * leadsPerMonth; // already-purchased cost
  const costPerCloseBefore = currentCloses ? leadSpend / currentCloses : 0;

  // Coaching lift — better close rate on the same leads.
  const coachingCloses = leadsPerMonth * closeRate * coachingLift;
  const coachingDollars = coachingCloses * aov;

  // Leakage recovery — leads that would have died, converting at base rate.
  const recoveredLeads = leadsPerMonth * leakRecovery;
  const recoveredCloses = recoveredLeads * closeRate;
  const leakageDollars = recoveredCloses * aov;

  // Totals
  const totalDollars = coachingDollars + leakageDollars;
  const totalCloses = coachingCloses + recoveredCloses;
  const costPerCloseAfter =
    currentCloses + totalCloses
      ? leadSpend / (currentCloses + totalCloses)
      : 0;
  const annualTotal = totalDollars * 12;
  const ipoShadow = annualTotal * DEFAULTS.ipoMultiple;

  return (
    <div className="rounded-xl border border-stewart-border bg-stewart-card overflow-hidden">
      <div className="px-5 py-4 border-b border-stewart-border bg-stewart-bg/40 flex items-baseline justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wider font-semibold text-stewart-accent">
            The economics &middot; in your own numbers
          </p>
          <p className="text-sm text-stewart-muted mt-1">
            Adjust any input. Dollars and opportunities update live.
          </p>
        </div>
        <span className="text-[10px] uppercase tracking-wider font-mono text-stewart-warning border border-stewart-warning/40 rounded px-1.5 py-0.5 shrink-0">
          placeholder
        </span>
      </div>

      <div className="px-5 py-5 space-y-6">
        {/* Inputs */}
        <div className="grid sm:grid-cols-2 gap-3">
          <Slider label="Cost per lead" value={costPerLead} onChange={setCostPerLead} min={10} max={150} step={5} display={money} />
          <Slider label="Leads / month" value={leadsPerMonth} onChange={setLeadsPerMonth} min={500} max={15000} step={100} display={num} />
          <Slider label="Close rate (from lead)" value={closeRate} onChange={setCloseRate} min={0.01} max={0.3} step={0.01} display={pct} />
          <Slider label="Avg gross / sale" value={aov} onChange={setAov} min={3000} max={40000} step={500} display={money} />
        </div>

        {/* Already-purchased callout */}
        <div className="rounded-lg border border-stewart-accent/40 bg-stewart-accent/5 p-4">
          <p className="text-xs uppercase tracking-wider font-semibold text-stewart-accent mb-1">
            The opportunity is already purchased
          </p>
          <p className="text-sm text-stewart-text leading-relaxed">
            You already spend{" "}
            <span className="font-mono font-bold">{money(leadSpend)}</span>/mo
            buying these leads. That cost is sunk. Stewart is return on assets
            you&apos;ve already bought &mdash; not a new line item chasing new
            leads.
          </p>
        </div>

        {/* Levers */}
        <div className="grid sm:grid-cols-2 gap-3">
          <Slider label="Coaching close-rate lift" value={coachingLift} onChange={setCoachingLift} min={0.02} max={0.25} step={0.01} display={pct} accent />
          <Slider label="Leads recovered from leakage" value={leakRecovery} onChange={setLeakRecovery} min={0.01} max={0.2} step={0.01} display={pct} accent />
        </div>

        {/* Dual-output results */}
        <div className="grid sm:grid-cols-3 gap-3">
          <ResultCard
            label="Coaching lift"
            dollars={money(coachingDollars)}
            count={`${num(coachingCloses)} manager saves`}
          />
          <ResultCard
            label="Leakage recovery"
            dollars={money(leakageDollars)}
            count={`${num(recoveredCloses)} recovered opps`}
          />
          <ResultCard
            label="Total impact / mo"
            dollars={money(totalDollars)}
            count={`${num(totalCloses)} opps preserved`}
            emphasis
          />
        </div>

        {/* Cost per close before/after */}
        <div className="rounded-lg border border-stewart-border bg-stewart-bg/40 p-4 flex flex-wrap items-baseline justify-between gap-3">
          <p className="text-xs uppercase tracking-wider text-stewart-muted">
            Cost per close
          </p>
          <p className="font-mono text-lg">
            <span className="text-stewart-muted">{money(costPerCloseBefore)}</span>
            <span className="text-stewart-muted mx-2">&rarr;</span>
            <span className="text-stewart-success font-bold">{money(costPerCloseAfter)}</span>
          </p>
        </div>

        {/* IPO shadow */}
        <div className="rounded-lg border border-dashed border-stewart-border p-4">
          <p className="text-xs uppercase tracking-wider text-stewart-muted mb-1">
            IPO multiplier shadow
          </p>
          <p className="text-sm text-stewart-muted leading-relaxed">
            {money(annualTotal)}/yr recovered &times; {DEFAULTS.ipoMultiple}&times;
            exit multiple &asymp;{" "}
            <span className="font-mono font-bold text-stewart-text">
              {money(ipoShadow)}
            </span>{" "}
            in enterprise value created. Directional, not a promise.
          </p>
        </div>

        <p className="text-xs text-stewart-muted italic leading-relaxed pt-2 border-t border-stewart-border">
          ⓘ Inputs are placeholders &mdash; reasonable industry estimates.
          Once Kenny shares Ion&apos;s real cost-per-lead, close rate, and AOV,
          the badge drops and the math runs against your actual numbers.
        </p>
      </div>
    </div>
  );
}

function ResultCard({
  label,
  dollars,
  count,
  emphasis,
}: {
  label: string;
  dollars: string;
  count: string;
  emphasis?: boolean;
}) {
  return (
    <div
      className={
        "rounded-lg border p-4 " +
        (emphasis
          ? "border-stewart-success/50 bg-stewart-success/5"
          : "border-stewart-border bg-stewart-bg/40")
      }
    >
      <p className="text-xs uppercase tracking-wider text-stewart-muted mb-2">
        {label}
      </p>
      <p
        className={
          "font-mono font-bold text-2xl " +
          (emphasis ? "text-stewart-success" : "text-stewart-text")
        }
      >
        {dollars}
      </p>
      <p className="text-xs text-stewart-accent mt-1 font-medium">{count}</p>
    </div>
  );
}

function Slider({
  label,
  value,
  onChange,
  min,
  max,
  step,
  display,
  accent,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  display: (v: number) => string;
  accent?: boolean;
}) {
  return (
    <label
      className={
        "block rounded border p-3 " +
        (accent
          ? "border-stewart-accent/30 bg-stewart-accent/5"
          : "border-stewart-border bg-stewart-bg/40")
      }
    >
      <span className="text-xs text-stewart-muted">{label}</span>
      <div className="flex items-baseline justify-between mt-1 gap-3">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-2/3 accent-stewart-accent"
        />
        <span className="text-lg font-bold font-mono text-stewart-text whitespace-nowrap">
          {display(value)}
        </span>
      </div>
    </label>
  );
}
