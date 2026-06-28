"use client";

import { useState } from "react";

// Build #4 coaching heat map. MOCK DATA, framed as forward-looking:
// "this is what one rep's progression looks like once Stewart's been live
// on your floor for 30 days." One developing rep (upside, not a ceiling
// case). Columns are the six real top-level schema sections. Cells are
// L1/L2/L3 maturity. Two-state toggle: 30 days ago → now, with a KPI
// delta panel tied to the progression. Structured so real data can swap
// straight in later.

const SCHEMA_SECTIONS = [
  "Intro",
  "Anchor",
  "Match",
  "Reframe",
  "Qualified",
  "Button-Up",
] as const;

type Level = 1 | 2 | 3;

// Mock rep — a developing setter showing real upside.
const REP = "Marcus T.";
const BEFORE: Level[] = [2, 2, 1, 1, 2, 1];
const AFTER: Level[] = [3, 2, 2, 2, 3, 2];

const KPIS: { label: string; before: string; after: string }[] = [
  { label: "Appointments set", before: "18 / wk", after: "24 / wk" },
  { label: "Set-to-sit rate", before: "31%", after: "38%" },
  { label: "Sales", before: "2 / wk", after: "3 / wk" },
];

const LEVEL_STYLE: Record<Level, { bg: string; label: string }> = {
  1: { bg: "bg-stewart-danger/70", label: "L1" },
  2: { bg: "bg-stewart-warning/70", label: "L2" },
  3: { bg: "bg-stewart-success/70", label: "L3" },
};

export function HeatMap() {
  const [state, setState] = useState<"before" | "after">("before");
  const levels = state === "before" ? BEFORE : AFTER;

  return (
    <div className="rounded-xl border border-stewart-border bg-stewart-card p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <p className="text-xs uppercase tracking-wider font-semibold text-stewart-accent">
            Coaching heat map &middot; {REP}
          </p>
          <p className="text-sm text-stewart-muted mt-1">
            Maturity by schema section. Mock data &mdash; this is what 30
            days of Stewart looks like for one developing rep.
          </p>
        </div>
        <Toggle state={state} onChange={setState} />
      </div>

      {/* Heat grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[560px]">
          <div className="grid grid-cols-6 gap-1.5 mb-1.5">
            {SCHEMA_SECTIONS.map((s) => (
              <div
                key={s}
                className="text-[11px] text-stewart-muted text-center font-medium truncate"
              >
                {s}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-6 gap-1.5">
            {levels.map((lvl, i) => (
              <Cell key={SCHEMA_SECTIONS[i]} level={lvl} prev={BEFORE[i]} state={state} />
            ))}
          </div>
        </div>
      </div>

      <Legend />

      {/* KPI delta panel */}
      <div className="mt-6 grid sm:grid-cols-3 gap-3">
        {KPIS.map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-lg border border-stewart-border bg-stewart-bg/40 p-4"
          >
            <p className="text-xs uppercase tracking-wider text-stewart-muted mb-2">
              {kpi.label}
            </p>
            <p className="font-mono text-lg text-stewart-text">
              <span className={state === "before" ? "text-stewart-text" : "text-stewart-muted"}>
                {kpi.before}
              </span>
              <span className="text-stewart-muted mx-2">&rarr;</span>
              <span className={state === "after" ? "text-stewart-success font-bold" : "text-stewart-muted"}>
                {kpi.after}
              </span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Cell({
  level,
  prev,
  state,
}: {
  level: Level;
  prev: Level;
  state: "before" | "after";
}) {
  const improved = state === "after" && level > prev;
  return (
    <div
      className={
        "relative aspect-[3/2] rounded-md flex items-center justify-center " +
        LEVEL_STYLE[level].bg
      }
    >
      <span className="text-sm font-bold text-stewart-bg">
        {LEVEL_STYLE[level].label}
      </span>
      {improved && (
        <span className="absolute top-1 right-1.5 text-stewart-bg text-xs font-bold">
          &uarr;
        </span>
      )}
    </div>
  );
}

function Toggle({
  state,
  onChange,
}: {
  state: "before" | "after";
  onChange: (s: "before" | "after") => void;
}) {
  return (
    <div className="inline-flex rounded-lg border border-stewart-border overflow-hidden text-sm">
      <button
        onClick={() => onChange("before")}
        className={
          "px-4 py-2 transition-colors " +
          (state === "before"
            ? "bg-stewart-accent text-white font-semibold"
            : "text-stewart-muted hover:text-stewart-text")
        }
      >
        30 days ago
      </button>
      <button
        onClick={() => onChange("after")}
        className={
          "px-4 py-2 transition-colors " +
          (state === "after"
            ? "bg-stewart-accent text-white font-semibold"
            : "text-stewart-muted hover:text-stewart-text")
        }
      >
        Now
      </button>
    </div>
  );
}

function Legend() {
  return (
    <div className="flex items-center gap-4 mt-4 text-xs text-stewart-muted">
      {([1, 2, 3] as Level[]).map((lvl) => (
        <span key={lvl} className="inline-flex items-center gap-1.5">
          <span className={"inline-block w-3 h-3 rounded " + LEVEL_STYLE[lvl].bg} />
          {LEVEL_STYLE[lvl].label}
          <span className="text-stewart-muted/60">
            {lvl === 1 ? "learning" : lvl === 2 ? "consistent" : "mastered"}
          </span>
        </span>
      ))}
    </div>
  );
}
