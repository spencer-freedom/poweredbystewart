"use client";

import type {
  BrainCallNode,
  BrainGraphPayload,
} from "./brain-types";
import { colorForCluster } from "./brain-types";

// Call-level detail card. Reuses the same visual shell as TreeDetailCard
// but rendered for a Call node (which TreeDetailCard's discriminated
// union doesn't cover). Header + stats row + events list + cluster chips.

export function BrainDetailCall({
  call,
  data,
  onClose,
  onJumpToEvent,
}: {
  call: BrainCallNode;
  data: BrainGraphPayload;
  onClose: () => void;
  onJumpToEvent: (eventId: string) => void;
}) {
  const events = data.nodes.filter(
    (n) => (n.type === "objection" || n.type === "solution") &&
           "call_id" in n &&
           n.call_id === call.id
  );
  const objectionCount = events.filter((e) => e.type === "objection").length;
  const solutionCount = events.filter((e) => e.type === "solution").length;

  const sortedEvents = [...events].sort((a, b) => {
    const sa = "start_seconds" in a ? a.start_seconds ?? 0 : 0;
    const sb = "start_seconds" in b ? b.start_seconds ?? 0 : 0;
    return sa - sb;
  });

  const dateLabel = call.call_date
    ? new Date(call.call_date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—";
  const durationLabel = call.duration_seconds
    ? `${Math.floor(call.duration_seconds / 60)}m ${call.duration_seconds % 60}s`
    : "—";

  return (
    <div className="absolute top-4 right-4 w-[44%] max-w-[520px] max-h-[calc(100%-2rem)] z-30 rounded-2xl border-2 border-violet-400 bg-violet-50 text-violet-900 shadow-2xl flex flex-col overflow-hidden">
      <header className="flex items-start justify-between px-4 py-3 border-b border-violet-200">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-wider opacity-70">
            Call · {dateLabel}
          </p>
          <p className="text-sm font-semibold truncate">
            {call.setter_name || call.setter_id || "Unknown setter"}
          </p>
          <p className="text-[11px] font-mono text-violet-900/60 mt-0.5">
            {call.call_id} · {durationLabel}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-violet-900/60 hover:text-violet-900 text-2xl leading-none ml-3"
          aria-label="Close"
        >
          ×
        </button>
      </header>

      <div className="px-4 py-3 overflow-y-auto space-y-4">
        {/* Outcome + stats row */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {call.outcome && (
            <span
              className={`px-2 py-1 rounded font-mono font-bold ${outcomeTone(call.outcome)}`}
            >
              {call.outcome.replace(/_/g, " ")}
            </span>
          )}
          <span className="text-violet-900/70">
            <strong className="text-violet-950">{objectionCount}</strong>{" "}
            objection{objectionCount === 1 ? "" : "s"} ·{" "}
            <strong className="text-violet-950">{solutionCount}</strong>{" "}
            solution{solutionCount === 1 ? "" : "s"}
          </span>
        </div>

        {/* Cluster chips */}
        {call.cluster_ids.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {call.cluster_ids.map((cid) => (
              <span
                key={cid}
                className="px-2 py-0.5 rounded text-[10px] font-mono"
                style={{
                  backgroundColor: colorForCluster(cid),
                  color: "#0f1117",
                }}
              >
                {cid.replace(/_/g, " ")}
              </span>
            ))}
            {call.cluster_ids.length > 1 && (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-violet-300 text-violet-950">
                bridge call · {call.cluster_ids.length} clusters
              </span>
            )}
          </div>
        )}

        {/* Event timeline */}
        <div>
          <p className="text-xs uppercase tracking-wider text-violet-900/60 mb-2">
            Events on this call
          </p>
          <ul className="space-y-1.5">
            {sortedEvents.map((e) => {
              const isObj = e.type === "objection";
              const verbatim = "verbatim" in e ? e.verbatim : "";
              const t = "start_seconds" in e ? e.start_seconds : null;
              const tLabel = t ? `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}` : "—";
              return (
                <li key={e.id}>
                  <button
                    onClick={() => onJumpToEvent(e.id)}
                    className="w-full text-left px-2 py-1.5 rounded hover:bg-violet-200/60 transition-colors"
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-[10px] font-mono text-violet-900/50 mt-0.5 w-10 shrink-0">
                        {tLabel}
                      </span>
                      <span
                        className={`text-[10px] font-mono font-bold rounded px-1.5 py-0.5 shrink-0 ${
                          isObj ? "bg-rose-300 text-rose-950" : "bg-emerald-300 text-emerald-950"
                        }`}
                      >
                        {isObj ? "obj" : "sol"}
                      </span>
                      <span className="text-xs italic text-violet-950 leading-snug line-clamp-2">
                        &ldquo;{truncate(verbatim, 100)}&rdquo;
                      </span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}

function outcomeTone(outcome: string): string {
  const o = outcome.toLowerCase();
  if (o === "booked" || o === "transferred") return "bg-emerald-300 text-emerald-950";
  if (o === "callback" || o.includes("partial")) return "bg-amber-300 text-amber-950";
  if (o.includes("not_interested") || o.includes("declined") || o.includes("failed"))
    return "bg-rose-300 text-rose-950";
  return "bg-violet-200 text-violet-950";
}

function truncate(s: string, n: number): string {
  if (!s) return "";
  if (s.length <= n) return s;
  return s.slice(0, n - 1).trimEnd() + "…";
}
