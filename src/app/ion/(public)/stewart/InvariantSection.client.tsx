"use client";

import { parseBody } from "./schema";
import type { Invariant } from "./schema";
import { NoteBox } from "./NoteBox.client";

// Renders one invariant in the locked schema. Subsection order is
// fixed per brief:
//   Core Question → Job → Failure State → Maturity Ladder (L1/L2/L3)
//   → Stewart Detection (collapsed) → Economic Impact → NoteBox

export function InvariantSection({
  invariant,
  reviewer,
  initialContent,
}: {
  invariant: Invariant;
  reviewer: string;
  initialContent: string;
}) {
  return (
    <section className="space-y-6 sm:space-y-7">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-wider font-mono text-stewart-muted">
          Invariant {invariant.number} of 6
        </p>
        <h2 className="text-2xl sm:text-3xl font-bold text-stewart-text">
          {invariant.title}
        </h2>
      </header>

      {/* Core Question — the hook. Big callout. */}
      <blockquote className="rounded-lg border border-stewart-accent/30 bg-stewart-accent/5 px-5 sm:px-6 py-5">
        <p className="text-[10px] uppercase tracking-wider font-semibold text-stewart-accent mb-2">
          Core Question
        </p>
        <p className="text-lg sm:text-xl italic text-stewart-text leading-snug">
          {invariant.core_question}
        </p>
      </blockquote>

      <FieldBlock label="Job" tone="default">
        {invariant.job}
      </FieldBlock>

      <FieldBlock label="Failure state" tone="muted">
        {invariant.failure_state}
      </FieldBlock>

      <section className="space-y-3">
        <p className="text-[10px] uppercase tracking-wider font-semibold text-stewart-accent">
          Maturity Ladder
        </p>
        <div className="space-y-3">
          <MaturityCard
            tier="L1"
            level={invariant.maturity.l1}
            tone="border-stewart-border bg-stewart-card"
          />
          <MaturityCard
            tier="L2"
            level={invariant.maturity.l2}
            tone="border-stewart-warning/40 bg-stewart-warning/5"
          />
          <MaturityCard
            tier="L3"
            level={invariant.maturity.l3}
            tone="border-stewart-success/40 bg-stewart-success/5"
          />
        </div>
      </section>

      {/* Stewart Detection — engineer lens, collapsed by default. */}
      <details className="group rounded-lg border border-stewart-border bg-stewart-bg/30 px-4 py-3">
        <summary className="text-xs uppercase tracking-wider text-stewart-muted cursor-pointer select-none flex items-center gap-2">
          <span className="text-stewart-accent">▸</span>
          <span className="group-open:hidden">
            Show detection signals (engineer view)
          </span>
          <span className="hidden group-open:inline">
            Stewart Detection — engineer view
          </span>
        </summary>
        <p className="mt-3 text-xs font-mono text-stewart-muted leading-relaxed">
          {invariant.stewart_detection}
        </p>
      </details>

      {/* Economic Impact — visually distinct so VP eyes land here. */}
      <section className="rounded-r-lg border-l-4 border-stewart-accent bg-stewart-card p-5">
        <p className="text-[10px] uppercase tracking-wider font-semibold text-stewart-accent mb-3">
          Economic Impact
        </p>
        <div className="grid sm:grid-cols-2 gap-3 mb-4">
          <KpiCell label="Primary KPI" value={invariant.economic_impact.primary_kpi} />
          <KpiCell
            label="Secondary KPI"
            value={invariant.economic_impact.secondary_kpi}
          />
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-stewart-muted mb-1">
            Hypothesis
          </p>
          <p className="text-sm text-stewart-text leading-relaxed">
            {renderHypothesis(invariant.economic_impact.hypothesis)}
          </p>
        </div>
      </section>

      <NoteBox
        invariantId={invariant.id}
        reviewer={reviewer}
        initialContent={initialContent}
      />

      <hr className="border-stewart-border/40 mt-2" />
    </section>
  );
}

function FieldBlock({
  label,
  tone,
  children,
}: {
  label: string;
  tone: "default" | "muted";
  children: React.ReactNode;
}) {
  return (
    <section>
      <p className="text-[10px] uppercase tracking-wider font-semibold text-stewart-accent mb-1.5">
        {label}
      </p>
      <p
        className={
          "text-base leading-relaxed " +
          (tone === "muted" ? "text-stewart-muted" : "text-stewart-text")
        }
      >
        {children}
      </p>
    </section>
  );
}

function MaturityCard({
  tier,
  level,
  tone,
}: {
  tier: "L1" | "L2" | "L3";
  level: { label: string; body: string };
  tone: string;
}) {
  const segments = parseBody(level.body);
  return (
    <div className={"rounded-lg border p-4 sm:p-5 " + tone}>
      <p className="text-[10px] uppercase tracking-wider font-mono font-semibold text-stewart-text mb-2">
        {tier} · {level.label}
      </p>
      <div className="text-sm text-stewart-text leading-relaxed space-y-2">
        {segments.map((seg, i) =>
          seg.kind === "prose" ? (
            <span key={i}>{highlightWords(seg.text)}</span>
          ) : (
            <blockquote
              key={i}
              className="block border-l-2 border-stewart-accent/60 pl-3 my-2 italic text-stewart-accent"
            >
              &ldquo;{highlightWords(seg.text)}&rdquo;
            </blockquote>
          )
        )}
      </div>
    </div>
  );
}

// `**word**` markers in maturity bodies render as bold red — used to
// visualize mirror words (e.g. customer says "interested," rep
// mirrors back "interesting" / "interested"). Applies to both prose
// and quote segments so highlighted text reads consistently no matter
// where it sits.
function highlightWords(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const re = /\*\*([^*]+)\*\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let i = 0;
  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push(
      <span
        key={`h${i++}`}
        className="text-stewart-danger font-semibold not-italic"
      >
        {match[1]}
      </span>
    );
    lastIndex = re.lastIndex;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}

function KpiCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-stewart-border bg-stewart-bg/40 p-3">
      <p className="text-[10px] uppercase tracking-wider text-stewart-muted mb-1">
        {label}
      </p>
      <p className="text-sm font-mono text-stewart-text leading-snug">
        {value}
      </p>
    </div>
  );
}

// Bold dollar figures + percent lift figures inline so the executive
// lens (the VP scan) lands on the numbers. Pattern matches the
// schema's hypothesis copy — single-pass replace, no markdown
// processing.
function renderHypothesis(text: string): React.ReactNode {
  // Match: $X[.X][M|k]/year  OR  +N% (absolute|relative)?  OR  bare
  // $X[M|k|,…] figures. We're conservative — false positives mean
  // unnecessary bolding, never wrong content.
  const re = /(\+?\$[\d.,]+(?:[MmKk])?(?:\/year)?|\+\d+%(?:\s+(?:absolute|relative))?)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let i = 0;
  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push(
      <strong key={`m${i++}`} className="text-stewart-success font-semibold">
        {match[0]}
      </strong>
    );
    lastIndex = re.lastIndex;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}
