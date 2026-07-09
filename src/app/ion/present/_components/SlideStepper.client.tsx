"use client";

import { useEffect, useState } from "react";

// Reusable click-to-advance "slide" text box (PowerPoint-style). The
// caller places it beside whatever visual stays put (e.g. a cup). Clicking
// the text advances; a separate "back" control steps backward in case of a
// mis-click. Step dots + a "continue" hint show progress. Each swap fades
// (see the cupFade keyframe in globals.css).

export type Slide = {
  kicker?: string;
  title: string;
  body?: React.ReactNode;
  // Optional hint the parent can act on (e.g. highlight a cup region).
  highlight?: string;
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
  const isFirst = step === 0;
  const isLast = step === slides.length - 1;
  const advance = () => setStep((s) => Math.min(s + 1, slides.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));
  const current = slides[step];

  useEffect(() => {
    onStepChange?.(step);
  }, [step, onStepChange]);

  const alignText = centered ? "text-center" : "text-center lg:text-left";
  const alignRow = centered
    ? "justify-center"
    : "justify-center lg:justify-start";

  return (
    <div className={centered ? "max-w-2xl" : "max-w-md"}>
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
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-stewart-text leading-tight">
            {current.title}
          </h2>
          {current.body ? (
            <div className="mt-8 space-y-5 text-lg sm:text-xl text-stewart-muted leading-relaxed">
              {current.body}
            </div>
          ) : null}
        </div>
      </button>

      <div className={`mt-10 flex items-center gap-4 ${alignRow}`}>
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
      </div>
    </div>
  );
}
