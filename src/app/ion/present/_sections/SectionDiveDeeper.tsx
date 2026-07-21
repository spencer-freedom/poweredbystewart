"use client";

import { useState } from "react";
import Link from "next/link";
import { SegmentedCup } from "../_components/CupOfWater.client";
import { SlideStepper, type Slide } from "../_components/SlideStepper.client";

// The sectioned-cup beat. Click-by-click: the cup highlights the air (can't
// be sold) and the skim (don't want to sell); then each click reveals a
// reason — the reason text boxes STACK in one view as they're added, and the
// matching cup segment lights up + gets name-tagged (Utility bill, etc.).
// Grounded in Ion's own script line: "What interested you in solar? - Expand
// into that to validate."

// The cup's three wanted segments, top → bottom, matching seg0..seg2.
const SEGMENT_LABELS = ["Utility bill", "Reliability", "New usage"];

const REASONS = [
  {
    label: "Utility bill",
    quote: "My utility bill is too high.",
    move: "Since your utility bill is high, we have programs to add solar to your home and lower your utility cost. Let's get qualified and scheduled with my specialist.",
  },
  {
    label: "Reliability",
    quote: "We keep having rolling blackouts.",
    move: "Since the grid keeps letting you down — no AC in the heat, can't charge your phone — solar and a battery keep your home running when everyone else goes dark. Let's get you scheduled.",
  },
  {
    label: "New usage",
    quote: "Our usage just jumped.",
    move: "Since your usage just jumped — new EV, a pool, a growing family — solar sizes to your new normal so the bill doesn't run away. Let's get you scheduled.",
  },
];

function ReasonBlock({ n }: { n: number }) {
  const r = REASONS[n];
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.15em] font-semibold text-stewart-accent">
        Reason {n + 1} · {r.label}
      </p>
      <p className="mt-0.5 text-base text-stewart-text font-medium">
        &ldquo;{r.quote}&rdquo;
      </p>
      <p className="mt-0.5 text-sm text-stewart-muted leading-snug">
        <span className="text-stewart-accent font-semibold">
          Coachable moment:
        </span>{" "}
        &ldquo;{r.move}&rdquo;
      </p>
    </div>
  );
}

const DIVE_SLIDES: Slide[] = [
  { title: "Let's dive deeper into the cup of water." },
  { title: "This cup of water represents your leads — your customers." },
  {
    title: "These are the people who can't be sold.",
    body: <p>DQ, no interest, never answer the phone, etc.</p>,
    highlight: "empty",
  },
  {
    title: "The water is all of your customers who can be sold.",
    highlight: "water",
  },
  {
    title: "Some of them, Ion doesn't want to sell to.",
    highlight: "skim",
  },
  {
    title: "The rest each want it — for different reasons.",
    body: (
      <>
        <p>Find the reason they already have, and sell to that.</p>
        <div className="mt-5 rounded-lg border border-stewart-accent/30 bg-stewart-accent/5 px-4 py-3">
          <p className="text-xs uppercase tracking-wider font-semibold text-stewart-accent">
            Your script already says it
          </p>
          <p className="mt-1 text-base text-stewart-text">
            &ldquo;What interested you in solar? —{" "}
            <em>Expand into that to validate.</em>&rdquo;
          </p>
          <Link
            href="/ion/present/script#s-why"
            className="mt-1 inline-block text-xs text-stewart-accent hover:underline"
          >
            see it in your script &rarr;
          </Link>
        </div>
      </>
    ),
  },
  // Reason slides — the stack grows by one each click; each highlights its
  // segment (seg0..seg2), and the cup name-tags sections as they're revealed.
  ...REASONS.map((_, i) => ({
    title: "Speak to the reason they gave you.",
    highlight: `seg${i}`,
    body: (
      <div className="space-y-4">
        {REASONS.slice(0, i + 1).map((_, j) => (
          <ReasonBlock key={j} n={j} />
        ))}
      </div>
    ),
  })),
  {
    title: "That's selling. Not telling.",
    body: (
      <p>
        You find the reason they{" "}
        <span className="text-stewart-text font-medium">already</span> want it
        — and speak to that.
      </p>
    ),
  },
];

export function SectionDiveDeeper() {
  const [step, setStep] = useState(0);
  const highlight = DIVE_SLIDES[step]?.highlight;

  // Reveal the cup's segment labels progressively — up to whichever seg the
  // current slide is highlighting.
  const segMatch = highlight?.match(/^seg(\d)$/);
  const labels = segMatch
    ? SEGMENT_LABELS.slice(0, Number(segMatch[1]) + 1)
    : undefined;

  return (
    <section className="relative bg-black min-h-[100svh] flex items-center justify-center px-6 py-20 border-b border-white/10">
      <div className="flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-20 max-w-5xl">
        <SegmentedCup highlight={highlight} labels={labels} />
        <SlideStepper slides={DIVE_SLIDES} onStepChange={setStep} />
      </div>
    </section>
  );
}
