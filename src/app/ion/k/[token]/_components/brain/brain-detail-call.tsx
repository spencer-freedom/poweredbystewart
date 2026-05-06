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

  // Glass-morphism container — backdrop-blur 12px, white tint at 4%
  // opacity, subtle 1px border at white 8% opacity. Floats over the
  // luminous brain without competing for brightness.
  const glass = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    boxShadow: "0 8px 32px rgba(0,0,0,0.35)",
  } as const;
  const showSetter = !!call.setter_name || !!call.setter_id;

  return (
    <div
      className="absolute top-4 right-4 w-[44%] max-w-[520px] max-h-[calc(100%-2rem)] z-30 rounded-xl text-stewart-text flex flex-col overflow-hidden"
      style={glass}
    >
      <header className="flex items-start justify-between px-4 py-3 border-b border-white/8" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-wider text-stewart-muted">
            Call · {dateLabel}
          </p>
          {showSetter && (
            <p className="text-sm font-semibold truncate">
              {call.setter_name ?? `Setter #${call.setter_id}`}
            </p>
          )}
          <p className="text-[11px] font-mono text-stewart-muted mt-0.5">
            {call.call_id} · {durationLabel}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-stewart-muted hover:text-stewart-text text-2xl leading-none ml-3"
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
              className="px-2 py-1 rounded font-mono"
              style={outcomeChipStyle(call.outcome)}
            >
              {call.outcome.replace(/_/g, " ")}
            </span>
          )}
          <span className="text-stewart-muted">
            <strong className="text-stewart-text">{objectionCount}</strong>{" "}
            objection{objectionCount === 1 ? "" : "s"} ·{" "}
            <strong className="text-stewart-text">{solutionCount}</strong>{" "}
            solution{solutionCount === 1 ? "" : "s"}
          </span>
        </div>

        {/* Cluster chips — metadata, lower-saturation than outcomes */}
        {call.cluster_ids.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {call.cluster_ids.map((cid) => (
              <span
                key={cid}
                className="px-2 py-0.5 rounded text-[10px] font-mono"
                style={{
                  backgroundColor: tintHex(colorForCluster(cid), 0.18),
                  color: colorForCluster(cid),
                  border: `1px solid ${tintHex(colorForCluster(cid), 0.35)}`,
                }}
              >
                {cid.replace(/_/g, " ")}
              </span>
            ))}
            {call.cluster_ids.length > 1 && (
              <span
                className="px-2 py-0.5 rounded text-[10px] font-mono"
                style={{
                  backgroundColor: "rgba(250,204,21,0.14)",
                  color: "#facc15",
                  border: "1px solid rgba(250,204,21,0.28)",
                }}
              >
                bridge · {call.cluster_ids.length} clusters
              </span>
            )}
          </div>
        )}

        {/* Event timeline */}
        <div>
          <p className="text-xs uppercase tracking-wider text-stewart-muted mb-2">
            Events on this call
          </p>
          <ul className="space-y-1">
            {sortedEvents.map((e) => {
              const isObj = e.type === "objection";
              const verbatim = "verbatim" in e ? e.verbatim : "";
              const t = "start_seconds" in e ? e.start_seconds : null;
              const tLabel = t ? `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}` : "—";
              return (
                <li key={e.id}>
                  <button
                    onClick={() => onJumpToEvent(e.id)}
                    className="w-full text-left px-2 py-1.5 rounded hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-[10px] font-mono text-stewart-muted mt-0.5 w-10 shrink-0">
                        {tLabel}
                      </span>
                      <span
                        className="text-[10px] font-mono rounded px-1.5 py-0.5 shrink-0"
                        style={{
                          backgroundColor: isObj ? "rgba(248,113,113,0.16)" : "rgba(94,234,212,0.16)",
                          color: isObj ? "#f87171" : "#5EEAD4",
                          border: `1px solid ${isObj ? "rgba(248,113,113,0.32)" : "rgba(94,234,212,0.32)"}`,
                        }}
                      >
                        {isObj ? "obj" : "sol"}
                      </span>
                      <span className="text-xs italic text-stewart-text/85 leading-snug line-clamp-2">
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

function outcomeChipStyle(outcome: string): React.CSSProperties {
  const o = outcome.toLowerCase();
  if (o === "booked" || o === "tentative_appointment" || o === "transferred_to_closer") {
    return { backgroundColor: "rgba(94,234,212,0.16)", color: "#5EEAD4", border: "1px solid rgba(94,234,212,0.32)" };
  }
  if (o === "callback" || o.includes("partial") || o === "spouse_not_present") {
    return { backgroundColor: "rgba(251,191,36,0.16)", color: "#FBBF24", border: "1px solid rgba(251,191,36,0.32)" };
  }
  if (o.includes("declined") || o.includes("no_interest") || o.includes("unqualified") || o.includes("failed")) {
    return { backgroundColor: "rgba(248,113,113,0.16)", color: "#FB7185", border: "1px solid rgba(248,113,113,0.32)" };
  }
  return { backgroundColor: "rgba(255,255,255,0.05)", color: "#cbd5e1", border: "1px solid rgba(255,255,255,0.10)" };
}

// Convert a hex color into a low-opacity rgba string for chip backgrounds.
function tintHex(hex: string, alpha: number): string {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return `rgba(255,255,255,${alpha})`;
  return `rgba(${parseInt(m[1], 16)},${parseInt(m[2], 16)},${parseInt(m[3], 16)},${alpha})`;
}

function truncate(s: string, n: number): string {
  if (!s) return "";
  if (s.length <= n) return s;
  return s.slice(0, n - 1).trimEnd() + "…";
}
