"use client";

import type {
  BrainV2Payload,
  Moon,
  Planet,
  Tile,
} from "./types";
import { AudioClip, tsToSeconds } from "../../_components/AudioClip.client";
import { FullCallDetail } from "../../_components/FullCallDetail.client";

const CLIP_DURATION_SEC = 20;

export type Selection =
  | { kind: "core" }
  | { kind: "tile"; tile: Tile }
  | { kind: "planet"; planet: Planet }
  | {
      kind: "moon";
      planet: Planet;
      moon: Moon;
      planetSelectedFromMoon: boolean;
    };

// Side-docked detail panel. Renders the card stack for whichever node
// the user clicked. Per the V2 brief, the spec called for cards that
// "explode" out of the clicked node with connecting lines — see
// notes/open-questions.md § Brain V2.1 for the animated-choreography
// deferral. V2 ships the same data model as a docked panel.

// V2.0.1: rendered as a side-docked panel by BrainPageShell, no longer
// overlaid on the brain canvas. Layout uses a flex column so the
// header sticks while the card stack scrolls.

export function DetailPanel({
  payload,
  selection,
  onClose,
}: {
  payload: BrainV2Payload;
  selection: Selection | null;
  onClose: () => void;
}) {
  if (!selection) return null;
  // V2.0.3: card flows naturally below the brain — no internal
  // scroll. Page scroll carries any long content.
  return (
    <div className="bg-stewart-card border border-stewart-border rounded-lg shadow-2xl">
      <header className="bg-stewart-card border-b border-stewart-border px-4 py-3 flex items-center justify-between gap-3">
        <span className="text-[10px] uppercase tracking-wider font-mono text-stewart-muted truncate">
          {labelFor(selection)}
        </span>
        <button
          onClick={onClose}
          className="text-stewart-muted hover:text-stewart-text text-sm shrink-0"
        >
          close ✕
        </button>
      </header>
      <div className="px-5 py-5">
        {selection.kind === "core" ? (
          <CoreMeta payload={payload} />
        ) : selection.kind === "tile" ? (
          <TileDetail tile={selection.tile} />
        ) : (
          // planet OR moon: same view — the moon click is just an
          // entry point into its parent call's folder. The full-detail
          // fetch hits the same JSONs either way.
          <PlanetDetail planet={selection.planet} />
        )}
      </div>
    </div>
  );
}

function labelFor(s: Selection): string {
  if (s.kind === "core") return "Codex meta · click anywhere on the core";
  if (s.kind === "tile") return `Codex tile · ${s.tile.codex_section}`;
  if (s.kind === "planet") return `Call · ${s.planet.call_id}`;
  return `Cherry-pick @ ${s.moon.ts} · ${s.planet.call_id}`;
}

function CoreMeta({ payload }: { payload: BrainV2Payload }) {
  const s = payload.stats;
  const domainCounts: Record<string, number> = {};
  for (const t of payload.core.tiles) {
    if (!t.is_active) continue;
    domainCounts[t.domain] = (domainCounts[t.domain] || 0) + 1;
  }
  const topDomains = Object.entries(domainCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8);

  // Top-referenced sections by call_count (extract from section_data if present)
  const topReferenced = payload.core.tiles
    .filter(
      (t): t is Tile & { section_data: { call_ids: string[] } } =>
        t.is_active && Array.isArray(t.section_data?.call_ids)
    )
    .sort(
      (a, b) => (b.section_data.call_ids?.length || 0) - (a.section_data.call_ids?.length || 0)
    )
    .slice(0, 6);

  return (
    <div className="space-y-6">
      <Card title="The codex at a glance">
        <p className="text-sm text-stewart-text leading-relaxed">
          {s.sections_lit} codex sections lit by Stewart&apos;s reads
          across {s.calls_total.toLocaleString()} processed calls.{" "}
          {s.tbds_remaining} TBDs Spencer + Kenny still own.{" "}
          {s.proposed_pending} new categories pending Kenny approval.
        </p>
      </Card>

      <Card title="Domains lit">
        <ul className="space-y-1 text-xs font-mono">
          {topDomains.map(([d, n]) => (
            <li key={d} className="flex items-center justify-between gap-2">
              <span className="text-stewart-text">
                {d.replace(/_/g, " ")}
              </span>
              <span className="text-stewart-muted">{n}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card title="Most referenced sections">
        <ul className="space-y-2 text-xs">
          {topReferenced.map((t) => (
            <li key={t.tile_index} className="flex items-baseline justify-between gap-3">
              <code className="text-stewart-accent font-mono truncate">
                {t.codex_section}
              </code>
              <span className="text-stewart-muted font-mono">
                {t.section_data.call_ids.length} calls
              </span>
            </li>
          ))}
        </ul>
      </Card>

      <Card title="Pending Kenny">
        <p className="text-sm text-stewart-text leading-relaxed">
          {s.tbds_remaining} open TBDs marked in the codex.{" "}
          {s.proposed_pending} new categories proposed by Stewart&apos;s
          pattern analyzer (plus Spencer&apos;s softener catch). All
          surface on the codex page.
        </p>
      </Card>
    </div>
  );
}

function TileDetail({ tile }: { tile: Tile }) {
  const sd = (tile.section_data || {}) as {
    call_ids?: string[];
    pattern_counts_by_classification?: Record<string, number>;
    outcomes?: Record<string, number>;
    gray_matter_exemplars?: Array<{
      call_id: string;
      exemplifies: string;
      reason?: string;
    }>;
    recent_examples?: Array<{
      call_id: string;
      ts: string;
      quote: string;
      classification: string;
    }>;
  };
  const callCount = sd.call_ids?.length || 0;
  const classifications = Object.entries(
    sd.pattern_counts_by_classification || {}
  ).sort(([, a], [, b]) => b - a);
  const outcomes = Object.entries(sd.outcomes || {}).sort(
    ([, a], [, b]) => b - a
  );
  const grays = sd.gray_matter_exemplars || [];
  const examples = (sd.recent_examples || []).slice(0, 4);

  return (
    <div className="space-y-5">
      <Card title="Section">
        <code className="text-sm font-mono text-stewart-accent break-all">
          {tile.codex_section}
        </code>
        <p className="text-xs text-stewart-muted mt-1">
          Domain: <span className="text-stewart-text">{tile.domain}</span>
        </p>
      </Card>

      {callCount > 0 ? (
        <Card title="From your corpus">
          <p className="text-xs text-stewart-muted">
            <span className="text-stewart-text font-mono">{callCount}</span>{" "}
            calls reference this section
          </p>
          {classifications.length > 0 ? (
            <ul className="mt-2 space-y-1 text-xs">
              {classifications.slice(0, 4).map(([k, n]) => (
                <li
                  key={k}
                  className="flex items-center justify-between gap-2"
                >
                  <span className="text-stewart-text">
                    {k.replace(/_/g, " ")}
                  </span>
                  <span className="text-stewart-muted font-mono">{n}</span>
                </li>
              ))}
            </ul>
          ) : null}
          {outcomes.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1">
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
          ) : null}
        </Card>
      ) : (
        <Card title="From your corpus">
          <p className="text-xs text-stewart-muted">
            No calls reference this section yet.
          </p>
        </Card>
      )}

      {grays.length > 0 ? (
        <Card title="Gray-matter exemplars">
          <ul className="space-y-2">
            {grays.map((g, i) => (
              <li
                key={i}
                className="rounded border border-amber-400/30 bg-amber-400/5 p-2 text-xs"
              >
                <code className="text-stewart-accent font-mono">
                  {g.call_id}
                </code>
                {g.reason ? (
                  <p className="text-stewart-text mt-1 leading-snug">
                    {g.reason}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {examples.length > 0 ? (
        <Card title="Recent moments">
          <ul className="space-y-3">
            {examples.map((ex, i) => {
              const start = tsToSeconds(ex.ts);
              return (
                <li
                  key={i}
                  className="rounded border border-stewart-border bg-stewart-bg/40 p-2 text-xs"
                >
                  <p className="font-mono text-stewart-muted mb-1">
                    {ex.call_id} @ {ex.ts}{" "}
                    <span className="text-stewart-muted/70">
                      ({ex.classification.replace(/_/g, " ")})
                    </span>
                  </p>
                  <blockquote className="text-stewart-text italic leading-snug">
                    &ldquo;{ex.quote}&rdquo;
                  </blockquote>
                  <div className="mt-2">
                    <AudioClip
                      callId={ex.call_id}
                      startSec={start}
                      endSec={start + CLIP_DURATION_SEC}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      ) : null}
    </div>
  );
}

function PlanetDetail({ planet }: { planet: Planet }) {
  // Brain V2.0.2: PlanetDetail now mirrors the /ion/calls drawer
  // depth via the shared <FullCallDetail/>. Planet metadata from the
  // payload feeds the summary header; manager-brief + cherrypicks +
  // handoff + critic audit lazy-fetch from public/ion/calls/*.json.
  return (
    <div className="space-y-5">
      <FullCallDetail
        callId={planet.call_id}
        summary={{
          rep_id: planet.rep_id,
          outcome: planet.outcome,
          duration_min: planet.duration_min,
          is_hero: planet.is_hero,
          is_gray_matter: planet.is_gray_matter,
          gray_matter_section: planet.gray_matter_section,
        }}
      />
      <Card title="In Stewart's brain">
        <p className="text-xs text-stewart-muted leading-relaxed">
          Absorption factor:{" "}
          <span className="text-stewart-text font-mono">
            {planet.absorption_factor.toFixed(2)}
          </span>{" "}
          (gray-matter never absorbs; otherwise quantity-per-section
          rank gates visibility).
        </p>
      </Card>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <p className="text-[10px] uppercase tracking-wider font-semibold text-stewart-accent mb-2">
        {title}
      </p>
      {children}
    </section>
  );
}
