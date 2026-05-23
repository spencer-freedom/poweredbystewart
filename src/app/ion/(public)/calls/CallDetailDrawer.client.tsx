"use client";

import { useEffect, useState } from "react";
import type { CallSummary } from "./types";

// Lazy-loaded detail panel for a single call. Fetches the three
// per-call JSONs on open (manager-brief, cherrypicks, handoff). Slides
// in from the right on desktop, full-screen on mobile.

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

type DetailState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | {
      kind: "loaded";
      brief: ManagerBrief | null;
      picks: CherryPick[];
      handoff: Handoff | null;
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

export function CallDetailDrawer({
  callId,
  summary,
  onClose,
}: {
  callId: string;
  summary: CallSummary | null;
  onClose: () => void;
}) {
  const [state, setState] = useState<DetailState>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    setState({ kind: "loading" });
    const slug = slugify(callId);
    Promise.all([
      fetchJsonOrNull<ManagerBrief>(`/ion/calls/${slug}-manager-brief.json`),
      fetchJsonOrNull<CherryPick[]>(`/ion/calls/${slug}-cherrypicks.json`),
      fetchJsonOrNull<Handoff>(`/ion/calls/${slug}-handoff.json`),
    ])
      .then(([brief, picks, handoff]) => {
        if (cancelled) return;
        setState({
          kind: "loaded",
          brief,
          picks: picks || [],
          handoff: handoff || null,
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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

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
          <div className="flex items-baseline gap-3">
            <span className="font-mono text-sm text-stewart-accent">
              {summary?.is_hero ? "⭐ " : ""}
              {callId}
            </span>
            {summary ? (
              <>
                <span className="text-xs text-stewart-muted">
                  {summary.rep_id || "—"}
                </span>
                <span className="text-xs font-mono uppercase tracking-wider text-stewart-muted">
                  {(summary.outcome || "unknown").replace(/_/g, " ")}
                </span>
                <span className="text-xs font-mono text-stewart-muted">
                  {summary.duration_min.toFixed(0)} min
                </span>
              </>
            ) : null}
          </div>
          <button
            onClick={onClose}
            className="text-stewart-muted hover:text-stewart-text text-sm"
          >
            Close ✕
          </button>
        </header>

        <div className="px-5 py-6 space-y-6">
          {state.kind === "loading" ? (
            <p className="text-sm text-stewart-muted">
              Loading {callId}…
            </p>
          ) : null}

          {state.kind === "error" ? (
            <p className="text-sm text-stewart-danger">
              Couldn&apos;t load this call &mdash; {state.message}
            </p>
          ) : null}

          {state.kind === "loaded" ? (
            <DetailBody
              summary={summary}
              brief={state.brief}
              picks={state.picks}
              handoff={state.handoff}
            />
          ) : null}
        </div>
      </aside>
    </div>
  );
}

function DetailBody({
  summary,
  brief,
  picks,
  handoff,
}: {
  summary: CallSummary | null;
  brief: ManagerBrief | null;
  picks: CherryPick[];
  handoff: Handoff | null;
}) {
  return (
    <div className="space-y-7">
      {summary?.tagline ? (
        <p className="text-base italic text-stewart-text leading-snug border-l-2 border-stewart-accent pl-4">
          &ldquo;{summary.tagline}&rdquo;
        </p>
      ) : null}

      {summary?.is_gray_matter ? (
        <div className="rounded border border-amber-400/40 bg-amber-400/5 p-3 text-xs">
          <p className="uppercase tracking-wider text-amber-400 font-semibold mb-1">
            Gray-matter exemplar
          </p>
          <p className="text-stewart-text">
            Presumptive exemplar for{" "}
            <code className="text-stewart-accent text-xs">
              {summary.gray_matter_section}
            </code>{" "}
            &mdash; pending Kenny validation.
          </p>
        </div>
      ) : null}

      {brief ? (
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
      ) : null}

      {picks.length > 0 ? (
        <section className="space-y-3">
          <h3 className="text-xs uppercase tracking-wider font-semibold text-stewart-accent">
            Cherry-picks &middot; {picks.length} moments
          </h3>
          <ul className="space-y-3">
            {picks.map((p, i) => (
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
                <p className="text-xs text-stewart-warning leading-relaxed">
                  <span className="uppercase tracking-wider">Coach: </span>
                  {p.coaching_implication}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {handoff?.applicable && handoff.closer_should_know ? (
        <section className="space-y-3">
          <h3 className="text-xs uppercase tracking-wider font-semibold text-stewart-success">
            Handoff brief
          </h3>
          {handoff.customer_anxiety_profile ? (
            <p className="text-sm text-stewart-text leading-relaxed">
              {handoff.customer_anxiety_profile}
            </p>
          ) : null}
          {handoff.unresolved_concerns?.length ? (
            <div>
              <p className="text-xs uppercase tracking-wider text-stewart-muted mb-1">
                Unresolved
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
          {handoff.closer_should_know ? (
            <div className="rounded border border-stewart-accent/40 bg-stewart-accent/5 p-3 text-sm text-stewart-text">
              <p className="text-xs uppercase tracking-wider text-stewart-accent mb-1">
                Closer should know
              </p>
              {handoff.closer_should_know}
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="rounded border border-stewart-border bg-stewart-bg/40 p-3">
        <p className="text-xs uppercase tracking-wider text-stewart-muted mb-1">
          Stewart&apos;s critic audit
        </p>
        <p className="text-xs text-stewart-text leading-relaxed">
          Runs on every call. Verifies every quote, flags fabrications,
          gates the brief shipping. This brief cleared the critic before
          you saw it.
        </p>
      </section>
    </div>
  );
}
