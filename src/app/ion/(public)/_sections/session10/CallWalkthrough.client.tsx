"use client";

import { useMemo, useState } from "react";
import {
  type CallBundle,
  type CherryPick,
  type Handoff,
  type Metadata,
  tsToSeconds,
} from "./types";

const CLIP_DURATION_SEC = 20;

const CLASSIFICATION_TONE: Record<
  string,
  { label: string; chip: string; dot: string }
> = {
  tesla_expectation_gap: {
    label: "Tesla expectation gap",
    chip: "border-stewart-warning/40 bg-stewart-warning/10 text-stewart-warning",
    dot: "bg-stewart-warning",
  },
  enthusiasm_signal: {
    label: "Enthusiasm signal",
    chip: "border-stewart-success/40 bg-stewart-success/10 text-stewart-success",
    dot: "bg-stewart-success",
  },
  rapport_repair: {
    label: "Rapport repair",
    chip: "border-stewart-warning/40 bg-stewart-warning/10 text-stewart-warning",
    dot: "bg-stewart-warning",
  },
  cross_sell_miss: {
    label: "Cross-sell miss",
    chip: "border-stewart-danger/50 bg-stewart-danger/10 text-stewart-danger",
    dot: "bg-stewart-danger",
  },
  protocol_violation: {
    label: "Protocol violation",
    chip: "border-stewart-danger/40 bg-stewart-danger/10 text-stewart-danger",
    dot: "bg-stewart-danger",
  },
  knowledge_gap: {
    label: "Knowledge gap",
    chip: "border-stewart-warning/40 bg-stewart-warning/10 text-stewart-warning",
    dot: "bg-stewart-warning",
  },
  spouse_handling: {
    label: "Spouse handling",
    chip: "border-stewart-accent/40 bg-stewart-accent/10 text-stewart-accent",
    dot: "bg-stewart-accent",
  },
  other: {
    label: "Other",
    chip: "border-stewart-border bg-stewart-card text-stewart-muted",
    dot: "bg-stewart-muted",
  },
};

function classTone(c: string) {
  return CLASSIFICATION_TONE[c] || CLASSIFICATION_TONE.other;
}

export function CallWalkthrough({
  session10,
  session18,
}: {
  session10: CallBundle;
  session18: CallBundle;
}) {
  // Default-select the priority-1 moment (the manager brief's primary
  // coaching focus). For SESSION10 that's the 06:34 cross-sell miss
  // Spencer sent to Kenny.
  const priorityTs = session10.managerBrief.primary_coaching_focus.ts;
  const priorityIdx = Math.max(
    0,
    session10.cherryPicks.findIndex((m) => m.ts === priorityTs)
  );
  const [selectedIdx, setSelectedIdx] = useState(priorityIdx);
  const [showTrajectory, setShowTrajectory] = useState(false);
  const [showSession18, setShowSession18] = useState(false);

  const selected = session10.cherryPicks[selectedIdx];

  return (
    <div className="space-y-8">
      <CallMetadataStrip meta={session10.metadata} />

      <DoubleMissCallout cherryPicks={session10.cherryPicks} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <CherryPickList
          cherryPicks={session10.cherryPicks}
          selectedIdx={selectedIdx}
          onSelect={setSelectedIdx}
          priorityTs={priorityTs}
        />
        <MomentDetail
          moment={selected}
          callId={session10.metadata.call_id}
        />
      </div>

      <ManagerBriefCard
        brief={session10.managerBrief}
        onExpandTrajectory={() => setShowTrajectory(true)}
      />

      <CriticAuditCallout />

      <Session18Panel
        bundle={session18}
        expanded={showSession18}
        onToggle={() => setShowSession18((v) => !v)}
      />

      {showTrajectory ? (
        <TrajectoryDrawer
          brief={session10.managerBrief}
          onClose={() => setShowTrajectory(false)}
        />
      ) : null}
    </div>
  );
}

function CallMetadataStrip({ meta }: { meta: Metadata }) {
  return (
    <div className="rounded-lg border border-stewart-border bg-stewart-card p-4 sm:p-5 flex flex-wrap items-baseline gap-x-6 gap-y-2 text-sm">
      <span className="font-mono text-stewart-accent text-base font-bold">
        {meta.call_id.replace(/^SESSION/, "SESSION ")}
      </span>
      <span className="text-stewart-text">
        <span className="text-stewart-muted">duration:</span>{" "}
        {meta.duration_min.toFixed(0)} min
      </span>
      <span className="text-stewart-text">
        <span className="text-stewart-muted">rep:</span> {meta.rep_id}
      </span>
      <span className="text-stewart-text">
        <span className="text-stewart-muted">outcome:</span>{" "}
        <span
          className={
            meta.outcome === "no_interest" || meta.outcome === "declined"
              ? "text-stewart-danger"
              : "text-stewart-success"
          }
        >
          {meta.outcome}
        </span>
      </span>
      <span className="text-stewart-muted basis-full sm:basis-auto">
        primary objection:{" "}
        <span className="text-stewart-text italic">
          {meta.primary_objection}
        </span>
      </span>
    </div>
  );
}

function DoubleMissCallout({ cherryPicks }: { cherryPicks: CherryPick[] }) {
  const misses = cherryPicks.filter((p) => p.classification === "cross_sell_miss");
  if (misses.length < 2) return null;
  return (
    <div className="rounded-lg border border-stewart-danger/40 bg-stewart-danger/5 p-4 flex items-start gap-3">
      <span className="text-stewart-danger text-sm font-mono mt-0.5 shrink-0">
        ↘ {misses.length}×
      </span>
      <p className="text-sm text-stewart-text leading-relaxed">
        Stewart flagged a{" "}
        <span className="text-stewart-danger font-semibold">
          multi-touch cross-sell miss
        </span>{" "}
        on this call &mdash; the same roofing trigger surfaced at{" "}
        {misses.map((m, i) => (
          <span key={m.ts}>
            <span className="font-mono text-stewart-danger">{m.ts}</span>
            {i < misses.length - 1 ? " and " : ""}
          </span>
        ))}
        . Managers normally see neither.
      </p>
    </div>
  );
}

function CherryPickList({
  cherryPicks,
  selectedIdx,
  onSelect,
  priorityTs,
}: {
  cherryPicks: CherryPick[];
  selectedIdx: number;
  onSelect: (i: number) => void;
  priorityTs: string;
}) {
  return (
    <div className="lg:col-span-4">
      <p className="text-xs uppercase tracking-wider font-semibold text-stewart-muted mb-3">
        Cherry-picks &middot; {cherryPicks.length} moments
      </p>
      <ul className="rounded-lg border border-stewart-border overflow-hidden divide-y divide-stewart-border">
        {cherryPicks.map((cp, i) => {
          const tone = classTone(cp.classification);
          const isSelected = i === selectedIdx;
          const isPriority = cp.ts === priorityTs;
          return (
            <li key={i}>
              <button
                onClick={() => onSelect(i)}
                className={
                  "w-full text-left px-4 py-3 flex items-start gap-3 transition-colors " +
                  (isSelected
                    ? "bg-stewart-accent/15 border-l-2 border-stewart-accent"
                    : "bg-stewart-card hover:bg-stewart-bg/40 border-l-2 border-transparent")
                }
              >
                <span
                  className={`shrink-0 mt-1.5 w-2 h-2 rounded-full ${tone.dot}`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-mono text-xs text-stewart-text">
                      {cp.ts}
                    </span>
                    {isPriority ? (
                      <span className="text-[9px] uppercase tracking-wider font-mono text-stewart-accent">
                        priority 1
                      </span>
                    ) : null}
                  </div>
                  <p
                    className={
                      "text-xs mt-0.5 " +
                      (isSelected
                        ? "text-stewart-text"
                        : "text-stewart-muted")
                    }
                  >
                    {tone.label}
                  </p>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function MomentDetail({
  moment,
  callId,
}: {
  moment: CherryPick;
  callId: string;
}) {
  const tone = classTone(moment.classification);
  return (
    <div className="lg:col-span-8 rounded-lg border border-stewart-border bg-stewart-card p-5 sm:p-7 space-y-5">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div className="flex flex-wrap items-baseline gap-3">
          <span className="font-mono text-sm text-stewart-text">
            {moment.ts}
          </span>
          <span
            className={
              "text-xs font-mono uppercase tracking-wider rounded px-2 py-1 border " +
              tone.chip
            }
          >
            {tone.label}
          </span>
        </div>
        {moment.codex_reference ? (
          <code className="text-[11px] text-stewart-accent font-mono">
            codex &middot; {moment.codex_reference}
          </code>
        ) : null}
      </div>

      <blockquote className="border-l-2 border-stewart-accent pl-4 text-stewart-text italic leading-relaxed">
        &ldquo;{moment.quote}&rdquo;
      </blockquote>

      <AudioPlayer
        callId={callId}
        startSec={tsToSeconds(moment.ts)}
        endSec={tsToSeconds(moment.ts) + CLIP_DURATION_SEC}
      />

      <div>
        <p className="text-xs uppercase tracking-wider text-stewart-muted mb-2">
          Stewart&apos;s read
        </p>
        <p className="text-sm text-stewart-text leading-relaxed">
          {moment.stewart_read}
        </p>
      </div>

      {moment.alternative_hypothesis ? (
        <div>
          <p className="text-xs uppercase tracking-wider text-stewart-muted mb-2">
            Alternative hypothesis
          </p>
          <p className="text-sm text-stewart-muted leading-relaxed">
            {moment.alternative_hypothesis}
          </p>
        </div>
      ) : null}

      <div className="pt-4 border-t border-stewart-border">
        <p className="text-xs uppercase tracking-wider text-stewart-warning mb-2">
          Coaching implication
        </p>
        <p className="text-sm text-stewart-text leading-relaxed">
          {moment.coaching_implication}
        </p>
      </div>
    </div>
  );
}

function AudioPlayer({
  callId,
  startSec,
  endSec,
}: {
  callId: string;
  startSec: number;
  endSec: number;
}) {
  const [active, setActive] = useState(false);
  const dur = Math.max(0, endSec - startSec);
  const baseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    "";
  const qs = new URLSearchParams({
    start: startSec.toFixed(3),
    end: endSec.toFixed(3),
  });
  const url = `${baseUrl}/api/ion/audio-clip/${encodeURIComponent(
    callId
  )}?${qs.toString()}`;

  if (!active) {
    return (
      <button
        onClick={() => setActive(true)}
        className="inline-flex items-center gap-2 px-3 py-2 rounded border border-stewart-accent/40 bg-stewart-accent/10 text-stewart-accent text-sm hover:bg-stewart-accent/20 transition-colors"
      >
        <PlayIcon />
        Play clip ({dur.toFixed(0)}s)
      </button>
    );
  }
  return (
    <div className="flex items-center gap-3">
      <audio src={url} controls autoPlay preload="auto" className="h-10" />
      <span className="text-xs text-stewart-muted font-mono">
        clip {formatTs(startSec)} &rarr; {formatTs(endSec)}
      </span>
    </div>
  );
}

function PlayIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function formatTs(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

function ManagerBriefCard({
  brief,
  onExpandTrajectory,
}: {
  brief: import("./types").ManagerBrief;
  onExpandTrajectory: () => void;
}) {
  return (
    <div className="rounded-lg border border-stewart-border bg-stewart-card p-6 sm:p-8 space-y-5">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h3 className="text-sm uppercase tracking-wider font-semibold text-stewart-accent">
          Manager brief &middot; 90-second card
        </h3>
        <span className="text-xs font-mono text-stewart-muted">
          shape: {brief.shape}
        </span>
      </div>

      <div>
        <p className="text-xs uppercase tracking-wider text-stewart-muted mb-2">
          Trajectory
        </p>
        <p className="text-sm text-stewart-text leading-relaxed">
          {brief.trajectory_summary}
        </p>
      </div>

      {brief.outcome_dispute ? (
        <div className="rounded border border-stewart-warning/40 bg-stewart-warning/5 p-3">
          <p className="text-xs uppercase tracking-wider text-stewart-warning mb-1">
            Outcome dispute
          </p>
          <p className="text-sm text-stewart-text leading-relaxed">
            {brief.outcome_dispute}
          </p>
        </div>
      ) : null}

      <div>
        <p className="text-xs uppercase tracking-wider text-stewart-muted mb-2">
          Primary coaching focus
        </p>
        <div className="space-y-2">
          <p className="text-sm text-stewart-text">
            <span className="font-semibold">Topic:</span>{" "}
            {brief.primary_coaching_focus.topic}
          </p>
          <p className="text-sm text-stewart-muted leading-relaxed">
            <span className="text-xs uppercase tracking-wider text-stewart-accent">
              Why:
            </span>{" "}
            {brief.primary_coaching_focus.why}
          </p>
        </div>
      </div>

      <div>
        <button
          onClick={onExpandTrajectory}
          className="text-sm text-stewart-accent hover:underline"
        >
          See full trajectory analysis &rarr;
        </button>
      </div>
    </div>
  );
}

function CriticAuditCallout() {
  return (
    <div className="rounded-lg border border-stewart-accent/40 bg-stewart-accent/5 p-4 sm:p-5 flex items-start gap-3">
      <span className="shrink-0 mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full border border-stewart-accent/40 text-stewart-accent text-xs font-mono">
        ✓
      </span>
      <div className="space-y-1">
        <p className="text-sm text-stewart-text">
          <span className="font-semibold">Stewart&apos;s critic audit</span>{" "}
          caught 1 fabricated quote in the first Stage 3 pass on this
          call. Revision pass corrected it before this brief was
          produced.
        </p>
        <p className="text-xs text-stewart-muted italic">
          The cross-vendor critic is what makes the brief trustworthy. It
          runs on every call, not just spot-checks.
        </p>
      </div>
    </div>
  );
}

function Session18Panel({
  bundle,
  expanded,
  onToggle,
}: {
  bundle: CallBundle;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <section className="rounded-lg border border-stewart-success/30 bg-stewart-success/5 p-6 sm:p-8">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wider font-semibold text-stewart-success mb-1">
            What about a call that went well?
          </p>
          <h3 className="text-lg sm:text-xl font-semibold text-stewart-text leading-snug">
            SESSION 18 &mdash; Randy&apos;s call with Juan. Booked
            qualified in 4 minutes.
          </h3>
        </div>
        <button
          onClick={onToggle}
          className="text-sm text-stewart-accent hover:underline"
        >
          {expanded ? "Hide handoff →" : "Expand handoff brief →"}
        </button>
      </div>

      <p className="mt-4 text-sm text-stewart-text leading-relaxed max-w-3xl">
        Stewart&apos;s manager brief flagged Juan&apos;s spouse-protocol
        handling as exemplary &mdash; presumptive gray-matter for{" "}
        <code className="text-stewart-accent text-xs">
          protocols.spouse_decision
        </code>
        . Here&apos;s the closer-facing artifact Stewart produces alongside
        the manager view.
      </p>

      {expanded && bundle.handoff ? (
        <HandoffCard handoff={bundle.handoff} />
      ) : null}
    </section>
  );
}

function HandoffCard({ handoff }: { handoff: Handoff }) {
  return (
    <div className="mt-6 rounded-lg border border-stewart-border bg-stewart-card p-5 sm:p-6 space-y-5">
      <p className="text-xs uppercase tracking-wider font-semibold text-stewart-accent">
        Handoff brief &middot; for the closer
      </p>

      <div>
        <p className="text-xs uppercase tracking-wider text-stewart-muted mb-2">
          Customer anxiety profile
        </p>
        <p className="text-sm text-stewart-text leading-relaxed">
          {handoff.customer_anxiety_profile}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <p className="text-xs uppercase tracking-wider text-stewart-muted mb-2">
            Unresolved concerns
          </p>
          <ul className="space-y-2">
            {handoff.unresolved_concerns.map((c, i) => (
              <li
                key={i}
                className="flex gap-2 text-sm text-stewart-text leading-relaxed"
              >
                <span className="text-stewart-warning mt-1 shrink-0">▸</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-stewart-muted mb-2">
            Exact promises rep made
          </p>
          <ul className="space-y-2">
            {handoff.exact_promises_rep_made.map((c, i) => (
              <li
                key={i}
                className="flex gap-2 text-sm text-stewart-text leading-relaxed"
              >
                <span className="text-stewart-accent mt-1 shrink-0">▸</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="rounded border border-stewart-accent/40 bg-stewart-accent/5 p-4">
        <p className="text-xs uppercase tracking-wider text-stewart-accent mb-2">
          Closer should know
        </p>
        <p className="text-sm text-stewart-text leading-relaxed font-medium">
          {handoff.closer_should_know}
        </p>
      </div>
    </div>
  );
}

function TrajectoryDrawer({
  brief,
  onClose,
}: {
  brief: import("./types").ManagerBrief;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-stewart-card border border-stewart-border rounded-lg max-w-3xl w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-stewart-card border-b border-stewart-border px-6 py-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-stewart-text">
            Full trajectory &mdash; {brief.call_id}
          </h3>
          <button
            onClick={onClose}
            className="text-stewart-muted hover:text-stewart-text text-sm"
          >
            Close ✕
          </button>
        </div>
        <div className="px-6 py-5 space-y-5">
          <div>
            <p className="text-xs uppercase tracking-wider text-stewart-muted mb-2">
              Trajectory summary
            </p>
            <p className="text-sm text-stewart-text leading-relaxed">
              {brief.trajectory_summary}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-stewart-muted mb-3">
              Key moments
            </p>
            <ol className="space-y-4">
              {brief.key_moments.map((km, i) => (
                <li
                  key={i}
                  className="border-l-2 border-stewart-accent/40 pl-4"
                >
                  <div className="flex items-baseline gap-3 mb-1">
                    <span className="font-mono text-xs text-stewart-text">
                      {km.ts}
                    </span>
                    <span
                      className={`text-xs font-mono ${
                        classTone(km.classification).chip
                      } rounded px-1.5 py-0.5 border`}
                    >
                      {classTone(km.classification).label}
                    </span>
                  </div>
                  <blockquote className="text-sm text-stewart-muted italic mb-2">
                    &ldquo;{km.quote}&rdquo;
                  </blockquote>
                  <p className="text-sm text-stewart-text leading-relaxed">
                    {km.stewart_read}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
