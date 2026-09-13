"use client";

import { useState } from "react";

// The script as a funnel. Each row is a section in script order. The bar's
// WIDTH is how many calls were still on the line when that section came up
// (ran it + skipped it); the filled part is how many actually ran it. The
// gap between one row and the next is the drop-off — where calls die. Same
// picture for the floor and for any rep. Counts, not grades.

export type SectionCounts = { asked: number; skipped: number; not_reached: number };
export type FunnelInput = {
  calls: number;
  sections: Record<string, SectionCounts>;
  // "Still on the line" per section: reached this section OR any later one.
  // Monotonic, so a section reps skip doesn't look like calls ending. When
  // absent, width falls back to asked + skipped.
  on_line?: Record<string, number>;
};

export const FUNNEL_SECTIONS: { key: string; label: string; short: string }[] = [
  { key: "intro_legitimacy", label: "Intro — who we are, why we're calling", short: "Intro" },
  { key: "interest_question", label: "“What has you interested in solar?”", short: "Interest" },
  { key: "address_homeowner", label: "Address & homeowner", short: "Address" },
  { key: "co_owner", label: "Anyone else on the title?", short: "Co-owner" },
  { key: "roof", label: "Roof type & age", short: "Roof" },
  { key: "utility_company", label: "Utility company", short: "Utility" },
  { key: "bill_amount", label: "Average monthly bill", short: "Bill $" },
  { key: "tax_credit_qualifier", label: "Income tax + credit qualifier", short: "Qualifier" },
  { key: "military", label: "Military", short: "Military" },
  { key: "prior_design", label: "Seen a solar design before?", short: "Prior design" },
  { key: "bill_collection", label: "Get the bill — mail/online, text/email", short: "Bill doc" },
  { key: "appointment_set", label: "Appointment — day and time", short: "Appt" },
  { key: "button_up", label: "Button-up", short: "Button-up" },
];

export function ScriptFunnel({
  floor,
  reps,
  compact = false,
  title,
}: {
  floor: FunnelInput;
  reps?: Record<string, FunnelInput>;
  compact?: boolean;
  title?: string;
}) {
  const [who, setWho] = useState<string>("__floor");
  const data = who === "__floor" || !reps ? floor : reps[who] ?? floor;
  const repNames = reps ? Object.keys(reps).sort((a, b) => (reps[b].calls || 0) - (reps[a].calls || 0)) : [];

  const onLine = (key: string, c: SectionCounts) => data.on_line?.[key] ?? c.asked + c.skipped;
  const rows = FUNNEL_SECTIONS.map((s, i) => {
    const c = data.sections[s.key] ?? { asked: 0, skipped: 0, not_reached: 0 };
    const reached = onLine(s.key, c);
    const prev = i > 0 ? (() => { const pk = FUNNEL_SECTIONS[i - 1].key; const p = data.sections[pk]; return p ? onLine(pk, p) : reached; })() : data.calls;
    return { ...s, ...c, reached, dropped: Math.max(0, prev - reached), ranRate: reached ? c.asked / reached : 0 };
  });
  const max = Math.max(data.calls, 1);
  const biggestDrop = [...rows].sort((a, b) => b.dropped - a.dropped)[0];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div>
          {title ? <p className="text-xs uppercase tracking-[0.2em] font-semibold text-stewart-muted">{title}</p> : null}
          <p className="text-sm text-stewart-muted mt-1">
            Width = calls still on the line at that point (reached it, or anything after it). Filled = ran it. The step down between rows is where calls end; a narrow fill on a wide bar is a section reps skip.
          </p>
        </div>
        {reps ? (
          <label className="text-xs text-stewart-muted flex items-center gap-2">
            show
            <select value={who} onChange={(e) => setWho(e.target.value)} className="rounded border border-stewart-border bg-stewart-card px-2 py-1 text-sm text-stewart-text">
              <option value="__floor">Whole floor ({floor.calls})</option>
              {repNames.map((r) => (
                <option key={r} value={r}>{r} ({reps[r].calls})</option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      <ol className={compact ? "space-y-1" : "space-y-1.5"}>
        {rows.map((r) => {
          const w = (100 * r.reached) / max;
          const fill = r.reached ? (100 * r.asked) / r.reached : 0;
          const inset = (100 - w) / 2;
          return (
            <li key={r.key} title={`still on the line: ${r.reached} · ran it: ${r.asked} · skipped: ${r.skipped} · ended before this: ${r.dropped}`}
                className="grid grid-cols-[minmax(0,7.5rem)_minmax(0,1fr)_minmax(0,7rem)] sm:grid-cols-[minmax(0,17rem)_minmax(0,1fr)_minmax(0,9rem)] items-center gap-3">
              <span className={"text-stewart-text leading-tight " + (compact ? "text-xs" : "text-sm")}>
                <span className="sm:hidden">{r.short}</span><span className="hidden sm:inline">{r.label}</span>
              </span>
              <div className={"relative w-full " + (compact ? "h-4" : "h-5")}>
                <div className="absolute inset-y-0 rounded-sm bg-white/10" style={{ left: `${inset}%`, width: `${w}%` }}>
                  <div className="h-full rounded-sm bg-stewart-accent/75" style={{ width: `${fill}%` }} />
                </div>
              </div>
              <span className={"font-mono text-right text-stewart-text " + (compact ? "text-[11px]" : "text-xs")}>
                {r.reached} <span className="text-stewart-muted">on the line</span>
                {r.dropped > 0 ? <span className="block text-stewart-warning">−{r.dropped} ended</span> : null}
              </span>
            </li>
          );
        })}
      </ol>

      {biggestDrop && biggestDrop.dropped > 0 ? (
        <p className="mt-4 text-sm text-stewart-muted">
          Biggest drop: <span className="text-stewart-warning font-semibold">{biggestDrop.dropped} calls</span> end right before{" "}
          <span className="text-stewart-text">{biggestDrop.label}</span>
          {who !== "__floor" ? ` for ${who}` : " floor-wide"}. Of the calls that get to it,{" "}
          <span className="text-stewart-text">{Math.round(biggestDrop.ranRate * 100)}%</span> run it.
        </p>
      ) : null}
    </div>
  );
}
