"use client";

import { useState } from "react";
import { SegmentedCup } from "../_components/CupOfWater.client";
import { SlideStepper, type Slide } from "../_components/SlideStepper.client";

// The sectioned-cup beat. The text box advances click-by-click; the cup
// highlights whatever the current slide is talking about (via `highlight`):
//   empty = air (can't be sold) · skim = slate (don't want to sell)
//   seg0..seg3 = the four wanted reason-to-buy sections (top → bottom)
//
// Each reason follows Spencer's format: the PAIN (title) → the WATER
// parallel → THE MOVE (present the pain as the reason to buy → the sale).
// Word tracks are drafts in Spencer's voice — refine freely.

// Small helper so every reason slide body reads the same.
function Reason({ water, move }: { water: string; move: string }) {
  return (
    <>
      <p className="text-sm italic text-stewart-muted/80">In water: {water}</p>
      <p className="text-base text-stewart-text">
        <span className="text-stewart-accent font-semibold">The move:</span>{" "}
        &ldquo;{move}&rdquo;
      </p>
    </>
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
  { title: "The water is all of your customers who can be sold." },
  {
    title: "Some of them, Ion doesn't want to sell to.",
    highlight: "skim",
  },
  {
    title: "The rest each want it — for different reasons.",
    body: <p>Find the reason they already have, and sell to that.</p>,
  },
  {
    kicker: "Reason 1 · Save money",
    title: "“My utility bill is too high.”",
    titleSize: "text-2xl sm:text-3xl",
    highlight: "seg0",
    body: (
      <Reason
        water="they're tired of overpaying for every bottle."
        move="Since your bill is already high, we have programs that add solar to your home and lower it. Let's get you scheduled with my specialist."
      />
    ),
  },
  {
    kicker: "Reason 2 · Reliability",
    title: "“The power keeps going out.”",
    titleSize: "text-2xl sm:text-3xl",
    highlight: "seg1",
    body: (
      <Reason
        water="they're thirsty and the tap runs dry right when they reach for it."
        move="Since the grid keeps letting you down — no AC in the heat, can't charge your phone — solar and a battery keep your home running when everyone else goes dark. Let's get you scheduled."
      />
    ),
  },
  {
    kicker: "Reason 3 · New usage",
    title: "“Our usage just jumped.”",
    titleSize: "text-2xl sm:text-3xl",
    highlight: "seg2",
    body: (
      <Reason
        water="they just worked up a thirst — the need is right now."
        move="Since your usage just jumped — new EV, a pool, a growing family — solar sizes to your new normal so the bill doesn't run away. Let's get you scheduled."
      />
    ),
  },
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

  return (
    <section className="relative bg-black min-h-[100svh] flex items-center justify-center px-6 py-20 border-b border-white/10">
      <div className="flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-20 max-w-5xl">
        <SegmentedCup highlight={highlight} />
        <SlideStepper slides={DIVE_SLIDES} onStepChange={setStep} />
      </div>
    </section>
  );
}
