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
        className="group max-w-xl w-full text-left rounded-2xl border border-white/15 bg-stewart-card/60 backdrop-blur-md p-8 sm:p-10 shadow-2xl cursor-pointer hover:border-white/25 transition-colors"
      >
        <p className="text-xs uppercase tracking-[0.2em] font-semibold text-stewart-accent mb-4">
          About Spencer
        </p>

        {/*
          ABOUT_SPENCER_COPY — placeholder. Spencer provides the final
          about-Spencer copy (distilled from the bear-hunt origin + Brent
          Brown #5→#1 + the 13-year sales-DNA write-up). Replace the
          paragraphs below; keep the dismiss affordance and markup shape.
          <!-- ABOUT_SPENCER_COPY -->
        */}
        <div className="space-y-4 text-base sm:text-lg text-stewart-text leading-relaxed">
          <p>
            [ABOUT_SPENCER_COPY placeholder — Spencer&apos;s about-me copy
            lands here. A few sentences on who built Stewart and why:
            thirteen years on the floor, the bear-hunt origin, and the
            #5&rarr;#1 turnaround that taught him what good actually looks
            like.]
          </p>
          <p className="text-stewart-muted text-base">
            This is the warm-up frame, not the pitch. The pitch is below.
          </p>
        </div>

        <p className="mt-8 text-sm font-medium text-stewart-muted">
          Keep scrolling, or{" "}
          <span className="text-stewart-accent group-hover:underline">
            click to dismiss
          </span>
          .
        </p>
      </button>
    </section>
  );
}
