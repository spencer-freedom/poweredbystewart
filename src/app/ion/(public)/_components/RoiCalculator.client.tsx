"use client";

import { useState } from "react";

// VP-facing ROI calculator. Lives inside §5 alongside Spencer's catch +
// the bombshell. Per the ROI brief: placeholder Ion conversion numbers
// until Kenny shares real ones; placeholder badges drop the day they
// land. Math updates in real time.
//
// HARDCODED Stewart findings (real measurements from the 332-call run):
const FINDING_TOTAL_CALLS = 332;
const FINDING_OBJECTION_INVERSION_EXECUTED = 0;
const FINDING_SOFTENER_INSTANCES = 314;
const FINDING_SOFTENER_PER_7MIN = "~1 every 7 min of rep talk";

// PHASE 2 PRICING (also hardcoded — locked in /ion/whats-next).
const PHASE_2_MONTHLY_PER_MANAGER = 1500;

// Reasonable defaults for a solar setter floor at Ion's scale. Each
// flips to an "Ion verified" badge when Kenny ships real numbers.
const DEFAULTS = {
  setsPerMonth: 3000,
  sitPctFromSets: 0.3,
  closePctFromSits: 0.25,
  avgGrossPerSale: 12000,
  assumedLiftPct: 0.1,
  managerCount: 6,
} as const;

function fmtMoney(n: number): string {
  if (!isFinite(n)) return "—";
  return n.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function fmtPct(n: number): string {
  return `${Math.round(n * 100)}%`;
}

function fmtNum(n: number): string {
  return n.toLocaleString();
}

export function RoiCalculator() {
  const [setsPerMonth, setSetsPerMonth] = useState<number>(DEFAULTS.setsPerMonth);
  const [sitPctFromSets, setSitPctFromSets] = useState<number>(DEFAULTS.sitPctFromSets);
  const [closePctFromSits, setClosePctFromSits] = useState<number>(
    DEFAULTS.closePctFromSits
  );
  const [avgGrossPerSale, setAvgGrossPerSale] = useState<number>(
    DEFAULTS.avgGrossPerSale
  );
  const [assumedLiftPct, setAssumedLiftPct] = useState<number>(DEFAULTS.assumedLiftPct);
  const [managerCount, setManagerCount] = useState<number>(DEFAULTS.managerCount);

  // Derived math
  const dollarPerSit = closePctFromSits * avgGrossPerSale;
  const dollarPerSet = sitPctFromSets * dollarPerSit;
  const monthlyGross =
    setsPerMonth * sitPctFromSets * closePctFromSits * avgGrossPerSale;
  const monthlyRecovered = monthlyGross * assumedLiftPct;
  const annualRecovered = monthlyRecovered * 12;
  const annualSubscription = managerCount * PHASE_2_MONTHLY_PER_MANAGER * 12;
  const roiMultiple = annualSubscription
    ? annualRecovered / annualSubscription
    : 0;

  return (
    <div className="rounded-lg border border-stewart-border bg-stewart-card overflow-hidden">
      <div className="px-5 py-4 border-b border-stewart-border bg-stewart-bg/40">
        <p className="text-xs uppercase tracking-wider font-semibold text-stewart-accent">
          The math &middot; in your own numbers
        </p>
        <p className="text-sm text-stewart-muted mt-1">
          Adjust any input. The bombshell and ROI numbers update live.
        </p>
      </div>

      <div className="px-5 py-5 space-y-5">
        <InputGroup label="Conversion inputs" placeholder>
          <NumberInput
            label="Sets per month"
            value={setsPerMonth}
            onChange={setSetsPerMonth}
            min={500}
            max={20000}
            step={100}
            display={fmtNum}
          />
          <PercentInput
            label="Sit % from sets"
            value={sitPctFromSets}
            onChange={setSitPctFromSets}
            min={0.05}
            max={0.7}
            step={0.01}
          />
          <PercentInput
            label="Close % from sits"
            value={closePctFromSits}
            onChange={setClosePctFromSits}
            min={0.05}
            max={0.6}
            step={0.01}
          />
          <NumberInput
            label="Avg gross / sale"
            value={avgGrossPerSale}
            onChange={setAvgGrossPerSale}
            min={3000}
            max={50000}
            step={500}
            display={fmtMoney}
            prefix="$"
          />
        </InputGroup>

        <DerivedBlock
          lines={[
            ["$ per sit", `${fmtPct(closePctFromSits)} × ${fmtMoney(avgGrossPerSale)}`, fmtMoney(dollarPerSit)],
            ["$ per set", `${fmtPct(sitPctFromSets)} × ${fmtMoney(dollarPerSit)}`, fmtMoney(dollarPerSet)],
            [
              "Monthly gross",
              `${fmtNum(setsPerMonth)} × ${fmtPct(sitPctFromSets)} × ${fmtPct(closePctFromSits)} × ${fmtMoney(avgGrossPerSale)}`,
              fmtMoney(monthlyGross),
            ],
          ]}
        />

        <BombshellCard
          monthlyRecovered={monthlyRecovered}
          annualRecovered={annualRecovered}
          assumedLiftPct={assumedLiftPct}
          onLiftChange={setAssumedLiftPct}
        />

        <SoftenerCard />

        <RoiFooter
          annualRecovered={annualRecovered}
          annualSubscription={annualSubscription}
          roiMultiple={roiMultiple}
          managerCount={managerCount}
          onManagerCountChange={setManagerCount}
        />

        <p className="text-xs text-stewart-muted italic leading-relaxed pt-2 border-t border-stewart-border">
          ⓘ Inputs are placeholders &mdash; reasonable industry estimates
          for solar setter floors at Ion&apos;s scale. Once Kenny shares
          real Ion numbers the placeholder badges drop and the math gets
          honest against your actual conversion data.
        </p>
      </div>
    </div>
  );
}

function InputGroup({
  label,
  placeholder,
  children,
}: {
  label: string;
  placeholder?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-3">
        <p className="text-xs uppercase tracking-wider font-semibold text-stewart-muted">
          {label}
        </p>
        {placeholder ? (
          <span className="text-[10px] uppercase tracking-wider font-mono text-stewart-warning border border-stewart-warning/40 rounded px-1.5 py-0.5">
            placeholder
          </span>
        ) : null}
      </div>
      <div className="grid sm:grid-cols-2 gap-3">{children}</div>
    </div>
  );
}

function NumberInput({
  label,
  value,
  onChange,
  min,
  max,
  step,
  display,
  prefix,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  display?: (v: number) => string;
  prefix?: string;
}) {
  const shown = display ? display(value) : value.toString();
  return (
    <label className="block rounded border border-stewart-border bg-stewart-bg/40 p-3">
      <span className="text-xs text-stewart-muted">{label}</span>
      <div className="flex items-baseline justify-between mt-1">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-2/3 accent-stewart-accent"
        />
        <span className="text-lg font-bold font-mono text-stewart-text whitespace-nowrap ml-3">
          {prefix && !shown.startsWith("$") ? `${prefix}${shown}` : shown}
        </span>
      </div>
    </label>
  );
}

function PercentInput({
  label,
  value,
  onChange,
  min,
  max,
  step,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
}) {
  return (
    <label className="block rounded border border-stewart-border bg-stewart-bg/40 p-3">
      <span className="text-xs text-stewart-muted">{label}</span>
      <div className="flex items-baseline justify-between mt-1">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-2/3 accent-stewart-accent"
        />
        <span className="text-lg font-bold font-mono text-stewart-text whitespace-nowrap ml-3">
          {Math.round(value * 100)}%
        </span>
      </div>
    </label>
  );
}

function DerivedBlock({ lines }: { lines: [string, string, string][] }) {
  return (
    <div className="rounded border border-stewart-border bg-stewart-bg/40 p-4 space-y-2">
      <p className="text-xs uppercase tracking-wider font-semibold text-stewart-muted mb-2">
        Derived math
      </p>
      {lines.map(([label, formula, value]) => (
        <div
          key={label}
          className="grid grid-cols-12 gap-3 items-baseline text-sm"
        >
          <span className="col-span-12 sm:col-span-3 text-stewart-muted">
            {label}
          </span>
          <span className="col-span-12 sm:col-span-6 text-xs font-mono text-stewart-muted">
            = {formula}
          </span>
          <span className="col-span-12 sm:col-span-3 sm:text-right font-mono font-bold text-stewart-text">
            {value}
          </span>
        </div>
      ))}
    </div>
  );
}

function BombshellCard({
  monthlyRecovered,
  annualRecovered,
  assumedLiftPct,
  onLiftChange,
}: {
  monthlyRecovered: number;
  annualRecovered: number;
  assumedLiftPct: number;
  onLiftChange: (v: number) => void;
}) {
  return (
    <div className="rounded-xl border-2 border-stewart-accent bg-gradient-to-br from-stewart-accent/15 via-stewart-bg to-stewart-bg p-5 sm:p-6 space-y-4">
      <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-stewart-accent">
        🚨 The objection-inversion gap
      </p>
      <p className="text-base sm:text-lg text-stewart-text leading-snug">
        Stewart read{" "}
        <span className="font-bold">{fmtNum(FINDING_TOTAL_CALLS)}</span> of your
        calls. The codex&apos;s highest-leverage move was executed in:
      </p>
      <p className="text-3xl sm:text-4xl lg:text-5xl font-bold text-stewart-warning text-center">
        ZERO of them.
      </p>

      <div className="rounded border border-stewart-border bg-stewart-bg/40 p-4">
        <label className="block">
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-xs text-stewart-muted">
              Assumed conversion lift if reps learn the move
            </span>
            <span className="text-lg font-bold font-mono text-stewart-text">
              {Math.round(assumedLiftPct * 100)}%
            </span>
          </div>
          <input
            type="range"
            min={0.05}
            max={0.25}
            step={0.01}
            value={assumedLiftPct}
            onChange={(e) => onLiftChange(parseFloat(e.target.value))}
            className="w-full accent-stewart-accent"
          />
          <p className="text-[10px] text-stewart-muted mt-1">
            (conservative; some studies suggest 15–20%)
          </p>
        </label>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div className="rounded border border-stewart-success/40 bg-stewart-success/5 p-3">
          <p className="text-xs uppercase tracking-wider text-stewart-success mb-1">
            Recovered revenue / month
          </p>
          <p className="text-2xl font-bold font-mono text-stewart-success">
            {fmtMoney(monthlyRecovered)}
          </p>
        </div>
        <div className="rounded border border-stewart-success/40 bg-stewart-success/5 p-3">
          <p className="text-xs uppercase tracking-wider text-stewart-success mb-1">
            Recovered revenue / year
          </p>
          <p className="text-2xl font-bold font-mono text-stewart-success">
            {fmtMoney(annualRecovered)}
          </p>
        </div>
      </div>

      <p className="text-xs text-stewart-muted leading-relaxed">
        Your script says it&apos;s the #1 move. Your floor never does it.
        That&apos;s a floor-wide training gap nobody has time to discover
        manually. Stewart found it in $128 of compute.
      </p>
    </div>
  );
}

function SoftenerCard() {
  return (
    <div className="rounded-lg border border-stewart-warning/40 bg-stewart-warning/5 p-4 space-y-2">
      <p className="text-[10px] uppercase tracking-wider font-semibold text-stewart-warning">
        Kinda softener gap &middot; Spencer&apos;s catch
      </p>
      <p className="text-sm text-stewart-text leading-relaxed">
        <span className="font-bold">{fmtNum(FINDING_SOFTENER_INSTANCES)}</span>{" "}
        rep softener instances across {FINDING_TOTAL_CALLS} calls (
        {FINDING_SOFTENER_PER_7MIN}). Estimated trust / professionalism
        drag: hard to quantify in dollars; impact on close rate is real.
        Coaching investment: trivial.
      </p>
    </div>
  );
}

function RoiFooter({
  annualRecovered,
  annualSubscription,
  roiMultiple,
  managerCount,
  onManagerCountChange,
}: {
  annualRecovered: number;
  annualSubscription: number;
  roiMultiple: number;
  managerCount: number;
  onManagerCountChange: (n: number) => void;
}) {
  return (
    <div className="rounded-lg border border-stewart-accent/40 bg-stewart-accent/5 p-5 space-y-4">
      <div className="grid sm:grid-cols-3 gap-3 text-sm">
        <div>
          <p className="text-xs uppercase tracking-wider text-stewart-muted mb-1">
            Annual recovered revenue
          </p>
          <p className="text-xl font-bold font-mono text-stewart-success">
            {fmtMoney(annualRecovered)}
          </p>
        </div>
        <div>
          <label>
            <p className="text-xs uppercase tracking-wider text-stewart-muted mb-1">
              Stewart annual cost &middot; {managerCount} managers
            </p>
            <p className="text-xl font-bold font-mono text-stewart-text">
              {fmtMoney(annualSubscription)}
            </p>
            <input
              type="range"
              min={1}
              max={15}
              step={1}
              value={managerCount}
              onChange={(e) =>
                onManagerCountChange(parseInt(e.target.value, 10))
              }
              className="mt-2 w-full accent-stewart-accent"
            />
            <p className="text-[10px] text-stewart-muted mt-1">
              Phase 2 pricing: ${PHASE_2_MONTHLY_PER_MANAGER}/mgr/mo
            </p>
          </label>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-stewart-muted mb-1">
            ROI multiple
          </p>
          <p className="text-3xl font-bold font-mono text-stewart-accent motion-safe:transition-all">
            {roiMultiple > 0 ? `${roiMultiple.toFixed(1)}×` : "—"}
          </p>
        </div>
      </div>
    </div>
  );
}
