"use client";

import { useEffect } from "react";
import type {
  Cluster,
  DecisionTreePayload,
  WordTrack,
} from "@/lib/ion-api";
import { AudioClip } from "./audio-clip";

export type Selection =
  | { kind: "cluster"; clusterId: string }
  | { kind: "track"; trackId: string }
  | { kind: "losing"; clusterId: string; index: number }
  | null;

export function TreeSidePanel({
  data,
  selection,
  token,
  onClose,
}: {
  data: DecisionTreePayload;
  selection: Selection;
  token: string;
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
    <>
      <div
        className="absolute inset-0 bg-black/40 z-40"
        onClick={onClose}
        aria-hidden
      />
      <aside
        className="absolute top-0 right-0 bottom-0 w-full sm:w-[480px] bg-stewart-card border-l border-stewart-border z-50 overflow-y-auto"
        role="dialog"
      >
        <div className="sticky top-0 bg-stewart-card border-b border-stewart-border px-5 py-3 flex items-center justify-between z-10">
          <h2 className="text-sm uppercase tracking-wider text-stewart-muted">
            {selection.kind === "cluster"
              ? "Cluster"
              : selection.kind === "losing"
              ? "What didn't work"
              : "Winning word track"}
          </h2>
          <button
            onClick={onClose}
            className="text-stewart-muted hover:text-stewart-text text-xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="px-5 py-5">
          {selection.kind === "cluster" ? (
            <ClusterDetail data={data} clusterId={selection.clusterId} token={token} />
          ) : selection.kind === "losing" ? (
            <LosingDetail
              data={data}
              clusterId={selection.clusterId}
              index={selection.index}
            />
          ) : (
            <TrackDetail data={data} trackId={selection.trackId} token={token} />
          )}
        </div>
      </aside>
    </>
  );
}

function ClusterDetail({
  data,
  clusterId,
  token,
}: {
  data: DecisionTreePayload;
  clusterId: string;
  token: string;
}) {
  const cluster = (data.clusters || []).find((c) => c.id === clusterId);
  if (!cluster) return <p className="text-stewart-muted">Cluster not found.</p>;

  const tracks = (data.word_tracks || [])
    .filter((t) => t.cluster_id === clusterId)
    .sort((a, b) => a.rank - b.rank);
  const losingPatterns = (data.losing_patterns || []).filter(
    (l) => l.cluster_id === clusterId
  );
  const trackIds = new Set(tracks.map((t) => t.id));
  const transitions = (data.transitions || []).filter((tr) =>
    trackIds.has(tr.parent_track_id)
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-stewart-text">{cluster.name}</h3>
        <p className="text-sm text-stewart-muted mt-2 leading-relaxed">
          {cluster.description}
        </p>
        <div className="flex flex-wrap items-center gap-3 mt-3 text-sm">
          <span className="text-stewart-text">
            <strong>{cluster.frequency}</strong> calls
          </span>
          <span className="text-stewart-success">
            <strong>{Math.round(cluster.win_rate * 100)}%</strong> win
          </span>
          <span className="text-stewart-muted">
            {tracks.length} winning · {losingPatterns.length} losing
          </span>
        </div>
      </div>

      {tracks.length > 0 && (
        <Section title="Winning word tracks">
          <ul className="space-y-3">
            {tracks.map((t) => (
              <TrackBlock key={t.id} track={t} token={token} compact />
            ))}
          </ul>
        </Section>
      )}

      {losingPatterns.length > 0 && (
        <Section title="What didn't work">
          <ul className="space-y-2">
            {losingPatterns.map((l, i) => (
              <li
                key={i}
                className="border border-stewart-danger/30 bg-stewart-danger/5 rounded p-3 text-sm"
              >
                <blockquote className="italic text-stewart-text">
                  &ldquo;{l.verbatim}&rdquo;
                </blockquote>
                <p className="text-stewart-muted mt-1.5 text-xs">
                  <strong className="text-stewart-text">Why it lost:</strong>{" "}
                  {l.what_went_wrong}
                </p>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {transitions.length > 0 && (
        <Section title="Observed follow-up transitions">
          <ul className="space-y-2">
            {transitions.map((tr, i) => (
              <li
                key={i}
                className="text-xs text-stewart-text border border-stewart-border rounded p-3"
              >
                <div className="flex items-center gap-2 font-mono">
                  <span className="text-stewart-muted">
                    {tr.parent_track_id} → {tr.next_track_id || "(gave up)"}
                  </span>
                  <span
                    className={
                      tr.condition === "failed"
                        ? "text-stewart-danger"
                        : tr.condition === "partial"
                        ? "text-stewart-warning"
                        : "text-stewart-success"
                    }
                  >
                    {tr.condition}
                  </span>
                  <span className="text-stewart-muted">×{tr.sample_size}</span>
                </div>
                <p className="text-stewart-muted mt-1 leading-snug">{tr.note}</p>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}

function LosingDetail({
  data,
  clusterId,
  index,
}: {
  data: DecisionTreePayload;
  clusterId: string;
  index: number;
}) {
  const cluster = (data.clusters || []).find((c) => c.id === clusterId);
  const losses = (data.losing_patterns || []).filter(
    (l) => l.cluster_id === clusterId
  );
  const losing = losses[index];
  if (!losing) return <p className="text-stewart-muted">Not found.</p>;

  return (
    <div className="space-y-5">
      <div>
        {cluster && (
          <p className="text-xs uppercase tracking-wider text-stewart-muted">
            {cluster.name}
          </p>
        )}
        <h3 className="text-base font-semibold text-stewart-text mt-1">
          What didn&apos;t work
        </h3>
      </div>
      <div className="bg-stewart-danger/5 border border-stewart-danger/30 rounded-lg p-4">
        <blockquote className="text-stewart-text italic leading-relaxed">
          &ldquo;{losing.verbatim}&rdquo;
        </blockquote>
        <p className="text-sm text-stewart-muted mt-3">
          <strong className="text-stewart-text">Why it lost:</strong>{" "}
          {losing.what_went_wrong}
        </p>
        <p className="text-xs text-stewart-muted mt-3">
          From call <code>{losing.source_call_id}</code>
        </p>
      </div>
    </div>
  );
}

function TrackDetail({
  data,
  trackId,
  token,
}: {
  data: DecisionTreePayload;
  trackId: string;
  token: string;
}) {
  const track = (data.word_tracks || []).find((t) => t.id === trackId);
  if (!track) return <p className="text-stewart-muted">Track not found.</p>;
  const cluster = (data.clusters || []).find((c) => c.id === track.cluster_id);

  return (
    <div className="space-y-5">
      <div>
        {cluster && (
          <p className="text-xs uppercase tracking-wider text-stewart-muted">
            {cluster.name}
          </p>
        )}
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-xs font-mono font-bold rounded bg-sky-700 text-white px-2 py-0.5">
            #{track.rank}
          </span>
          <h3 className="text-base font-semibold text-stewart-text">
            Winning word track
          </h3>
        </div>
      </div>
      <TrackBlock track={track} token={token} />
    </div>
  );
}

function TrackBlock({
  track,
  token,
  compact,
}: {
  track: WordTrack;
  token: string;
  compact?: boolean;
}) {
  return (
    <div className="bg-stewart-bg/50 border border-stewart-border rounded-lg p-4">
      <blockquote className="text-stewart-text italic leading-relaxed">
        &ldquo;{track.verbatim}&rdquo;
      </blockquote>
      <p className="text-sm text-stewart-muted mt-3">
        <strong className="text-stewart-text">Why it works:</strong>{" "}
        {track.why_it_works}
      </p>
      <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-stewart-muted">
        {!compact && (
          <span className="font-mono">
            #{track.rank}
          </span>
        )}
        <span>
          From call <code>{track.source_call_id}</code>
        </span>
        {track.source_setter_id && (
          <span>
            rep <code>{track.source_setter_id}</code>
          </span>
        )}
        <span>
          {track.sample_size} example{track.sample_size === 1 ? "" : "s"}
        </span>
        <span>est. {Math.round(track.win_rate * 100)}% win</span>
      </div>
      {typeof track.start_seconds === "number" &&
      typeof track.end_seconds === "number" &&
      track.end_seconds > track.start_seconds ? (
        <div className="mt-3">
          <AudioClip
            token={token}
            callId={track.source_call_id}
            startSec={track.start_seconds}
            endSec={track.end_seconds}
          />
        </div>
      ) : (
        <p className="text-xs text-stewart-muted mt-3 italic">
          Audio clip unavailable for this line.
        </p>
      )}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h4 className="text-xs uppercase tracking-wider text-stewart-muted mb-2">
        {title}
      </h4>
      {children}
    </section>
  );
}

export function selectionFromNodeId(nodeId: string): Selection {
  if (nodeId.startsWith("c:")) {
    return { kind: "cluster", clusterId: nodeId.slice(2) };
  }
  if (nodeId.startsWith("t:")) {
    return { kind: "track", trackId: nodeId.slice(2) };
  }
  if (nodeId.startsWith("l:")) {
    const rest = nodeId.slice(2);
    const lastColon = rest.lastIndexOf(":");
    if (lastColon > -1) {
      return {
        kind: "losing",
        clusterId: rest.slice(0, lastColon),
        index: Number(rest.slice(lastColon + 1)) || 0,
      };
    }
  }
  return null;
}
