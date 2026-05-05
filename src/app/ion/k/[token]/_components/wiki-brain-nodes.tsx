"use client";

import { Handle, Position, type NodeProps } from "reactflow";
import { cn } from "@/lib/utils";
import type {
  BrainCallData,
  BrainClusterData,
  BrainTrackData,
} from "./wiki-brain-transform";

const HANDLE_STYLE = { opacity: 0, pointerEvents: "none" as const };

// Distinct categorical color per cluster so emerging communities are
// visible at a glance — same idea as InfraNodus's auto-detected topics.
const CLUSTER_COLOR: Record<string, string> = {
  scheduling: "#a78bfa",            // violet
  roof_concerns: "#fbbf24",         // amber
  spouse_decision_maker: "#f472b6", // pink
  qualification: "#fb7185",         // rose
  price_cost: "#34d399",            // emerald
  appointment_format: "#60a5fa",    // blue
  timing_not_ready: "#facc15",      // yellow
  current_provider_competitor: "#22d3ee", // cyan
};

const DEFAULT_COLOR = "#94a3b8";
const colorFor = (clusterId: string) => CLUSTER_COLOR[clusterId] ?? DEFAULT_COLOR;

export function BrainClusterNode({
  data,
  selected,
}: NodeProps<BrainClusterData>) {
  const color = colorFor(data.cluster_id);
  const pct = Math.round(data.win_rate * 100);
  return (
    <div
      title={`${data.name} · ${data.frequency} calls · ${pct}% win`}
      className={cn(
        "rounded-full flex items-center justify-center text-center px-3 cursor-pointer transition-all hover:scale-105 shadow-lg",
        selected && "ring-2 ring-white ring-offset-2 ring-offset-stewart-bg"
      )}
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: color,
        color: "#0f1117",
      }}
    >
      <Handle type="target" position={Position.Left} style={HANDLE_STYLE} />
      <div>
        <div className="font-bold text-[11px] leading-tight line-clamp-3">
          {data.name}
        </div>
        <div className="text-[9px] font-mono opacity-80 mt-0.5">
          {data.frequency} · {pct}%
        </div>
      </div>
      <Handle type="source" position={Position.Right} style={HANDLE_STYLE} />
    </div>
  );
}

export function BrainTrackNode({
  data,
  selected,
}: NodeProps<BrainTrackData>) {
  const color = colorFor(data.cluster_id);
  return (
    <div
      title={data.verbatim_short}
      className={cn(
        "rounded-full flex items-center justify-center px-2 cursor-pointer transition-all hover:scale-105 shadow-md border",
        selected && "ring-2 ring-sky-300 ring-offset-1 ring-offset-stewart-bg"
      )}
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: "#0f1117",
        borderColor: color,
        borderWidth: 2,
        color: color,
      }}
    >
      <Handle type="target" position={Position.Left} style={HANDLE_STYLE} />
      <div className="text-center">
        <div className="font-mono font-bold text-[10px] leading-none">
          #{data.rank}
        </div>
        {data.approach_label && (
          <div className="text-[8px] opacity-80 mt-0.5 leading-tight line-clamp-2">
            {data.approach_label}
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Right} style={HANDLE_STYLE} />
    </div>
  );
}

export function BrainCallNode({
  data,
  selected,
}: NodeProps<BrainCallData>) {
  const isBridge = data.cluster_count > 1;
  return (
    <div
      title={`call ${data.call_id} · touches ${data.cluster_count} cluster${
        data.cluster_count === 1 ? "" : "s"
      }`}
      className={cn(
        "rounded-full flex items-center justify-center text-center px-1 cursor-pointer transition-all hover:scale-110 shadow",
        isBridge ? "bg-violet-300" : "bg-stewart-border",
        selected && "ring-2 ring-white"
      )}
      style={{ width: "100%", height: "100%" }}
    >
      <Handle type="target" position={Position.Left} style={HANDLE_STYLE} />
      <span
        className={cn(
          "font-mono font-bold leading-none",
          isBridge ? "text-violet-950 text-[8px]" : "text-stewart-muted text-[7px]"
        )}
      >
        {data.call_id.slice(-4)}
      </span>
      <Handle type="source" position={Position.Right} style={HANDLE_STYLE} />
    </div>
  );
}

export const BRAIN_NODE_TYPES = {
  "brain-cluster": BrainClusterNode,
  "brain-track": BrainTrackNode,
  "brain-call": BrainCallNode,
};
