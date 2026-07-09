"use client";

import { useEffect, useState } from "react";

// "About Spencer" — the warm-up card. Lives in its own full-height
// section BELOW the atom hero: you scroll down to reach it, then you can
// either keep scrolling past it or click it to make it disappear.
// Dismissal persists across sessions via localStorage; once dismissed the
// section renders nothing and the scroll goes straight from atom to pitch.

const DISMISS_KEY = "ion-present-about-dismissed";

export function AboutSpencer() {
  // mounted gate avoids SSR/localStorage hydration mismatch.
  const [mounted, setMounted] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      setDismissed(window.localStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  const dismiss = () => {
    setDismissed(true);
    try {
      window.localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // ignore — dismissal just won't persist
    }
  };

  // Before mount, or once dismissed, reserve no space — scroll flows on.
  if (!mounted || dismissed) return null;

  return (
    <section className="relative bg-black min-h-[100svh] flex items-center justify-center px-6 py-20 border-b border-white/10">
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss About Spencer"
        className="max-w-2xl w-full rounded-2xl border border-white/15 bg-stewart-card/60 backdrop-blur-md p-8 sm:p-10 shadow-2xl cursor-pointer hover:border-white/25 transition-colors text-left"
      >
        <p className="text-2xl sm:text-3xl font-semibold text-stewart-text text-center">
          About Spencer Colby
        </p>
        <p className="mt-3 text-center text-sm text-stewart-muted">
          Thirteen years on sales floors — then he built the AI.
        </p>

        <ul className="mt-8 space-y-3">
          {[
            "13 years in car sales — 6 of them in management at Brent Brown Toyota.",
            "Part of the team that took Brent Brown Toyota from #6 of 7 Utah Toyota dealers to #1 in the state (2017).",
            "Wrote the policies & procedures for the BBT sales floor — Stewart is the digital version of what he did by hand.",
            "8 years self-employed since 2018 — multiple income streams, brick-and-mortar and e-commerce.",
            "Spent a year+ building AI into his own businesses before building it for anyone else — practitioner, not theorist.",
            "Building AI-powered software for Ion since Nov 2025 — Kenny asked for it on a bear hunt; six months of building since.",
          ].map((b) => (
            <li key={b} className="flex gap-3 text-base text-stewart-text leading-relaxed">
              <span className="text-stewart-accent shrink-0 mt-1">•</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>

        <p className="mt-8 text-center text-xs text-stewart-muted/70">
          Click anywhere to continue
        </p>
      </button>
    </section>
  );
}
