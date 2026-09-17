"use client";

import { useState } from "react";

// The math, in Ion's numbers. One lever — extra appointments per setter
// per week — read two ways at once: appointments (Kenny) and margin (the
// VP). Defaults are the planning figures from the design-partner plan
// (35 setters, 25% close from sit, ~$8k margin per install, 4 weeks);
// every input is editable so the room can put its own numbers in.

const DEFAULTS = {
  setters: 35,
  extraPerWeek: 1,
  closeRate: 0.25,
  margin: 8000,
};
const WEEKS_PER_MONTH = 4;
// Phase 2 at full coverage — 6 managers × $1,500 / month (see /ion/sow).
const STEWART_MONTHLY = 9000;

const money = (n: number) =>
  n.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
const num = (n: number) => Math.round(n).toLocaleString();

export function IonMath() {
  const [setters, setSetters] = useState(DEFAULTS.setters);
  const [extra, setExtra] = useState(DEFAULTS.extraPerWeek);
  const [closeRate, setCloseRate] = useState(DEFAULTS.closeRate);
  const [margin, setMargin] = useState(DEFAULTS.margin);

  const apptsPerMonth = setters * extra * WEEKS_PER_MONTH;
  const installsPerMonth = apptsPerMonth * closeRate;
  const marginPerMonth = installsPerMonth * margin;
  const stewartShare = marginPerMonth > 0 ? STEWART_MONTHLY / marginPerMonth : 0;

  return (
    <div className="rounded-xl border border-stewart-border bg-stewart-card overflow-hidden">
      {/* The lever */}
      <div className="px-5 py-6 sm:px-8 border-b border-stewart-border">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <p className="text-sm font-semibold text-stewart-text">
            Extra appointments per setter, per week
          </p>
          <p className="font-mono text-3xl font-bold text-stewart-accent">
            {extra.toFixed(2).replace(/\.?0+$/, "")}
          </p>
        </div>
        <input
          type="range"
          min={0.25}
          max={3}
          step={0.25}
          value={extra}
          onChange={(e) => setExtra(Number(e.target.value))}
          className="mt-4 w-full accent-[#3b82f6]"
          aria-label="Extra appointments per setter per week"
        />
        <div className="mt-1 flex justify-between text-[11px] font-mono text-stewart-muted">
          <span>¼</span>
          <span>1</span>
          <span>2</span>
          <span>3</span>
        </div>
      </div>

      {/* Two readings of the same slider */}
      <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-stewart-border">
        <Reading
          kicker="Kenny reads it as"
          big={`${num(apptsPerMonth)} appointments`}
          small={`a month. ${num(installsPerMonth)} installs at a ${Math.round(closeRate * 100)}% close.`}
        />
        <Reading
          kicker="The VP reads it as"
          big={`${money(marginPerMonth)}`}
          small={`a month in margin. ${money(marginPerMonth * 12)} a year.`}
          accent
        />
      </div>

      {/* Stewart against it */}
      <div className="px-5 py-5 sm:px-8 border-t border-stewart-border bg-stewart-bg/40">
        <p className="text-base text-stewart-text leading-relaxed">
          Stewart at full coverage &mdash; all six managers &mdash; is{" "}
          <span className="font-mono font-bold">{money(STEWART_MONTHLY)}</span>{" "}
          a month.{" "}
          <span className="text-stewart-accent font-semibold">
            {stewartShare > 0 ? `${(stewartShare * 100).toFixed(1)}%` : "—"} of
            that lift.
          </span>{" "}
          And the leads are already bought &mdash; this is return on calls
          you&apos;re paying for either way.
        </p>
      </div>

      {/* The other inputs — editable, out of the way */}
      <details className="px-5 py-4 sm:px-8 border-t border-stewart-border">
        <summary className="cursor-pointer text-xs uppercase tracking-wider font-semibold text-stewart-muted hover:text-stewart-text">
          Your numbers &middot; setters, close rate, margin
        </summary>
        <div className="mt-4 grid sm:grid-cols-3 gap-4">
          <Field label="Setters" value={setters} min={5} max={100} step={1} onChange={setSetters} display={num} />
          <Field label="Close rate from sit" value={closeRate} min={0.05} max={0.6} step={0.01} onChange={setCloseRate} display={(v) => `${Math.round(v * 100)}%`} />
          <Field label="Margin per install" value={margin} min={2000} max={20000} step={250} onChange={setMargin} display={money} />
        </div>
        <p className="mt-3 text-xs text-stewart-muted italic">
          Defaults are the planning figures we&apos;ve been using with Ion. Put
          in yours &mdash; the math is the math.
        </p>
      </details>
    </div>
  );
}

export function Reading({
  kicker,
  big,
  small,
  accent,
}: {
  kicker: string;
  big: string;
  small: string;
  accent?: boolean;
}) {
  return (
    <div className={"px-5 py-6 sm:px-8 " + (accent ? "bg-stewart-accent/5" : "")}>
      <p
        className={
          "text-[11px] uppercase tracking-[0.15em] font-semibold " +
          (accent ? "text-stewart-accent" : "text-stewart-muted")
        }
      >
        {kicker}
      </p>
      <p className="mt-2 font-mono text-2xl sm:text-3xl font-bold text-stewart-text leading-tight">
        {big}
      </p>
      <p className="mt-1 text-sm text-stewart-muted">{small}</p>
    </div>
  );
}

export function Field({
  label,
  value,
  min,
  max,
  step,
  onChange,
  display,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  display: (v: number) => string;
}) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between text-xs text-stewart-muted">
        <span>{label}</span>
        <span className="font-mono text-stewart-text">{display(value)}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1.5 w-full accent-[#3b82f6]"
      />
    </label>
  );
}
