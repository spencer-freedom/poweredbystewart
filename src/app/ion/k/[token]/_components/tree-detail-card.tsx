"use client";

import type { DecisionTreePayload } from "@/lib/ion-api";
import { AudioClip } from "./audio-clip";
import type { DetailSelection } from "./tree-transform";

export function TreeDetailCard({
  data,
  detail,
  token,
  onClose,
  topPx,
}: {
  data: DecisionTreePayload;
  detail: DetailSelection;
  token: string;
  onClose: () => void;
  topPx: number | null;
}) {
  if (!detail) return null;

  if (detail.kind === "track") {
    const track = (data.word_tracks || []).find((t) => t.id === detail.id);
    if (!track) return null;
    const cluster = (data.clusters || []).find((c) => c.id === track.cluster_id);
    const ext = track as unknown as { approach_label?: string; audio_examples?: Array<{ call_id: string; start_seconds: number | null; end_seconds: number | null; outcome: string; outcome_observed: string | null }> };
    const approachLabel = ext.approach_label || `#${track.rank}`;
    const audioExamples = ext.audio_examples || [];
    const winOutcomes = new Set(["booked", "tentative_appointment", "transferred_to_closer"]);
    const lossOutcomes = new Set(["declined", "no_interest", "unqualified"]);
    const exWins = audioExamples.filter(e => winOutcomes.has(e.outcome)).length;
    const exLosses = audioExamples.filter(e => lossOutcomes.has(e.outcome)).length;
    const exOther = audioExamples.length - exWins - exLosses;

    return (
      <Frame
        accent="sky"
        cluster={cluster?.name}
        kindLabel={approachLabel}
        onClose={onClose}
        topPx={topPx}
      >
        <blockquote className="text-[15px] italic leading-relaxed text-sky-950">
          &ldquo;{track.verbatim}&rdquo;
        </blockquote>
        <p className="text-sm text-sky-900/80 mt-3 leading-relaxed">
          <strong className="text-sky-950">Why it works:</strong>{" "}
          {track.why_it_works}
        </p>
        <div className="text-xs text-sky-900/60 font-mono mt-3 flex flex-wrap gap-x-3 gap-y-1">
          <span>source: {track.source_call_id}</span>
          {track.source_setter_id && <span>· rep {track.source_setter_id}</span>}
        </div>

        {/* Primary audio clip */}
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
          <p className="text-xs text-sky-900/50 mt-3 italic">
            Audio clip unavailable for this line.
          </p>
        )}

        {/* Audio examples from other calls */}
        {audioExamples.length > 0 && (
          <div className="mt-4 pt-3 border-t border-sky-200">
            <p className="text-xs font-semibold text-sky-950 mb-1">
              Found in {audioExamples.length} call{audioExamples.length === 1 ? "" : "s"}
              {exWins > 0 && <span className="text-green-700 ml-2">{exWins} won</span>}
              {exLosses > 0 && <span className="text-red-700 ml-2">{exLosses} lost</span>}
              {exOther > 0 && <span className="text-amber-700 ml-2">{exOther} other</span>}
            </p>
            <div className="space-y-1.5 mt-2">
              {audioExamples.map((ex, i) => {
                const isWin = winOutcomes.has(ex.outcome);
                const isLoss = lossOutcomes.has(ex.outcome);
                const color = isWin ? "text-green-700" : isLoss ? "text-red-700" : "text-amber-700";
                const hasAudio = typeof ex.start_seconds === "number" && typeof ex.end_seconds === "number" && ex.end_seconds > ex.start_seconds;
                return (
                  <div key={i} className="flex items-center gap-2 text-[11px]">
                    <span className={`font-mono font-bold ${color} w-20`}>
                      {ex.outcome?.replace(/_/g, " ")}
                    </span>
                    <span className="text-sky-900/50 font-mono">{ex.call_id}</span>
                    {hasAudio && (
                      <AudioClip
                        token={token}
                        callId={ex.call_id}
                        startSec={ex.start_seconds!}
                        endSec={ex.end_seconds!}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
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
      topPx={topPx}
    >
      <blockquote className="text-[15px] italic leading-relaxed text-rose-950">
        &ldquo;{losing.verbatim}&rdquo;
      </blockquote>
      <p className="text-sm text-rose-900/80 mt-3 leading-relaxed">
        <strong className="text-rose-950">Why it lost:</strong>{" "}
        {losing.what_went_wrong}
      </p>
      <p className="text-xs text-rose-900/60 font-mono mt-3">
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
  topPx,
  children,
}: {
  accent: "sky" | "rose";
  cluster?: string;
  kindLabel: string;
  onClose: () => void;
  topPx: number | null;
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
      style={{ top: topPx ?? 16 }}
      className={`absolute right-4 w-[44%] max-w-[520px] max-h-[calc(100%-2rem)] z-30 rounded-2xl border-2 shadow-2xl flex flex-col overflow-hidden transition-[top] duration-200 ease-out ${tone}`}
      onClick={(e) => e.stopPropagation()}
    >
      <header
        className={`flex items-center justify-between px-4 py-2.5 border-b ${
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
      <div className="px-4 py-3 overflow-y-auto">{children}</div>
    </div>
  );
}
