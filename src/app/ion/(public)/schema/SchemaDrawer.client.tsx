"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type {
  ProposedCategory,
  SchemaSection,
} from "./types";

// Side-sliding drawer for schema cards. Mirrors the shell of
// /ion/calls/CallDetailDrawer.client.tsx — fixed overlay, ESC + click-
// outside close, side-docked aside on desktop, full-width on mobile.
//
// Content is split into SectionDetail (for any SchemaSection) and
// ProposedDetail (for proposed_categories). Both render functions
// were lifted verbatim from the pre-V1 SchemaBrowser.client.tsx so
// the depth view that already worked keeps working.

export type SchemaDrawerSelection =
  | { kind: "section"; section: SchemaSection }
  | { kind: "proposed"; proposed: ProposedCategory };

export function SchemaDrawer({
  selection,
  onClose,
}: {
  selection: SchemaDrawerSelection | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!selection) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selection, onClose]);

  if (!selection) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-stretch justify-end"
      onClick={onClose}
    >
      <aside
        className="bg-stewart-bg border-l border-stewart-border w-full sm:max-w-2xl overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="sticky top-0 bg-stewart-card border-b border-stewart-border px-5 py-4 flex items-center justify-between z-10">
          <span className="text-xs uppercase tracking-wider font-mono text-stewart-muted truncate">
            {selection.kind === "section"
              ? `Schema section · ${selection.section.domain}`
              : `Proposed addition · awaiting Kenny`}
          </span>
          <button
            onClick={onClose}
            className="text-stewart-muted hover:text-stewart-text text-sm shrink-0"
          >
            Close ✕
          </button>
        </header>
        <div className="px-5 py-6">
          {selection.kind === "section" ? (
            <SectionDetail section={selection.section} />
          ) : (
            <ProposedDetail proposed={selection.proposed} />
          )}
        </div>
      </aside>
    </div>
  );
}

// ---------------------------------------------------------------
// SectionDetail — lifted from the pre-V1 SchemaBrowser. Renders the
// depth view for any schema section (lit / resolved / tbd / stub).
// ---------------------------------------------------------------

const STATUS_BADGES: Record<
  string,
  { label: string; classes: string }
> = {
  resolved: {
    label: "✓ RESOLVED",
    classes: "border-stewart-success/50 text-stewart-success bg-stewart-success/10",
  },
  tbd: {
    label: "📝 TBD",
    classes: "border-stewart-warning/50 text-stewart-warning bg-stewart-warning/10",
  },
  lit: {
    label: "● LIT",
    classes: "border-stewart-accent/40 text-stewart-accent bg-stewart-accent/10",
  },
  stub: {
    label: "○ SCAFFOLDED",
    classes: "border-stewart-border text-stewart-muted bg-stewart-card",
  },
};

function SectionDetail({ section }: { section: SchemaSection }) {
  const badge = STATUS_BADGES[section.status] || STATUS_BADGES.stub;
  const stats = section.corpus_stats || {};
  const callCount = stats.call_count ?? 0;
  const classifications = Object.entries(stats.classifications || {}).sort(
    ([, a], [, b]) => b - a
  );
  const outcomes = Object.entries(stats.outcomes || {}).sort(
    ([, a], [, b]) => b - a
  );
  const grays = stats.gray_matter_exemplars || [];
  const examples = stats.recent_examples || [];

  return (
    <article className="space-y-7">
      <header className="space-y-3">
        <div className="flex flex-wrap items-baseline gap-3">
          <code className="text-base sm:text-lg font-mono text-stewart-accent break-all">
            {section.path}
          </code>
          <span
            className={
              "text-[10px] font-mono uppercase tracking-wider rounded px-2 py-0.5 border " +
              badge.classes
            }
          >
            {badge.label}
            {section.resolved_at ? <> · {section.resolved_at}</> : null}
          </span>
        </div>
        <div className="flex flex-wrap gap-3 text-xs">
          <Link
            href={`/ion/brain?tile=${encodeURIComponent(section.path)}`}
            className="text-stewart-accent hover:underline"
          >
            → View in brain
          </Link>
          <Link
            href={`/ion/calls?schema=${encodeURIComponent(section.path)}`}
            className="text-stewart-accent hover:underline"
          >
            → Read example calls
          </Link>
        </div>
      </header>

      {callCount > 0 ? (
        <section>
          <p className="text-xs uppercase tracking-wider text-stewart-muted mb-2">
            From your corpus
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="rounded border border-stewart-border bg-stewart-card p-4">
              <p className="text-xs uppercase tracking-wider text-stewart-muted mb-1">
                Calls referencing this section
              </p>
              <p className="text-2xl font-bold text-stewart-text">
                {callCount}
              </p>
              {classifications.length > 0 ? (
                <p className="text-xs text-stewart-muted mt-2">
                  Top pattern:{" "}
                  <span className="text-stewart-text">
                    {classifications[0][0].replace(/_/g, " ")}
                  </span>{" "}
                  ({classifications[0][1]})
                </p>
              ) : null}
            </div>
            <div className="rounded border border-stewart-border bg-stewart-card p-4">
              <p className="text-xs uppercase tracking-wider text-stewart-muted mb-2">
                Outcome distribution
              </p>
              {outcomes.length === 0 ? (
                <p className="text-xs text-stewart-muted">—</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {outcomes.map(([k, n]) => (
                    <span
                      key={k}
                      className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-stewart-border bg-stewart-bg/50 text-stewart-muted"
                    >
                      {k.replace(/_/g, " ")}:{" "}
                      <span className="text-stewart-text">{n}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      ) : (
        <section className="rounded border border-stewart-border bg-stewart-card p-4">
          <p className="text-xs text-stewart-muted">
            No calls in the processed corpus reference this section yet.
            That&apos;s normal for newer schema entries.
          </p>
        </section>
      )}

      {section.tbd_items.length > 0 ? (
        <section className="rounded border border-stewart-warning/40 bg-stewart-warning/5 p-4">
          <p className="text-xs uppercase tracking-wider text-stewart-warning mb-2">
            Pending Kenny &middot; {section.tbd_items.length} TBD
            {section.tbd_items.length > 1 ? "s" : ""}
          </p>
          <ul className="space-y-1 text-sm text-stewart-text">
            {section.tbd_items.map((t, i) => (
              <li key={i} className="font-mono text-xs leading-snug">
                {t}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {section.resolved_at ? (
        <section className="rounded border border-stewart-success/40 bg-stewart-success/5 p-4">
          <p className="text-xs uppercase tracking-wider text-stewart-success mb-2">
            Resolved {section.resolved_at}
          </p>
          <p className="text-sm text-stewart-text leading-relaxed">
            This section was a TBD until Kenny&apos;s direct call with
            Spencer on {section.resolved_at}. The schema entry below
            reflects the resolution &mdash; Stewart now reads every
            related call through this lens.
          </p>
        </section>
      ) : null}

      {grays.length > 0 ? (
        <section>
          <p className="text-xs uppercase tracking-wider text-amber-400 mb-2">
            Gray-matter exemplars
          </p>
          <ul className="space-y-2">
            {grays.map((g, i) => (
              <li
                key={i}
                className="rounded border border-amber-400/30 bg-amber-400/5 p-3 text-sm"
              >
                <code className="font-mono text-stewart-accent text-xs">
                  {g.call_id}
                </code>
                {g.reason ? (
                  <p className="text-xs text-stewart-text mt-1 leading-relaxed">
                    {g.reason}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {examples.length > 0 ? (
        <section>
          <p className="text-xs uppercase tracking-wider text-stewart-muted mb-2">
            Recent example cherry-picks
          </p>
          <ul className="space-y-3">
            {examples.slice(0, 5).map((ex, i) => (
              <li
                key={i}
                className="rounded border border-stewart-border bg-stewart-card p-3"
              >
                <p className="text-xs text-stewart-muted font-mono mb-1">
                  {ex.call_id} @ {ex.ts}{" "}
                  <span className="text-stewart-muted/70">
                    ({ex.classification.replace(/_/g, " ")})
                  </span>
                </p>
                <blockquote className="text-sm text-stewart-text italic leading-snug">
                  &ldquo;{ex.quote}&rdquo;
                </blockquote>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {section.raw_yaml ? <RawYamlToggle yaml={section.raw_yaml} /> : null}
    </article>
  );
}

// ---------------------------------------------------------------
// ProposedDetail — lifted from the pre-V1 SchemaBrowser. Renders
// the full depth view for a proposed_categories entry.
// ---------------------------------------------------------------

function ProposedDetail({ proposed: p }: { proposed: ProposedCategory }) {
  const tone = p.is_bombshell
    ? "border-stewart-danger/50 bg-stewart-danger/5"
    : "border-sky-400/40 bg-sky-400/5";
  return (
    <article className={"space-y-6 rounded-lg border p-6 " + tone}>
      <header className="space-y-3">
        <span
          className={
            "text-[10px] font-mono uppercase tracking-wider rounded px-2 py-0.5 border " +
            (p.is_bombshell
              ? "border-stewart-danger/50 text-stewart-danger bg-stewart-danger/10"
              : "border-sky-400/50 text-sky-400 bg-sky-400/10")
          }
        >
          {p.is_bombshell ? "⚠ THE BOMBSHELL" : "🆕 PROPOSED"}
        </span>
        <h2 className="text-2xl font-bold text-stewart-text leading-snug">
          <code className="font-mono text-stewart-accent">{p.name}</code>
        </h2>
        {p.spencers_catch ? (
          <p className="text-xs uppercase tracking-wider text-stewart-warning">
            Spencer&apos;s catch &middot; operator instinct
          </p>
        ) : null}
      </header>

      {p.is_bombshell && p.critical_finding ? (
        <div className="rounded border border-stewart-danger/50 bg-stewart-danger/10 p-4">
          <p className="text-base sm:text-lg text-stewart-text leading-snug">
            {p.critical_finding}
          </p>
        </div>
      ) : null}

      {p.description ? (
        <DetailSection title="Description">{p.description}</DetailSection>
      ) : null}

      {p.distinct_from ? (
        <DetailSection title={`Distinct from "${p.distinct_from}"`}>
          {p.distinction || "—"}
        </DetailSection>
      ) : null}

      {p.fix ? <DetailSection title="The fix">{p.fix}</DetailSection> : null}

      {p.coaching_drill ? (
        <DetailSection title="Coaching drill">{p.coaching_drill}</DetailSection>
      ) : null}

      {p.attribution ? (
        <DetailSection title="Attribution">{p.attribution}</DetailSection>
      ) : null}

      <div className="grid sm:grid-cols-2 gap-3 text-xs">
        {typeof p.sample_frequency_in_corpus === "number" ? (
          <Stat
            label="Detected in corpus (sample)"
            value={String(p.sample_frequency_in_corpus)}
            tone="warning"
          />
        ) : null}
        {typeof p.detected_in_corpus_actually_executed === "number" ? (
          <Stat
            label="Actually executed"
            value={String(p.detected_in_corpus_actually_executed)}
            tone={
              p.detected_in_corpus_actually_executed === 0 ? "danger" : "default"
            }
          />
        ) : null}
      </div>

      {p.corpus_data_2026_05_22 ? (
        <DetailSection title="Corpus data · 2026-05-22">
          <ul className="text-xs font-mono space-y-1 text-stewart-text">
            {Object.entries(p.corpus_data_2026_05_22).map(([k, v]) => (
              <li key={k}>
                <span className="text-stewart-muted">{k}:</span>{" "}
                {String(v)}
              </li>
            ))}
          </ul>
        </DetailSection>
      ) : null}

      {p.example_call_ids?.length ? (
        <DetailSection title="Example calls">
          <ul className="text-xs font-mono space-y-1">
            {p.example_call_ids.map((e, i) => {
              const cid = typeof e === "string" ? e : e.call_id;
              const ts = typeof e === "string" ? undefined : e.ts;
              return (
                <li key={i} className="text-stewart-text">
                  <code className="text-stewart-accent">{cid}</code>
                  {ts ? <> @ {ts}</> : null}
                </li>
              );
            })}
          </ul>
        </DetailSection>
      ) : null}

      <div className="pt-4 border-t border-stewart-border">
        <p className="text-xs text-stewart-muted leading-relaxed">
          Kenny — approve / reject / refine? Walk through with Spencer in
          the next call. Stewart proposes; Kenny ratifies.
        </p>
      </div>
    </article>
  );
}

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <p className="text-xs uppercase tracking-wider text-stewart-muted mb-2">
        {title}
      </p>
      <div className="text-sm text-stewart-text leading-relaxed whitespace-pre-wrap">
        {children}
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "default" | "warning" | "danger";
}) {
  const cls =
    tone === "danger"
      ? "border-stewart-danger/50 text-stewart-danger"
      : tone === "warning"
      ? "border-stewart-warning/50 text-stewart-warning"
      : "border-stewart-border text-stewart-text";
  return (
    <div className={"rounded border bg-stewart-card p-3 " + cls}>
      <p className="text-[10px] uppercase tracking-wider text-stewart-muted mb-1">
        {label}
      </p>
      <p className="text-lg font-bold font-mono">{value}</p>
    </div>
  );
}

function RawYamlToggle({ yaml }: { yaml: string }) {
  const [open, setOpen] = useState(false);
  return (
    <section>
      <button
        onClick={() => setOpen((v) => !v)}
        className="text-xs text-stewart-accent hover:underline"
      >
        {open ? "− hide" : "+ expand"} raw YAML
      </button>
      {open ? (
        <pre className="mt-2 rounded border border-stewart-border bg-stewart-bg/60 p-4 overflow-x-auto text-[11px] font-mono text-stewart-text/80 leading-relaxed whitespace-pre">
          {yaml}
        </pre>
      ) : null}
    </section>
  );
}
