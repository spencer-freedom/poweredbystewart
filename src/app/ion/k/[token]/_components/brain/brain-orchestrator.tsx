"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BrainCanvas } from "./brain-canvas";
import { BrainSearch } from "./brain-search";
import { BrainDetailCall } from "./brain-detail-call";
import type {
  BrainCallNode,
  BrainGraphPayload,
  BrainNode,
} from "./brain-types";
import type { WordTrack } from "@/lib/ion-api";
import { TreeDetailCard } from "../tree-detail-card";
import type { DetailSelection } from "../tree-transform";

// Adapter: brain objection/solution nodes → the WordTrack shape
// TreeDetailCard already understands. Lets us reuse the existing
// verbatim+audio+why-it-works overlay without a new component.
function eventToTrack(
  node: BrainNode & { type: "objection" | "solution" }
): WordTrack {
  return {
    id: node.id,
    cluster_id: node.cluster_id,
    rank: 1,
    verbatim: node.verbatim,
    source_call_id: node.call_id,
    source_setter_id: null,
    win_rate: 0,
    sample_size: 1,
    why_it_works:
      node.type === "solution" && "why_it_works" in node && node.why_it_works
        ? node.why_it_works
        : "",
    start_seconds: node.start_seconds,
    end_seconds: node.end_seconds,
  };
}

export function BrainOrchestrator({
  data,
  token,
}: {
  data: BrainGraphPayload;
  token: string;
}) {
  const [search, setSearch] = useState<ReadonlySet<string>>(new Set());
  const [selectedCall, setSelectedCall] = useState<BrainCallNode | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<
    (BrainNode & { type: "objection" | "solution" }) | null
  >(null);

  useEffect(() => {
    if (!selectedCall && !selectedEvent) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedCall(null);
        setSelectedEvent(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedCall, selectedEvent]);

  const onNodeClick = useCallback((n: BrainNode) => {
    if (n.type === "call") {
      setSelectedEvent(null);
      setSelectedCall((prev) => (prev?.id === n.id ? null : n));
      return;
    }
    setSelectedCall(null);
    setSelectedEvent((prev) => (prev?.id === n.id ? null : n));
  }, []);

  // For TreeDetailCard reuse, fabricate a minimal payload that the card
  // can consume. We only need word_tracks (with the selected event) and
  // clusters (with the cluster name) — the other fields can be empty.
  const fakeDecisionPayload = useMemo(() => {
    if (!selectedEvent) return null;
    const track = eventToTrack(selectedEvent);
    const clusterId = selectedEvent.cluster_id;
    return {
      tenant_id: "",
      kind: "",
      expires_at: 0,
      generated_at: null,
      cohort: null,
      model: null,
      pipeline_stats: {
        tenant_id: "",
        cohort: "",
        generated_at: "",
        n_received: 0,
        n_transcribed: 0,
        n_real_sales: 0,
        n_wins: 0,
        n_engaged_noset: 0,
        n_hard_losses: 0,
      },
      pipeline_cost_usd: 0,
      executive_summary: "",
      noise_disclaimer: "",
      kenny_data_ask: "",
      clusters: [
        {
          id: clusterId,
          name: clusterId.replace(/_/g, " "),
          description: "",
          frequency: 0,
          win_rate: 0,
        },
      ],
      word_tracks: [track],
      transitions: [],
      losing_patterns: [],
    };
  }, [selectedEvent]);

  const detailSelection: DetailSelection = selectedEvent
    ? { kind: "track", id: selectedEvent.id }
    : null;

  return (
    <div className="space-y-3">
      <BrainSearch
        data={data}
        onChange={setSearch}
        totalNodes={data.nodes.length}
      />
      <div className="relative">
        <BrainCanvas
          data={data}
          searchHighlight={search}
          onNodeClick={onNodeClick}
        />
        {selectedCall && (
          <BrainDetailCall
            call={selectedCall}
            data={data}
            onClose={() => setSelectedCall(null)}
            onJumpToEvent={(eventId) => {
              const ev = data.nodes.find((n) => n.id === eventId);
              if (ev && (ev.type === "objection" || ev.type === "solution")) {
                setSelectedCall(null);
                setSelectedEvent(ev);
              }
            }}
          />
        )}
        {selectedEvent && fakeDecisionPayload && (
          <TreeDetailCard
            data={fakeDecisionPayload}
            detail={detailSelection}
            token={token}
            onClose={() => setSelectedEvent(null)}
            topPx={48}
          />
        )}
      </div>
      <div className="text-xs text-stewart-muted flex flex-wrap items-center gap-x-4 gap-y-1 font-mono">
        <span>{data.total_calls} calls</span>
        <span>·</span>
        <span>{data.total_objections} objections</span>
        <span>·</span>
        <span>{data.total_solutions} solutions</span>
        <span>·</span>
        <span>{data.edges.length} edges</span>
        <span className="text-stewart-border">|</span>
        <LegendDot color="#34d399" label="worked" />
        <LegendDot color="#fbbf24" label="partial" />
        <LegendDot color="#f87171" label="failed" />
        <LegendDot color="#94a3b8" label="unknown" />
        <LegendDot color="#facc15" label="bridge call" />
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="inline-block h-2.5 w-2.5 rounded-full"
        style={{ background: color, boxShadow: `0 0 6px ${color}80` }}
      />
      <span>{label}</span>
    </span>
  );
}
