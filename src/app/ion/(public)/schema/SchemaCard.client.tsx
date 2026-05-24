"use client";

import Link from "next/link";
import type {
  HeroOverride,
  ProposedCategory,
  SchemaSection,
} from "./types";
import {
  bookedCount,
  descriptionFromYaml,
  effectiveCardStatus,
} from "./types";
import { SchemaStatusPill } from "./SchemaStatusPill.client";

// V1 schema cards. One component per visual variant; the parent
// SchemaBrowser picks which to render based on the data shape.
//
// LIT cards are the "coaching artifact" surface — they show floor
// numbers, a description, and (when a hero override exists) hand-
// written depth. TBD cards show the open questions. SCAFFOLDED cards
// are inventory markers — half-weight silhouettes that make the SoW
// math visible without competing with LIT cards for attention.
// PROPOSED is its own component because the data shape differs.

const HEADLINE_FALLBACK_DESC =
  "Section description pending — Kenny + Spencer write during embedded build.";
const NO_CORPUS_DESC = "No calls in the processed corpus reference this section yet.";

function titleCaseLeaf(leaf: string): string {
  return leaf
    .split("_")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

function truncate(s: string, max = 280): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1).trimEnd() + "…";
}

export function SchemaCard({
  section,
  override,
  onOpen,
}: {
  section: SchemaSection;
  override?: HeroOverride;
  onOpen: () => void;
}) {
  const status = effectiveCardStatus(section);
  if (status === "scaffolded") {
    return <ScaffoldedCard section={section} onOpen={onOpen} />;
  }
  if (status === "tbd") {
    return <TbdCard section={section} onOpen={onOpen} />;
  }
  return <LitCard section={section} override={override} onOpen={onOpen} />;
}

function LitCard({
  section,
  override,
  onOpen,
}: {
  section: SchemaSection;
  override?: HeroOverride;
  onOpen: () => void;
}) {
  const stats = section.corpus_stats || {};
  const callCount = stats.call_count ?? 0;
  const booked = bookedCount(stats);
  const isBombshell = override?.bombshell === true;

  const headline = override?.headline || titleCaseLeaf(section.leaf);
  const whatThisIs =
    override?.what_this_is ||
    descriptionFromYaml(section.raw_yaml) ||
    HEADLINE_FALLBACK_DESC;

  const floorLine =
    callCount > 0
      ? `${callCount.toLocaleString()} calls reference this · ${booked} booked`
      : NO_CORPUS_DESC;

  return (
    <article
      onClick={onOpen}
      className={
        "relative group rounded-lg border bg-stewart-card p-5 cursor-pointer transition-all " +
        (isBombshell
          ? "border-stewart-accent/70 shadow-lg shadow-stewart-accent/10 hover:border-stewart-accent hover:shadow-stewart-accent/20"
          : "border-stewart-border hover:border-stewart-accent/40 hover:bg-stewart-card/80")
      }
    >
      {isBombshell ? <BombshellRibbon /> : null}

      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-stewart-text leading-snug">
            {headline}
          </h3>
          <p className="mt-1 text-[11px] font-mono text-stewart-muted break-all">
            {section.path}
          </p>
        </div>
        <SchemaStatusPill tone="lit" />
      </header>

      <hr className="my-3 border-stewart-border/60" />

      <section>
        <p className="text-[10px] uppercase tracking-wider text-stewart-muted mb-1">
          What this is
        </p>
        <p className="text-sm text-stewart-text leading-relaxed">
          {truncate(whatThisIs)}
        </p>
      </section>

      <section className="mt-3">
        <p className="text-[10px] uppercase tracking-wider text-stewart-muted mb-1">
          Your floor right now
        </p>
        <p
          className={
            "text-sm font-mono " +
            (callCount > 0 ? "text-stewart-text" : "text-stewart-muted")
          }
        >
          {floorLine}
        </p>
      </section>

      {override?.why_it_matters ? (
        <section className="mt-4">
          <p className="text-[10px] uppercase tracking-wider text-stewart-accent mb-1">
            Why it matters
          </p>
          <p className="text-sm text-stewart-text leading-relaxed">
            {override.why_it_matters}
          </p>
        </section>
      ) : null}

      {override?.what_good_sounds_like ? (
        <section className="mt-4 rounded border border-stewart-accent/30 bg-stewart-accent/5 p-3">
          <p className="text-[10px] uppercase tracking-wider text-stewart-accent mb-1">
            What good sounds like
          </p>
          <blockquote className="text-sm text-stewart-text italic leading-relaxed whitespace-pre-line">
            “{override.what_good_sounds_like.quote}”
          </blockquote>
          <p className="mt-1 text-[10px] font-mono text-stewart-muted">
            — {override.what_good_sounds_like.attribution}
          </p>
        </section>
      ) : null}

      {override?.coaching_focus ? (
        <section className="mt-4">
          <p className="text-[10px] uppercase tracking-wider text-stewart-accent mb-1">
            Coaching focus
          </p>
          <p className="text-sm text-stewart-text leading-relaxed">
            {override.coaching_focus}
          </p>
        </section>
      ) : null}

      <footer className="mt-4 pt-3 border-t border-stewart-border/40 flex flex-wrap gap-3 text-xs">
        <Link
          href={`/ion/brain?tile=${encodeURIComponent(section.path)}`}
          onClick={(e) => e.stopPropagation()}
          className="text-stewart-accent hover:underline"
        >
          → View in brain
        </Link>
        <Link
          href={`/ion/calls?schema=${encodeURIComponent(section.path)}`}
          onClick={(e) => e.stopPropagation()}
          className="text-stewart-accent hover:underline"
        >
          → Read example calls
        </Link>
      </footer>
    </article>
  );
}

function TbdCard({
  section,
  onOpen,
}: {
  section: SchemaSection;
  onOpen: () => void;
}) {
  const headline = titleCaseLeaf(section.leaf);
  return (
    <article
      onClick={onOpen}
      className="rounded-lg border border-stewart-warning/30 bg-stewart-warning/5 p-5 cursor-pointer transition-all hover:border-stewart-warning/60"
    >
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-stewart-text leading-snug opacity-80">
            {headline}
          </h3>
          <p className="mt-1 text-[11px] font-mono text-stewart-muted break-all">
            {section.path}
          </p>
        </div>
        <SchemaStatusPill tone="tbd" />
      </header>

      <hr className="my-3 border-stewart-warning/20" />

      <p className="text-sm text-stewart-muted leading-relaxed">
        Spencer + Kenny fill this in during an embedded-build working
        session.
      </p>

      {section.tbd_items.length > 0 ? (
        <section className="mt-3">
          <p className="text-[10px] uppercase tracking-wider text-stewart-warning mb-1">
            Open questions ({section.tbd_items.length})
          </p>
          <ul className="space-y-1">
            {section.tbd_items.slice(0, 3).map((t, i) => (
              <li
                key={i}
                className="text-xs font-mono text-stewart-text/80 leading-snug"
              >
                · {t}
              </li>
            ))}
            {section.tbd_items.length > 3 ? (
              <li className="text-xs text-stewart-muted italic">
                +{section.tbd_items.length - 3} more…
              </li>
            ) : null}
          </ul>
        </section>
      ) : null}
    </article>
  );
}

function ScaffoldedCard({
  section,
  onOpen,
}: {
  section: SchemaSection;
  onOpen: () => void;
}) {
  const headline = titleCaseLeaf(section.leaf);
  return (
    <article
      onClick={onOpen}
      className="rounded-lg border border-dashed border-stewart-border bg-stewart-bg/30 px-4 py-3 cursor-pointer transition-all hover:border-stewart-muted hover:bg-stewart-bg/50"
    >
      <header className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-medium text-stewart-muted/90 truncate">
            {headline}
          </h3>
          <p className="text-[10px] font-mono text-stewart-muted/70 truncate">
            {section.path}
          </p>
        </div>
        <SchemaStatusPill tone="scaffolded" />
      </header>
      <p className="mt-1.5 text-[11px] text-stewart-muted/80 italic">
        Outlined — embedded build fills this in.
      </p>
    </article>
  );
}

export function ProposedCard({
  proposed,
  onOpen,
}: {
  proposed: ProposedCategory;
  onOpen: () => void;
}) {
  const isBombshell = proposed.is_bombshell === true;
  return (
    <article
      onClick={onOpen}
      className={
        "relative group rounded-lg border-2 border-dashed p-5 cursor-pointer transition-all " +
        (isBombshell
          ? "border-stewart-accent/70 bg-stewart-card hover:border-stewart-accent"
          : "border-sky-400/50 bg-stewart-card hover:border-sky-400/80")
      }
    >
      {isBombshell ? <BombshellRibbon /> : null}

      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-stewart-text leading-snug">
            {titleCaseLeaf(proposed.name)}
          </h3>
          <p className="mt-1 text-[11px] font-mono text-stewart-muted break-all">
            {proposed.name}
          </p>
        </div>
        <SchemaStatusPill tone="proposed" />
      </header>

      <hr className="my-3 border-stewart-border/60" />

      {proposed.description ? (
        <section>
          <p className="text-[10px] uppercase tracking-wider text-stewart-muted mb-1">
            What this is
          </p>
          <p className="text-sm text-stewart-text leading-relaxed whitespace-pre-line">
            {truncate(proposed.description, 320)}
          </p>
        </section>
      ) : null}

      {typeof proposed.sample_frequency_in_corpus === "number" ? (
        <section className="mt-3">
          <p className="text-[10px] uppercase tracking-wider text-stewart-muted mb-1">
            Detected in corpus
          </p>
          <p className="text-sm font-mono text-stewart-text">
            {proposed.sample_frequency_in_corpus} instances
            {typeof proposed.detected_in_corpus_actually_executed === "number" ? (
              <>
                {" · "}
                <span
                  className={
                    proposed.detected_in_corpus_actually_executed === 0
                      ? "text-stewart-danger"
                      : "text-stewart-text"
                  }
                >
                  {proposed.detected_in_corpus_actually_executed} executed
                </span>
              </>
            ) : null}
          </p>
        </section>
      ) : null}

      <footer
        className={
          "mt-4 pt-3 border-t text-xs text-stewart-muted italic leading-relaxed " +
          (isBombshell
            ? "border-stewart-accent/30"
            : "border-sky-400/30")
        }
      >
        Awaiting Kenny&apos;s approval to enter main schema.
      </footer>
    </article>
  );
}

// Sits at the top-left edge of the card so it doesn't fight the
// status pill on the right. -translate-y nudges it half over the
// card border for the "ribbon stitched on" effect.
function BombshellRibbon() {
  return (
    <span
      className="absolute -top-2 left-4 z-10 text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border border-stewart-accent/70 bg-stewart-accent text-stewart-bg shadow-sm"
      aria-label="bombshell finding"
    >
      ⚠ bombshell
    </span>
  );
}
