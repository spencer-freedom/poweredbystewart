"use client";

import { useEffect, useRef, useState } from "react";

// Reusable click-to-advance "slide" text box (PowerPoint-style). The
// caller places it beside whatever visual stays put (e.g. a cup).
//
// Self-presenting: the page gets sent as a URL with nobody narrating, so
// the affordance has to be visible. A "Next" button sits under the text
// (clicking the text still advances), arrow keys / space / enter step
// while the stepper is on screen, and the last slide swaps the Next
// button for a "scroll to continue" cue so the viewer knows the beat is
// over. Each swap fades (see the cupFade keyframe in globals.css).

export type Slide = {
  kicker?: string;
  title: string;
  body?: React.ReactNode;
  // Optional hint the parent can act on (e.g. highlight a cup region).
  highlight?: string;
  // Optional override for the title size (e.g. short quotes that should
  // stay on one line in the narrow box).
  titleSize?: string;
};

export function SlideStepper({
  slides,
  onStepChange,
  centered = false,
}: {
  slides: Slide[];
  onStepChange?: (step: number) => void;
  // centered = no visual beside it (text-center, controls centered).
  centered?: boolean;
}) {
  const [step, setStep] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  // Mirror of `step` for the native keydown listener (it must decide
  // synchronously whether to swallow the key).
  const stepRef = useRef(0);
  stepRef.current = step;
  const isFirst = step === 0;
  const isLast = step === slides.length - 1;
  const advance = () => setStep((s) => Math.min(s + 1, slides.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));
  const current = slides[step];

  useEffect(() => {
    onStepChange?.(step);
  }, [step, onStepChange]);

  // Keyboard stepping, only while this stepper is mostly in view so two
  // steppers on one page never both react. Space/Enter are left alone
  // when a button has focus (its own click already advances) and space
  // falls through to the browser's page-scroll on the last slide, so a
  // viewer who keeps tapping space naturally rolls into the next beat.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    let visible = false;
    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
      },
      { threshold: 0.5 }
    );
    io.observe(el);

    const onKey = (e: KeyboardEvent) => {
      if (!visible) return;
      const active = document.activeElement;
      const typing =
        active instanceof HTMLElement &&
        /^(INPUT|TEXTAREA|SELECT|BUTTON|A)$/.test(active.tagName);
      if (e.key === "ArrowRight") {
        e.preventDefault();
        advance();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        back();
      } else if ((e.key === " " || e.key === "Enter") && !typing) {
        if (stepRef.current >= slides.length - 1) return; // let space scroll the page
        e.preventDefault();
        advance();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      io.disconnect();
      window.removeEventListener("keydown", onKey);
    };
  }, [slides.length]);

  const alignText = centered ? "text-center" : "text-center lg:text-left";
  const alignRow = centered
    ? "justify-center"
    : "justify-center lg:justify-start";

  return (
    <div ref={root} className={centered ? "max-w-2xl" : "max-w-md"}>
      <button
        type="button"
        onClick={advance}
        disabled={isLast}
        aria-label={isLast ? undefined : "Continue"}
        className={`block w-full ${alignText} group cursor-pointer disabled:cursor-default`}
      >
        <div key={step} style={{ animation: "cupFade 0.35s ease" }}>
          {current.kicker ? (
            <p className="text-xs uppercase tracking-[0.2em] font-semibold text-stewart-accent mb-4">
              {current.kicker}
            </p>
          ) : null}
          <h2
            className={`${
              current.titleSize ?? "text-3xl sm:text-4xl lg:text-5xl"
            } font-bold text-stewart-text leading-tight`}
          >
            {current.title}
          </h2>
          {current.body ? (
            <div className="mt-8 space-y-5 text-lg sm:text-xl text-stewart-muted leading-relaxed">
              {current.body}
            </div>
          ) : null}
        </div>
      </button>

      <div className={`mt-10 flex items-center gap-5 ${alignRow}`}>
        {/* Back — hidden (but space kept) on the first slide */}
        <button
          type="button"
          onClick={back}
          disabled={isFirst}
          aria-label="Back"
          className={
            "text-sm font-medium transition-colors " +
            (isFirst
              ? "opacity-0 pointer-events-none"
              : "text-stewart-muted hover:text-stewart-text")
          }
        >
          &larr; back
        </button>

        <div className="flex items-center gap-2">
          {slides.map((_, i) => (
            <span
              key={i}
              className={
                "h-1.5 rounded-full transition-all " +
                (i === step ? "w-6 bg-stewart-accent" : "w-1.5 bg-stewart-muted/40")
              }
            />
          ))}
        </div>

        {isLast ? (
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-stewart-muted animate-pulse">
            scroll to continue
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M12 5v14M5 12l7 7 7-7" />
            </svg>
          </span>
        ) : (
          <button
            type="button"
            onClick={advance}
            className="inline-flex items-center gap-1.5 rounded-full border border-stewart-accent/50 bg-stewart-accent/10 px-4 py-1.5 text-sm font-semibold text-stewart-accent hover:bg-stewart-accent/20 transition-colors"
          >
            Next
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
