"use client";

import { Handle, Position, type NodeProps } from "reactflow";
import { cn } from "@/lib/utils";
import type {
  ClusterNodeData,
  LosingNodeData,
  RootNodeData,
  TrackNodeData,
} from "./tree-transform";

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
  const { cluster, collapsed, realWins, realLosses } = data;
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
        <span className="text-emerald-700 font-bold">{realWins} won</span>
        {realLosses > 0 && (
          <>
            <span>·</span>
            <span className="text-rose-700 font-bold">{realLosses} lost</span>
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
  const snippet = truncate(track.verbatim, 85);
  const audioExamples = (track as unknown as { audio_examples?: unknown[] }).audio_examples || [];
  const hasLegacyAudio =
    typeof track.start_seconds === "number" &&
    typeof track.end_seconds === "number" &&
    track.end_seconds > track.start_seconds;
  // Count the legacy single-clip as 1 when audio_examples isn't populated,
  // so a track with playable audio never reads "0 examples".
  const exampleCount =
    audioExamples.length || (hasLegacyAudio ? 1 : 0);
  const approachLabel = (track as unknown as { approach_label?: string }).approach_label || "";

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
        {approachLabel ? (
          <span className="text-[10px] font-mono font-bold rounded bg-sky-700 text-white px-1.5 py-0.5 shrink-0">
            {approachLabel}
          </span>
        ) : (
          <span className="text-[10px] font-mono font-bold rounded bg-sky-700 text-white px-1.5 py-0.5 shrink-0">
            #{track.rank}
          </span>
        )}
        {exampleCount > 1 ? (
          <span className="ml-auto text-[10px] text-sky-700">
            ▶ {exampleCount} examples
          </span>
        ) : exampleCount === 1 ? (
          <span className="ml-auto text-[10px] text-sky-700">▶ play</span>
        ) : null}
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

export const NODE_TYPES = {
  root: RootNode,
  cluster: ClusterNode,
  track: TrackNode,
  losing: LosingPatternNode,
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
