"use client";

import { useState } from "react";
import { AudioClip } from "../../(public)/_components/AudioClip.client";
import { BRIEF_CALLS, type BriefCall } from "./briefData";

// Daily Morning View — the manager surface. DESIGN DISCIPLINE: boring,
// not flashy. This is an extension of a CRM, not a futuristic AI
// dashboard. A manager opens it and thinks "oh, I'd actually use this,"
// not "cool AI." Mobile-first (it's embedded in a phone frame on
// /ion/present and stands alone on a real phone). Four real calls; the
// clip button plays the actual moment.

const FLAG_STYLE: Record<BriefCall["flag"], { label: string; cls: string }> = {
  recover: { label: "Recover", cls: "text-stewart-warning" },
  fragile: { label: "Booked · fragile", cls: "text-stewart-accent" },
  stalled: { label: "Stalled", cls: "text-stewart-danger" },
};

export function ManagerBrief() {
  const [coached, setCoached] = useState<Set<string>>(new Set());

  const toggle = (id: string) =>
    setCoached((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const totalMinutes = BRIEF_CALLS.reduce((n, c) => n + c.minutes, 0);
  const clipSeconds = BRIEF_CALLS.reduce((n, c) => n + (c.end - c.start), 0);

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
          {coached.size} of {BRIEF_CALLS.length} coached &middot; {totalMinutes}{" "}
          min of calls, {Math.round(clipSeconds / 60)} min of listening
        </p>
      </header>

      <ul className="space-y-3">
        {BRIEF_CALLS.map((call) => {
          const done = coached.has(call.callId);
          const flag = FLAG_STYLE[call.flag];
          return (
            <li
              key={call.callId}
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
                  {call.minutes} min &middot; {call.ts}
                </span>
              </div>
              <p className={"mt-1 text-xs uppercase tracking-wider font-medium " + flag.cls}>
                {flag.label}
              </p>
              <p className="mt-1.5 text-sm font-semibold text-stewart-text leading-snug">
                {call.headline}
              </p>
              <p className="mt-1.5 text-sm text-stewart-muted leading-relaxed">
                {call.why}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <AudioClip
                  callId={call.callId}
                  startSec={call.start}
                  endSec={call.end}
                  label="Play the moment"
                />
                <button
                  type="button"
                  onClick={() => toggle(call.callId)}
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
        Four real calls from the 300. Each morning Stewart surfaces only the
        ones worth a manager&apos;s time &mdash; the rest stay out of the way.
      </p>
    </div>
  );
}
