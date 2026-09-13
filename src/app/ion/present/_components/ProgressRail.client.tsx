"use client";

import { useEffect, useState } from "react";

// Where-am-I for a viewer walking the pitch alone. Desktop: a vertical
// rail of dots on the right edge, the active beat labeled, any dot
// clickable. Phone: a hairline progress bar under the sticky header
// (no room for a rail). Beats are located by element id — every section
// on /ion/present carries one.

export type Beat = { id: string; label: string };

export function ProgressRail({ beats }: { beats: Beat[] }) {
  const [active, setActive] = useState(0);
  const [fraction, setFraction] = useState(0);

  useEffect(() => {
    const els = beats
      .map((b) => document.getElementById(b.id))
      .filter((el): el is HTMLElement => el !== null);
    if (!els.length) return;

    // Active beat = the section whose box covers the viewport's midline.
    const pick = () => {
      const mid = window.innerHeight / 2;
      let idx = 0;
      els.forEach((el, i) => {
        const r = el.getBoundingClientRect();
        if (r.top <= mid) idx = i;
      });
      setActive(idx);
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      setFraction(max > 0 ? Math.min(1, window.scrollY / max) : 0);
    };
    pick();
    window.addEventListener("scroll", pick, { passive: true });
    window.addEventListener("resize", pick);
    return () => {
      window.removeEventListener("scroll", pick);
      window.removeEventListener("resize", pick);
    };
  }, [beats]);

  const go = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      {/* Phone: hairline under the sticky header */}
      <div className="lg:hidden fixed top-[49px] inset-x-0 z-40 h-0.5 bg-white/5 pointer-events-none">
        <div
          className="h-full bg-stewart-accent transition-[width] duration-150"
          style={{ width: `${fraction * 100}%` }}
        />
      </div>

      {/* Desktop: dot rail on the right */}
      <nav
        aria-label="Sections"
        className="hidden lg:flex fixed right-5 top-1/2 -translate-y-1/2 z-40 flex-col items-end gap-2.5"
      >
        {beats.map((b, i) => {
          const on = i === active;
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => go(b.id)}
              className="group flex items-center gap-3"
              aria-current={on ? "step" : undefined}
              aria-label={b.label}
            >
              <span
                className={
                  "text-[11px] uppercase tracking-[0.15em] font-semibold transition-opacity " +
                  (on
                    ? "text-stewart-accent opacity-100"
                    : "text-stewart-muted opacity-0 group-hover:opacity-100")
                }
              >
                {b.label}
              </span>
              <span
                className={
                  "block rounded-full transition-all " +
                  (on
                    ? "h-2.5 w-2.5 bg-stewart-accent"
                    : i < active
                    ? "h-1.5 w-1.5 bg-stewart-accent/50"
                    : "h-1.5 w-1.5 bg-stewart-muted/40 group-hover:bg-stewart-muted")
                }
              />
            </button>
          );
        })}
        <span className="mt-2 mr-[-2px] text-[10px] font-mono text-stewart-muted/70">
          {active + 1}/{beats.length}
        </span>
      </nav>
    </>
  );
}
