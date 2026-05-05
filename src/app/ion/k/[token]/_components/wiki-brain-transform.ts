// Force-directed wiki transform — "Stewart's brain" view. Treats the
// data as a concept graph rather than a hierarchy. Same data as the
// /api/ion/decision-tree response, completely different topology:
//
//   • Cluster nodes (8) — central concepts, sized by frequency
//   • Track nodes (~33) — winning word tracks, attached to their cluster
//   • Call nodes (~22) — call recordings, bridging clusters they touched
//
//   • cluster ↔ track edge  → "this winning approach lives in this cluster"
//   • track ↔ call edge     → "this approach originated in this call"
//
// Layout via d3-force in wiki-brain-layout.ts. Node positions are static
// after one simulation run; React Flow then renders + handles interaction.
//
// Limitation noted: this is ENTITY-level (clusters / tracks / calls), not
// concept-level (words / themes). True InfraNodus-style concept extraction
// needs Archivist NLP on the backend. v2.x roadmap.

import type { Edge, Node } from "reactflow";
import type { DecisionTreePayload } from "@/lib/ion-api";

export type BrainClusterData = {
  kind: "brain-cluster";
  cluster_id: string;
  name: string;
  frequency: number;
  win_rate: number;
};

export type BrainTrackData = {
  kind: "brain-track";
  track_id: string;
  cluster_id: string;
  rank: number;
  approach_label: string | null;
  verbatim_short: string;
};

export type BrainCallData = {
  kind: "brain-call";
  call_id: string;
  cluster_count: number;
};

export type BrainNodeData =
  | BrainClusterData
  | BrainTrackData
  | BrainCallData;

export type BrainGraph = {
  nodes: Node<BrainNodeData>[];
  edges: Edge[];
};

const CLUSTER_PREFIX = "bc:";
const TRACK_PREFIX = "bt:";
const CALL_PREFIX = "bcl:";

export const brainClusterId = (id: string) => `${CLUSTER_PREFIX}${id}`;
export const brainTrackId = (id: string) => `${TRACK_PREFIX}${id}`;
export const brainCallId = (id: string) => `${CALL_PREFIX}${id}`;

export function buildBrainGraph(data: DecisionTreePayload): BrainGraph {
  const nodes: Node<BrainNodeData>[] = [];
  const edges: Edge[] = [];

  const clusters = data.clusters || [];
  const tracks = data.word_tracks || [];

  // Cluster nodes
  for (const c of clusters) {
    nodes.push({
      id: brainClusterId(c.id),
      type: "brain-cluster",
      position: { x: 0, y: 0 }, // d3-force fills these in
      data: {
        kind: "brain-cluster",
        cluster_id: c.id,
        name: c.name,
        frequency: c.frequency,
        win_rate: c.win_rate,
      },
    });
  }

  // Track nodes + cluster→track edges
  for (const t of tracks) {
    nodes.push({
      id: brainTrackId(t.id),
      type: "brain-track",
      position: { x: 0, y: 0 },
      data: {
        kind: "brain-track",
        track_id: t.id,
        cluster_id: t.cluster_id,
        rank: t.rank,
        approach_label:
          (t as unknown as { approach_label?: string }).approach_label || null,
        verbatim_short: truncate(t.verbatim, 60),
      },
    });
    edges.push({
      id: `bce-${t.cluster_id}-${t.id}`,
      source: brainClusterId(t.cluster_id),
      target: brainTrackId(t.id),
      type: "default",
      style: { stroke: "#bae6fd", strokeOpacity: 0.55, strokeWidth: 1.2 },
    });
  }

  // Call nodes — one per unique source_call_id; track→call edges
  const callsToTracks = new Map<string, string[]>();
  for (const t of tracks) {
    const arr = callsToTracks.get(t.source_call_id) || [];
    arr.push(t.id);
    callsToTracks.set(t.source_call_id, arr);
  }
  for (const [callId, trackIds] of callsToTracks) {
    // Count unique clusters this call touched (the bridge signal)
    const clusterCount = new Set(
      trackIds.map((tid) => tracks.find((t) => t.id === tid)?.cluster_id)
    ).size;
    nodes.push({
      id: brainCallId(callId),
      type: "brain-call",
      position: { x: 0, y: 0 },
      data: {
        kind: "brain-call",
        call_id: callId,
        cluster_count: clusterCount,
      },
    });
    for (const tid of trackIds) {
      edges.push({
        id: `bte-${tid}-${callId}`,
        source: brainTrackId(tid),
        target: brainCallId(callId),
        type: "default",
        style: {
          stroke: clusterCount > 1 ? "#a78bfa" : "#475569",
          strokeOpacity: clusterCount > 1 ? 0.65 : 0.3,
          strokeWidth: clusterCount > 1 ? 1.2 : 0.8,
          strokeDasharray: clusterCount > 1 ? "3 3" : undefined,
        },
      });
    }
  }

  return { nodes, edges };
}

function truncate(s: string, n: number): string {
  if (!s) return "";
  if (s.length <= n) return s;
  return s.slice(0, n - 1).trimEnd() + "…";
}
