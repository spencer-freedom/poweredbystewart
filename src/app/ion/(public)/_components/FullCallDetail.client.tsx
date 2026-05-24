"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AudioClip, tsToSeconds } from "./AudioClip.client";

// Shared per-call detail renderer. Lazy-fetches the three per-call
// JSON files from public/ion/calls/ and renders the full coaching
// folder — manager brief + cherry-picks (with audio clips) + handoff
// brief (when booked) + critic audit summary.
//
// Used by:
//   - /ion/calls CallDetailDrawer (slides in from the right on the
//     all-calls page)
//   - brain V2 PlanetDetail (rendered inline in the side-docked
//     detail panel when a planet is clicked)
//
// The two surfaces pass a tiny `summary` shape so the header strip
// can render whatever metadata they happen to have on hand without
// the component re-fetching.

const CLIP_DURATION_SEC = 20;

type ManagerBrief = {
  call_id: string;
  trajectory_summary: string;
  shape: string;
  outcome_dispute: string | null;
  primary_coaching_focus: {
    topic: string;
    ts: string;
    quote: string;
    why: string;
  };
};

type CherryPick = {
  ts: string;
  quote: string;
  classification: string;
  codex_reference: string | null;
  stewart_read: string;
  alternative_hypothesis: string | null;
  coaching_implication: string;
};

type Handoff = {
  applicable: boolean;
  customer_anxiety_profile?: string;
  unresolved_concerns?: string[];
  sensitive_topics_raised?: string[];
  exact_promises_rep_made?: string[];
  closer_should_know?: string;
};

type CriticAudit = {
  verdict?: string;
  fabricated_quotes?: number;
  weak_reasoning?: number;
  revision_summary?: string;
  flags_count?: number;
};

export type FullCallDetailSummary = {
  rep_id?: string | null;
  outcome?: string | null;
  duration_min?: number | null;
  is_hero?: boolean;
  is_gray_matter?: boolean;
  gray_matter_section?: string | null;
  tagline?: string | null;
};

type LoadState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | {
      kind: "loaded";
      brief: ManagerBrief | null;
      picks: CherryPick[];
      handoff: Handoff | null;
      critic: CriticAudit | null;
    };

function slugify(callId: string): string {
  return callId.toLowerCase();
}

async function fetchJsonOrNull<T>(url: string): Promise<T | null> {
  const r = await fetch(url, { cache: "no-store" });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`${url} ${r.status}`);
  return (await r.json()) as T;
}

export function FullCallDetail({
  callId,
  summary,
  showCrossLink = true,
}: {
  callId: string;
  summary?: FullCallDetailSummary | null;
  showCrossLink?: boolean;
}) {
  const [state, setState] = useState<LoadState>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    setState({ kind: "loading" });
    const slug = slugify(callId);
    Promise.all([
      fetchJsonOrNull<ManagerBrief>(`/ion/calls/${slug}-manager-brief.json`),
      fetchJsonOrNull<CherryPick[]>(`/ion/calls/${slug}-cherrypicks.json`),
      fetchJsonOrNull<Handoff>(`/ion/calls/${slug}-handoff.json`),
      fetchJsonOrNull<CriticAudit>(`/ion/calls/${slug}-critic-audit.json`),
    ])
      .then(([brief, picks, handoff, critic]) => {
        if (cancelled) return;
        setState({
          kind: "loaded",
          brief,
          picks: picks || [],
          handoff: handoff || null,
          critic: critic || null,
        });
      })
      .catch((e) => {
        if (cancelled) return;
        setState({ kind: "error", message: String(e) });
      });
    return () => {
      cancelled = true;
    };
  }, [callId]);

  return (
    <div className="space-y-7">
      <CallHeader callId={callId} summary={summary} />

      {state.kind === "loading" ? (
        <p className="text-sm text-stewart-muted">Loading {callId}…</p>
      ) : null}

      {state.kind === "error" ? (
        <p className="text-sm text-stewart-danger">
          Couldn&apos;t load this call &mdash; {state.message}
        </p>
      ) : null}

      {state.kind === "loaded" ? (
        <>
          <ManagerBriefBlock brief={state.brief} />
          <CherryPicksBlock callId={callId} picks={state.picks} />
          <HandoffBlock handoff={state.handoff} />
          <CriticAuditBlock critic={state.critic} />
        </>
      ) : null}

      {showCrossLink ? (
        <div className="pt-3 border-t border-stewart-border">
          <Link
            href={`/ion/calls#${callId}`}
            className="text-xs text-stewart-accent hover:underline"
          >
            Open this call in the full list view &rarr;
          </Link>
        </div>
      ) : null}
    </div>
  );
}

function CallHeader({
  callId,
  summary,
}: {
  callId: string;
  summary?: FullCallDetailSummary | null;
}) {
  return (
    <section>
      <div className="flex flex-wrap items-baseline gap-3 mb-2">
        <code className="font-mono text-sm text-stewart-accent">
          {summary?.is_hero ? "⭐ " : ""}
          {callId}
        </code>
        {summary?.is_gray_matter ? (
          <span className="text-[10px] uppercase tracking-wider font-mono text-amber-400 border border-amber-400/40 rounded px-1.5 py-0.5">
            ⬢ gray-matter
          </span>
        ) : null}
        {summary?.rep_id ? (
          <span className="text-xs text-stewart-muted">
            {summary.rep_id}
          </span>
        ) : null}
        {summary?.outcome ? (
          <span className="text-xs font-mono uppercase tracking-wider text-stewart-muted">
            {summary.outcome.replace(/_/g, " ")}
          </span>
        ) : null}
        {typeof summary?.duration_min === "number" ? (
          <span className="text-xs font-mono text-stewart-muted">
            {summary.duration_min.toFixed(0)} min
          </span>
        ) : null}
      </div>
      {summary?.tagline ? (
        <p className="text-base italic text-stewart-text leading-snug border-l-2 border-stewart-accent pl-4 mt-2">
          &ldquo;{summary.tagline}&rdquo;
        </p>
      ) : null}
      {summary?.is_gray_matter && summary.gray_matter_section ? (
        <p className="text-[11px] text-amber-400 mt-2 font-mono">
          EXEMPLAR for {summary.gray_matter_section}
        </p>
      ) : null}
      <div className="mt-3">
        <AudioClip callId={callId} variant="full" />
      </div>
    </section>
  );
}

function ManagerBriefBlock({ brief }: { brief: ManagerBrief | null }) {
  if (!brief) return null;
  return (
    <section className="space-y-3">
      <h3 className="text-xs uppercase tracking-wider font-semibold text-stewart-accent">
        Manager brief
      </h3>
      <p className="text-xs text-stewart-muted font-mono">
        shape: {brief.shape}
      </p>
      <p className="text-sm text-stewart-text leading-relaxed">
        {brief.trajectory_summary}
      </p>
      {brief.outcome_dispute ? (
        <div className="rounded border border-stewart-warning/40 bg-stewart-warning/5 p-3 text-xs">
          <p className="uppercase tracking-wider text-stewart-warning mb-1">
            Outcome dispute
          </p>
          <p className="text-stewart-text leading-relaxed">
            {brief.outcome_dispute}
          </p>
        </div>
      ) : null}
      <div>
        <p className="text-xs uppercase tracking-wider text-stewart-muted mb-1">
          Primary coaching focus
        </p>
        <p className="text-sm text-stewart-text">
          <span className="font-semibold">
            {brief.primary_coaching_focus.topic}
          </span>{" "}
          <span className="font-mono text-stewart-accent">
            @ {brief.primary_coaching_focus.ts}
          </span>
        </p>
        <p className="text-sm text-stewart-muted leading-relaxed mt-1">
          {brief.primary_coaching_focus.why}
        </p>
      </div>
    </section>
  );
}

function CherryPicksBlock({
  callId,
  picks,
}: {
  callId: string;
  picks: CherryPick[];
}) {
  if (picks.length === 0) return null;
  return (
    <section className="space-y-3">
      <h3 className="text-xs uppercase tracking-wider font-semibold text-stewart-accent">
        Cherry-picks &middot; {picks.length} moments
      </h3>
      <ul className="space-y-3">
        {picks.map((p, i) => {
          const start = tsToSeconds(p.ts);
          return (
            <li
              key={i}
              className="rounded border border-stewart-border bg-stewart-card p-4 space-y-2"
            >
              <div className="flex flex-wrap items-baseline gap-3 text-xs">
                <span className="font-mono text-stewart-text">{p.ts}</span>
                <span className="text-stewart-muted">
                  {p.classification.replace(/_/g, " ")}
                </span>
                {p.codex_reference ? (
                  <code className="text-stewart-accent font-mono">
                    {p.codex_reference}
                  </code>
                ) : null}
              </div>
              <blockquote className="text-sm text-stewart-text italic border-l border-stewart-accent pl-3">
                &ldquo;{p.quote}&rdquo;
              </blockquote>
              <p className="text-xs text-stewart-muted leading-relaxed">
                <span className="text-stewart-text">Read: </span>
                {p.stewart_read}
              </p>
              {p.alternative_hypothesis ? (
                <p className="text-xs text-stewart-muted leading-relaxed">
                  <span className="text-stewart-text">Alt hypothesis: </span>
                  {p.alternative_hypothesis}
                </p>
              ) : null}
              <p className="text-xs text-stewart-warning leading-relaxed">
                <span className="uppercase tracking-wider">Coach: </span>
                {p.coaching_implication}
              </p>
              <div className="pt-1">
                <AudioClip
                  callId={callId}
                  startSec={start}
                  endSec={start + CLIP_DURATION_SEC}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function HandoffBlock({ handoff }: { handoff: Handoff | null }) {
  if (!handoff?.applicable || !handoff.closer_should_know) return null;
  return (
    <section className="space-y-3">
      <h3 className="text-xs uppercase tracking-wider font-semibold text-stewart-success">
        Handoff brief &middot; for the closer
      </h3>
      {handoff.customer_anxiety_profile ? (
        <p className="text-sm text-stewart-text leading-relaxed">
          <span className="text-xs uppercase tracking-wider text-stewart-muted block mb-1">
            Customer anxiety profile
          </span>
          {handoff.customer_anxiety_profile}
        </p>
      ) : null}
      {handoff.unresolved_concerns?.length ? (
        <div>
          <p className="text-xs uppercase tracking-wider text-stewart-muted mb-1">
            Unresolved concerns
          </p>
          <ul className="space-y-1 text-xs text-stewart-text">
            {handoff.unresolved_concerns.map((c, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-stewart-warning shrink-0">▸</span>
                {c}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {handoff.sensitive_topics_raised?.length ? (
        <div>
          <p className="text-xs uppercase tracking-wider text-stewart-muted mb-1">
            Sensitive topics
          </p>
          <ul className="space-y-1 text-xs text-stewart-text">
            {handoff.sensitive_topics_raised.map((c, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-stewart-muted shrink-0">▸</span>
                {c}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {handoff.exact_promises_rep_made?.length ? (
        <div>
          <p className="text-xs uppercase tracking-wider text-stewart-muted mb-1">
            Exact promises rep made
          </p>
          <ul className="space-y-1 text-xs text-stewart-text">
            {handoff.exact_promises_rep_made.map((c, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-stewart-accent shrink-0">▸</span>
                {c}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <div className="rounded border border-stewart-accent/40 bg-stewart-accent/5 p-3 text-sm text-stewart-text">
        <p className="text-xs uppercase tracking-wider text-stewart-accent mb-1">
          Closer should know
        </p>
        {handoff.closer_should_know}
      </div>
    </section>
  );
}

function CriticAuditBlock({ critic }: { critic: CriticAudit | null }) {
  const [open, setOpen] = useState(false);
  const flagCount =
    (critic?.fabricated_quotes ?? 0) + (critic?.weak_reasoning ?? 0);

  return (
    <section className="rounded border border-stewart-border bg-stewart-bg/40 p-3 text-xs">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 text-left"
      >
        <span>
          <span className="text-stewart-muted uppercase tracking-wider">
            Stewart&apos;s critic audit
          </span>{" "}
          <span className="text-stewart-text">
            {critic
              ? flagCount > 0
                ? `flagged ${flagCount} item${flagCount === 1 ? "" : "s"}`
                : "clean pass"
              : "ran on every call"}
          </span>
        </span>
        <span className="text-stewart-muted">{open ? "− hide" : "+ show"}</span>
      </button>
      {open ? (
        <div className="mt-3 space-y-2 text-stewart-text">
          {critic ? (
            <>
              {typeof critic.fabricated_quotes === "number" ? (
                <p>
                  <span className="text-stewart-muted">Fabricated quotes:</span>{" "}
                  <span className="font-mono">{critic.fabricated_quotes}</span>
                </p>
              ) : null}
              {typeof critic.weak_reasoning === "number" ? (
                <p>
                  <span className="text-stewart-muted">Weak reasoning:</span>{" "}
                  <span className="font-mono">{critic.weak_reasoning}</span>
                </p>
              ) : null}
              {critic.verdict ? (
                <p>
                  <span className="text-stewart-muted">Verdict:</span>{" "}
                  {critic.verdict}
                </p>
              ) : null}
              {critic.revision_summary ? (
                <p className="leading-relaxed">
                  <span className="text-stewart-muted">Revision:</span>{" "}
                  {critic.revision_summary}
                </p>
              ) : null}
            </>
          ) : (
            <p className="text-stewart-muted leading-relaxed">
              The critic ran on this call but the audit JSON isn&apos;t on
              disk for the demo bundle. In production this expand shows
              the full audit trail: every fabricated quote caught, every
              weak-reasoning flag, the verdict, and the revision summary
              that gated the brief from shipping.
            </p>
          )}
        </div>
      ) : null}
    </section>
  );
}
