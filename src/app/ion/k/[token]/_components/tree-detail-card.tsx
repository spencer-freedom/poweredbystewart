"use client";

import type { DecisionTreePayload } from "@/lib/ion-api";
import { AudioClip } from "./audio-clip";
import type { DetailSelection } from "./tree-transform";

export function TreeDetailCard({
  data,
  detail,
  token,
  onClose,
}: {
  data: DecisionTreePayload;
  detail: DetailSelection;
  token: string;
  onClose: () => void;
}) {
  if (!detail) return null;

  if (detail.kind === "track") {
    const track = (data.word_tracks || []).find((t) => t.id === detail.id);
    if (!track) return null;
    const cluster = (data.clusters || []).find((c) => c.id === track.cluster_id);
    const pct = Math.round(track.win_rate * 100);
    return (
      <Frame
        accent="sky"
        cluster={cluster?.name}
        kindLabel={`Winning word track #${track.rank}`}
        onClose={onClose}
      >
        <blockquote className="text-[15px] italic leading-relaxed text-sky-950">
          &ldquo;{track.verbatim}&rdquo;
        </blockquote>
        <p className="text-sm text-sky-900/80 mt-4 leading-relaxed">
          <strong className="text-sky-950">Why it works:</strong>{" "}
          {track.why_it_works}
        </p>
        <div className="text-xs text-sky-900/60 font-mono mt-4 flex flex-wrap gap-x-3 gap-y-1">
          <span>call {track.source_call_id}</span>
          {track.source_setter_id && <span>· rep {track.source_setter_id}</span>}
          <span>· n={track.sample_size}</span>
          <span>· est. {pct}% win</span>
        </div>
        {typeof track.start_seconds === "number" &&
        typeof track.end_seconds === "number" &&
        track.end_seconds > track.start_seconds ? (
          <div className="mt-5">
            <AudioClip
              token={token}
              callId={track.source_call_id}
              startSec={track.start_seconds}
              endSec={track.end_seconds}
            />
          </div>
        ) : (
          <p className="text-xs text-sky-900/50 mt-5 italic">
            Audio clip unavailable for this line.
          </p>
        )}
      </Frame>
    );
  }

  // losing
  const losses = (data.losing_patterns || []).filter(
    (l) => l.cluster_id === detail.clusterId
  );
  const losing = losses[detail.index];
  if (!losing) return null;
  const cluster = (data.clusters || []).find((c) => c.id === detail.clusterId);
  return (
    <Frame
      accent="rose"
      cluster={cluster?.name}
      kindLabel={`What didn't work · loss ${detail.index + 1}`}
      onClose={onClose}
    >
      <blockquote className="text-[15px] italic leading-relaxed text-rose-950">
        &ldquo;{losing.verbatim}&rdquo;
      </blockquote>
      <p className="text-sm text-rose-900/80 mt-4 leading-relaxed">
        <strong className="text-rose-950">Why it lost:</strong>{" "}
        {losing.what_went_wrong}
      </p>
      <p className="text-xs text-rose-900/60 font-mono mt-4">
        from call {losing.source_call_id}
      </p>
    </Frame>
  );
}

function Frame({
  accent,
  cluster,
  kindLabel,
  onClose,
  children,
}: {
  accent: "sky" | "rose";
  cluster?: string;
  kindLabel: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const tone =
    accent === "sky"
      ? "bg-sky-50 border-sky-400 text-sky-900"
      : "bg-rose-50 border-rose-400 text-rose-900";
  const closeTone =
    accent === "sky"
      ? "text-sky-900/60 hover:text-sky-900"
      : "text-rose-900/60 hover:text-rose-900";

  return (
    <div
      className={`absolute top-4 right-4 bottom-4 w-1/2 max-w-[640px] z-30 rounded-2xl border-2 shadow-2xl flex flex-col overflow-hidden ${tone}`}
      onClick={(e) => e.stopPropagation()}
    >
      <header
        className={`flex items-center justify-between px-5 py-3 border-b ${
          accent === "sky" ? "border-sky-200" : "border-rose-200"
        }`}
      >
        <div className="min-w-0">
          {cluster && (
            <p className="text-[10px] uppercase tracking-wider opacity-70 truncate">
              {cluster}
            </p>
          )}
          <p className="text-sm font-semibold truncate">{kindLabel}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className={`text-2xl leading-none ml-3 ${closeTone}`}
        >
          ×
        </button>
      </header>
      <div className="px-5 py-5 overflow-y-auto">{children}</div>
    </div>
  );
}
