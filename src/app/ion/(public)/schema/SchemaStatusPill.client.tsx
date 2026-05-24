"use client";

import type { CardStatus } from "./types";

// Tiny shared pill used by both the cards and the SoW counter line.
// Each tone is anchored to a Stewart palette color: green = lit,
// amber = tbd, blue = proposed, gray = scaffolded.

type Tone = CardStatus | "proposed";

const TONE_CLASSES: Record<Tone, string> = {
  lit: "border-stewart-success/50 text-stewart-success bg-stewart-success/10",
  tbd: "border-stewart-warning/50 text-stewart-warning bg-stewart-warning/10",
  proposed: "border-sky-400/50 text-sky-400 bg-sky-400/10",
  scaffolded: "border-stewart-border text-stewart-muted bg-stewart-bg/40",
};

const DEFAULT_LABELS: Record<Tone, string> = {
  lit: "LIT",
  tbd: "TBD",
  proposed: "PROPOSED",
  scaffolded: "SCAFFOLDED",
};

export function SchemaStatusPill({
  tone,
  label,
  size = "sm",
}: {
  tone: Tone;
  label?: string;
  size?: "sm" | "md";
}) {
  const cls = TONE_CLASSES[tone];
  const text = label ?? DEFAULT_LABELS[tone];
  const sizing =
    size === "md" ? "text-xs px-2 py-1" : "text-[10px] px-1.5 py-0.5";
  return (
    <span
      className={
        "font-mono uppercase tracking-wider rounded border " +
        sizing +
        " " +
        cls
      }
    >
      {text}
    </span>
  );
}

// Bare-dot variant for the counter line — a single colored bullet
// with no border / background. Used inline before each number.
export function SchemaStatusDot({ tone }: { tone: Tone }) {
  const c =
    tone === "lit"
      ? "bg-stewart-success"
      : tone === "tbd"
      ? "bg-stewart-warning"
      : tone === "proposed"
      ? "bg-sky-400"
      : "bg-stewart-muted";
  return (
    <span
      className={"inline-block w-1.5 h-1.5 rounded-full align-middle " + c}
      aria-hidden
    />
  );
}
