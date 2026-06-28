"use client";

import { useState } from "react";

// Daily Morning View — the manager surface. DESIGN DISCIPLINE: boring,
// not flashy. This is an extension of a CRM, not a futuristic AI
// dashboard. A manager opens it and thinks "oh, I'd actually use this,"
// not "cool AI." Mobile-first (Spencer can hold up his phone). Mock data;
// swap real calls + wire the clip player for V2.

type Call = {
  rep: string;
  time: string;
  outcome: string;
  summary: string;
};

const CALLS: Call[] = [
  {
    rep: "Marcus T.",
    time: "8:42 AM",
    outcome: "Hot — comparing bids",
    summary:
      "Buyer said another company is coming Thursday. Ready and nervous — needs reassurance, not a re-quote. Worth a 1-on-1.",
  },
  {
    rep: "Dani R.",
    time: "9:15 AM",
    outcome: "Bill captured, not reframed",
    summary:
      "Got the power bill but moved past it. The reframe was right there. Two minutes of coaching fixes this.",
  },
  {
    rep: "Marcus T.",
    time: "10:03 AM",
    outcome: "Strong close",
    summary:
      "Clean qualifier into button-up. Use this one as a what-good-looks-like example for the team.",
  },
  {
    rep: "Priya S.",
    time: "11:28 AM",
    outcome: "Email-quote refusal",
    summary:
      "Prospect asked for a quote by email and the call ended on policy. This one read as a ready buyer — flag for recovery.",
  },
];

export function ManagerBrief() {
  const [coached, setCoached] = useState<Set<number>>(new Set());

  const toggle = (i: number) =>
    setCoached((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <header className="mb-5">
        <p className="text-xs uppercase tracking-wider text-stewart-muted">
          Daily Morning View
        </p>
        <h1 className="text-xl font-bold text-stewart-text mt-1">
          Today you have 4 calls worth your time.
        </h1>
        <p className="text-sm text-stewart-muted mt-1">
          {coached.size} of {CALLS.length} coached
        </p>
      </header>

      <ul className="space-y-3">
        {CALLS.map((call, i) => {
          const done = coached.has(i);
          return (
            <li
              key={i}
              className={
                "rounded-lg border bg-stewart-card p-4 transition-colors " +
                (done ? "border-stewart-success/40 opacity-70" : "border-stewart-border")
              }
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-semibold text-stewart-text">
                  {call.rep}
                </span>
                <span className="text-xs font-mono text-stewart-muted">
                  {call.time}
                </span>
              </div>
              <p className="mt-1 text-xs uppercase tracking-wider text-stewart-accent font-medium">
                {call.outcome}
              </p>
              <p className="mt-2 text-sm text-stewart-muted leading-relaxed">
                {call.summary}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-stewart-border text-xs text-stewart-muted hover:text-stewart-text hover:border-stewart-accent/40 transition-colors"
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  Play clip
                </button>
                <button
                  type="button"
                  onClick={() => toggle(i)}
                  className={
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs transition-colors " +
                    (done
                      ? "border-stewart-success/50 bg-stewart-success/10 text-stewart-success"
                      : "border-stewart-border text-stewart-muted hover:text-stewart-text")
                  }
                >
                  {done ? "✓ Coached" : "Mark as coached"}
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <p className="mt-6 text-[11px] text-stewart-muted italic leading-relaxed">
        Sample data. Each morning Stewart surfaces only the calls worth a
        manager&apos;s time — the rest stay out of the way.
      </p>
    </div>
  );
}
