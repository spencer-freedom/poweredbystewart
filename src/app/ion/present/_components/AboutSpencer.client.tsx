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
      {/*
        ABOUT_SPENCER_COPY — per Spencer, this box says only "About
        Spencer" for now. When the final copy is ready (bear-hunt origin +
        Brent Brown #5→#1 + 13-year sales DNA), add it here; keep the
        click-to-dismiss button wrapper.
        <!-- ABOUT_SPENCER_COPY -->
      */}
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss About Spencer"
        className="max-w-xl w-full rounded-2xl border border-white/15 bg-stewart-card/60 backdrop-blur-md p-10 sm:p-12 shadow-2xl cursor-pointer hover:border-white/25 transition-colors"
      >
        <p className="text-2xl sm:text-3xl font-semibold text-stewart-text text-center">
          About Spencer
        </p>
      </button>
    </section>
  );
}
