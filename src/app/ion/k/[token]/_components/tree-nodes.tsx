"use client";

import { Handle, Position, type NodeProps } from "reactflow";
import { cn } from "@/lib/utils";
import type {
  ClusterNodeData,
  DetailNodeData,
  LosingNodeData,
  RootNodeData,
  TrackNodeData,
} from "./tree-transform";
import { AudioClip } from "./audio-clip";

const HANDLE_STYLE = { opacity: 0, pointerEvents: "none" as const };

export function RootNode({ data }: NodeProps<RootNodeData>) {
  return (
    <div className="w-full h-full rounded-2xl bg-amber-200/95 text-stewart-bg shadow-lg flex flex-col items-center justify-center px-5 text-center">
      <div className="text-[10px] uppercase tracking-wider text-amber-900/70">
        {data.cohortLabel}
      </div>
      <div className="font-bold text-base leading-tight mt-1">{data.label}</div>
      <div className="text-[11px] text-amber-900/80 mt-1.5 font-mono">
        {data.callCount} sales calls · {data.winCount} wins ·{" "}
        {data.clusterCount} objection clusters
      </div>
      <Handle type="source" position={Position.Right} style={HANDLE_STYLE} />
    </div>
  );
}

export function ClusterNode({
  data,
  selected,
}: NodeProps<ClusterNodeData>) {
  const { cluster, trackCount, losingCount, collapsed } = data;
  const pct = Math.round(cluster.win_rate * 100);
  const tone = winRateTone(pct);

  return (
    <div
      title={cluster.description}
      className={cn(
        "w-full h-full rounded-2xl bg-violet-200/95 text-stewart-bg shadow flex flex-col px-4 py-3 cursor-pointer transition-shadow hover:shadow-xl relative overflow-hidden",
        selected && "ring-2 ring-violet-500 ring-offset-2 ring-offset-stewart-bg"
      )}
    >
      <div className={cn("absolute top-0 left-0 right-0 h-1", tone.bar)} />
      <Handle type="target" position={Position.Left} style={HANDLE_STYLE} />
      <div className="flex items-start justify-between gap-2">
        <div className="font-semibold text-[13px] leading-tight">
          {cluster.name}
        </div>
        <span
          className={cn(
            "text-[10px] font-mono font-bold rounded px-1.5 py-0.5 whitespace-nowrap shrink-0",
            tone.pill
          )}
        >
          {pct}%
        </span>
      </div>
      <div className="text-[10px] text-violet-900/70 mt-1.5 font-mono flex items-center gap-2">
        <span>{cluster.frequency} calls</span>
        <span>·</span>
        <span className="text-emerald-700">{trackCount} wins</span>
        {losingCount > 0 && (
          <>
            <span>·</span>
            <span className="text-rose-700">{losingCount} losses</span>
          </>
        )}
      </div>
      <span
        className={cn(
          "absolute bottom-1.5 right-2 text-[10px] font-mono",
          collapsed ? "text-violet-900/60" : "text-violet-900/80"
        )}
      >
        {collapsed ? "click to drill in →" : "↓ expanded"}
      </span>
      <Handle type="source" position={Position.Right} style={HANDLE_STYLE} />
    </div>
  );
}

export function TrackNode({ data, selected }: NodeProps<TrackNodeData>) {
  const { track } = data;
  const pct = Math.round(track.win_rate * 100);
  const snippet = truncate(track.verbatim, 85);

  return (
    <div
      className={cn(
        "w-full h-full rounded-2xl bg-sky-100/95 text-stewart-bg shadow flex flex-col px-4 py-3 cursor-pointer hover:shadow-xl transition-shadow",
        selected && "ring-2 ring-sky-500 ring-offset-2 ring-offset-stewart-bg"
      )}
      title={track.verbatim}
    >
      <Handle type="target" position={Position.Left} style={HANDLE_STYLE} />
      <div className="flex items-start gap-2">
        <span className="text-[10px] font-mono font-bold rounded bg-sky-700 text-white px-1.5 py-0.5 shrink-0">
          #{track.rank}
        </span>
        <span className="text-[10px] font-mono text-sky-900/70">
          est. {pct}% win · {track.sample_size}{" "}
          example{track.sample_size === 1 ? "" : "s"}
        </span>
        <span className="ml-auto text-[10px] text-sky-700">▶ play</span>
      </div>
      <blockquote className="text-[12px] italic leading-snug mt-2 text-sky-950 line-clamp-4">
        &ldquo;{snippet}&rdquo;
      </blockquote>
      <Handle type="source" position={Position.Right} style={HANDLE_STYLE} />
    </div>
  );
}

export function LosingPatternNode({
  data,
  selected,
}: NodeProps<LosingNodeData>) {
  const { losing, index } = data;
  const snippet = truncate(losing.verbatim, 70);

  return (
    <div
      className={cn(
        "w-full h-full rounded-2xl bg-rose-100/95 text-stewart-bg shadow flex flex-col px-3 py-2 cursor-pointer hover:shadow-xl transition-shadow border border-rose-300",
        selected && "ring-2 ring-rose-500 ring-offset-2 ring-offset-stewart-bg"
      )}
      title={losing.verbatim}
    >
      <Handle type="target" position={Position.Left} style={HANDLE_STYLE} />
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-mono font-bold rounded bg-rose-700 text-white px-1.5 py-0.5 shrink-0">
          ✕ loss {index + 1}
        </span>
        <span className="text-[10px] text-rose-900/70 truncate">
          call {losing.source_call_id}
        </span>
      </div>
      <blockquote className="text-[11px] italic leading-snug mt-1.5 text-rose-950 line-clamp-3">
        &ldquo;{snippet}&rdquo;
      </blockquote>
      <Handle type="source" position={Position.Right} style={HANDLE_STYLE} />
    </div>
  );
}

export function DetailNode({ data }: NodeProps<DetailNodeData>) {
  if (data.detailKind === "track") {
    const { track, cluster, token } = data;
    const pct = Math.round(track.win_rate * 100);
    return (
      <div className="w-full h-full rounded-2xl bg-sky-50 text-stewart-bg border-2 border-sky-400 shadow-2xl flex flex-col px-5 py-4 overflow-y-auto">
        <Handle type="target" position={Position.Left} style={HANDLE_STYLE} />
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-mono font-bold rounded bg-sky-700 text-white px-1.5 py-0.5">
            #{track.rank}
          </span>
          <span className="text-[10px] uppercase tracking-wider text-sky-900/60">
            {cluster.name}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              window.dispatchEvent(new CustomEvent("ion-tree-detail-close"));
            }}
            className="ml-auto text-sky-900/50 hover:text-sky-900 text-base leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <blockquote className="text-[12px] italic leading-snug text-sky-950">
          &ldquo;{track.verbatim}&rdquo;
        </blockquote>
        <p className="text-[11px] text-sky-900/80 mt-2 leading-snug">
          <strong>Why it works:</strong> {track.why_it_works}
        </p>
        <div className="text-[10px] text-sky-900/60 font-mono mt-2 flex flex-wrap gap-x-2 gap-y-0.5">
          <span>call {track.source_call_id}</span>
          {track.source_setter_id && <span>· rep {track.source_setter_id}</span>}
          <span>· n={track.sample_size}</span>
          <span>· est. {pct}% win</span>
        </div>
        {typeof track.start_seconds === "number" &&
        typeof track.end_seconds === "number" &&
        track.end_seconds > track.start_seconds ? (
          <div className="mt-2 nodrag" onClick={(e) => e.stopPropagation()}>
            <AudioClip
              token={token}
              callId={track.source_call_id}
              startSec={track.start_seconds}
              endSec={track.end_seconds}
            />
          </div>
        ) : null}
      </div>
    );
  }

  // losing detail
  const { losing, cluster, index } = data;
  return (
    <div className="w-full h-full rounded-2xl bg-rose-50 text-stewart-bg border-2 border-rose-400 shadow-2xl flex flex-col px-5 py-4 overflow-y-auto">
      <Handle type="target" position={Position.Left} style={HANDLE_STYLE} />
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] font-mono font-bold rounded bg-rose-700 text-white px-1.5 py-0.5">
          ✕ loss {index + 1}
        </span>
        <span className="text-[10px] uppercase tracking-wider text-rose-900/60">
          {cluster.name}
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            window.dispatchEvent(new CustomEvent("ion-tree-detail-close"));
          }}
          className="ml-auto text-rose-900/50 hover:text-rose-900 text-base leading-none"
          aria-label="Close"
        >
          ×
        </button>
      </div>
      <blockquote className="text-[12px] italic leading-snug text-rose-950">
        &ldquo;{losing.verbatim}&rdquo;
      </blockquote>
      <p className="text-[11px] text-rose-900/80 mt-2 leading-snug">
        <strong>Why it lost:</strong> {losing.what_went_wrong}
      </p>
      <div className="text-[10px] text-rose-900/60 font-mono mt-2">
        from call {losing.source_call_id}
      </div>
    </div>
  );
}

export const NODE_TYPES = {
  root: RootNode,
  cluster: ClusterNode,
  track: TrackNode,
  losing: LosingPatternNode,
  detail: DetailNode,
};

function winRateTone(pct: number) {
  if (pct >= 70) {
    return {
      bar: "bg-emerald-500",
      pill: "bg-emerald-600 text-white",
    };
  }
  if (pct >= 40) {
    return {
      bar: "bg-amber-500",
      pill: "bg-amber-600 text-white",
    };
  }
  return {
    bar: "bg-rose-500",
    pill: "bg-rose-600 text-white",
  };
}

function truncate(s: string, n: number): string {
  if (!s) return "";
  if (s.length <= n) return s;
  return s.slice(0, n - 1).trimEnd() + "…";
}
