"use client";

import { useState } from "react";
import { Field, Reading } from "./IonMath.client";

// The rep tier, in per-1,000-calls units. One lever — sets per 1,000 dials —
// because that's the number that moves when a rep trains on their own calls
// daily, and it's the number Ion already tracks. Every input is illustrative
// until Kenny's real figures go in; the arithmetic is the arithmetic.

const DEFAULTS = {
  dialsPerMonth: 60000, // 35 setters × ~80 dials/day × ~21 days — illustrative
  setsPer1000: 5,
  liftPer1000: 0.5,
  sitRate: 0.6,
  closeRate: 0.25,
  margin: 8000,
};
// Phase 3 at full rollout — 35 reps × $125 / month (see /ion/sow).
const REP_TIER_MONTHLY = 35 * 125;

const money = (n: number) =>
  n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const num = (n: number) => Math.round(n).toLocaleString();

export function RepLift() {
  const [dials, setDials] = useState(DEFAULTS.dialsPerMonth);
  const [sets, setSets] = useState(DEFAULTS.setsPer1000);
  const [lift, setLift] = useState(DEFAULTS.liftPer1000);
  const [sit, setSit] = useState(DEFAULTS.sitRate);
  const [close, setClose] = useState(DEFAULTS.closeRate);
  const [margin, setMargin] = useState(DEFAULTS.margin);

  const setsNow = (dials / 1000) * sets;
  const setsAfter = (dials / 1000) * (sets + lift);
  const closesNow = setsNow * sit * close;
  const closesAfter = setsAfter * sit * close;
  const extraCloses = closesAfter - closesNow;
  const extraMargin = extraCloses * margin;
  const pct = sets > 0 ? lift / sets : 0;

  return (
    <div className="rounded-xl border border-stewart-border bg-stewart-card overflow-hidden">
      <div className="px-5 py-6 sm:px-8 border-b border-stewart-border">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <p className="text-sm font-semibold text-stewart-text">Sets per 1,000 dials</p>
          <p className="font-mono text-3xl font-bold text-stewart-accent">
            {sets} <span className="text-stewart-muted text-xl">→</span> {(sets + lift).toFixed(1).replace(/\.0$/, "")}
          </p>
        </div>
        <input
          type="range"
          min={0}
          max={3}
          step={0.25}
          value={lift}
          onChange={(e) => setLift(Number(e.target.value))}
          className="mt-4 w-full accent-[#3b82f6]"
          aria-label="Lift in sets per 1,000 dials"
        />
        <div className="mt-1 flex justify-between text-[11px] font-mono text-stewart-muted">
          <span>+0</span>
          <span>+1</span>
          <span>+2</span>
          <span>+3</span>
        </div>
        <p className="mt-2 text-xs text-stewart-muted">
          A {Math.round(pct * 100)}% lift in conversion. Same leads, same dials, same headcount.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-stewart-border">
        <Reading
          kicker="Kenny reads it as"
          big={`+${num(setsAfter - setsNow)} sets`}
          small={`a month, on ${num(dials)} dials. ${num(extraCloses)} more installs at ${Math.round(sit * 100)}% sit and ${Math.round(close * 100)}% close.`}
        />
        <Reading
          kicker="The VP reads it as"
          big={money(extraMargin)}
          small={`a month in margin. ${money(extraMargin * 12)} a year, from leads already paid for.`}
          accent
        />
      </div>

      <div className="px-5 py-5 sm:px-8 border-t border-stewart-border bg-stewart-bg/40">
        <p className="text-base text-stewart-text leading-relaxed">
          The rep tier at full rollout &mdash; 35 reps &mdash; is{" "}
          <span className="font-mono font-bold">{money(REP_TIER_MONTHLY)}</span> a month.{" "}
          <span className="text-stewart-accent font-semibold">
            {extraMargin > 0 ? `${((REP_TIER_MONTHLY / extraMargin) * 100).toFixed(1)}%` : "—"} of that lift.
          </span>{" "}
          And every point of it is on the tape: closes per 1,000, per rep, against their own baseline.
        </p>
      </div>

      <details className="px-5 py-4 sm:px-8 border-t border-stewart-border">
        <summary className="cursor-pointer text-xs uppercase tracking-wider font-semibold text-stewart-muted hover:text-stewart-text">
          Your numbers &middot; dials, sets, sit, close, margin
        </summary>
        <div className="mt-4 grid sm:grid-cols-3 gap-4">
          <Field label="Dials per month" value={dials} min={5000} max={200000} step={1000} onChange={setDials} display={num} />
          <Field label="Sets per 1,000 dials today" value={sets} min={1} max={20} step={0.5} onChange={setSets} display={(v) => `${v}`} />
          <Field label="Set → sit" value={sit} min={0.2} max={1} step={0.05} onChange={setSit} display={(v) => `${Math.round(v * 100)}%`} />
          <Field label="Sit → close" value={close} min={0.05} max={0.6} step={0.01} onChange={setClose} display={(v) => `${Math.round(v * 100)}%`} />
          <Field label="Margin per install" value={margin} min={2000} max={20000} step={250} onChange={setMargin} display={money} />
        </div>
        <p className="mt-3 text-xs text-stewart-muted italic">
          Every default here is illustrative. Put Ion&apos;s in &mdash; sets per 1,000 and sit and close are numbers you already have.
        </p>
      </details>
    </div>
  );
}
