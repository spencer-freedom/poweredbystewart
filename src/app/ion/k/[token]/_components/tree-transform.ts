import type { Edge, Node } from "reactflow";
import type {
  Cluster,
  DecisionTreePayload,
  Transition,
  WordTrack,
} from "@/lib/ion-api";

const TOP_TRACKS_PER_CLUSTER = 3;

export type RootNodeData = {
  kind: "root";
  label: string;
  cohortLabel: string;
  callCount: number;
  winCount: number;
  clusterCount: number;
};

export type ClusterNodeData = {
  kind: "cluster";
  cluster: Cluster;
  trackCount: number;
  losingCount: number;
  collapsed: boolean;
};

export type TrackNodeData = {
  kind: "track";
  track: WordTrack;
  cluster: Cluster;
};

export type TreeNodeData = RootNodeData | ClusterNodeData | TrackNodeData;

export type TreeGraph = {
  nodes: Node<TreeNodeData>[];
  edges: Edge[];
};

export function buildTreeGraph(
  data: DecisionTreePayload,
  collapsedClusterIds: Set<string>
): TreeGraph {
  const nodes: Node<TreeNodeData>[] = [];
  const edges: Edge[] = [];

  const clusters = data.clusters || [];
  const allTracks = data.word_tracks || [];
  const allTransitions = data.transitions || [];
  const allLosing = data.losing_patterns || [];

  // Root
  nodes.push({
    id: "root",
    type: "root",
    position: { x: 0, y: 0 },
    data: {
      kind: "root",
      label: "Ion Solar — Empirical Sales Playbook",
      cohortLabel: humanCohort(data.cohort),
      callCount: data.pipeline_stats.n_real_sales,
      winCount: data.pipeline_stats.n_wins,
      clusterCount: clusters.length,
    },
  });

  for (const cluster of clusters) {
    const clusterTracks = allTracks
      .filter((t) => t.cluster_id === cluster.id)
      .sort((a, b) => a.rank - b.rank);
    const visibleTracks = clusterTracks.slice(0, TOP_TRACKS_PER_CLUSTER);
    const losingCount = allLosing.filter(
      (l) => l.cluster_id === cluster.id
    ).length;
    const collapsed = collapsedClusterIds.has(cluster.id);

    nodes.push({
      id: clusterNodeId(cluster.id),
      type: "cluster",
      position: { x: 0, y: 0 },
      data: {
        kind: "cluster",
        cluster,
        trackCount: clusterTracks.length,
        losingCount,
        collapsed,
      },
    });

    edges.push({
      id: `e-root-${cluster.id}`,
      source: "root",
      target: clusterNodeId(cluster.id),
      type: "smoothstep",
      animated: false,
    });

    if (collapsed) continue;

    const visibleTrackIds = new Set(visibleTracks.map((t) => t.id));

    for (const track of visibleTracks) {
      nodes.push({
        id: trackNodeId(track.id),
        type: "track",
        position: { x: 0, y: 0 },
        data: { kind: "track", track, cluster },
      });
      edges.push({
        id: `e-${cluster.id}-${track.id}`,
        source: clusterNodeId(cluster.id),
        target: trackNodeId(track.id),
        type: "smoothstep",
      });
    }

    // Transition edges: parent_track → next_track within visible tracks of the cluster
    const clusterTransitions = allTransitions.filter(
      (tr: Transition) =>
        visibleTrackIds.has(tr.parent_track_id) &&
        tr.next_track_id &&
        visibleTrackIds.has(tr.next_track_id)
    );
    for (const tr of clusterTransitions) {
      if (!tr.next_track_id) continue;
      edges.push({
        id: `e-tr-${tr.parent_track_id}-${tr.next_track_id}`,
        source: trackNodeId(tr.parent_track_id),
        target: trackNodeId(tr.next_track_id),
        type: "smoothstep",
        animated: tr.condition === "worked",
        label: `${tr.condition} · ×${tr.sample_size}`,
        labelStyle: { fontSize: 10 },
        labelBgPadding: [4, 2],
        labelBgBorderRadius: 4,
        style: { stroke: transitionStroke(tr.condition), strokeDasharray: "4 3" },
      });
    }
  }

  return { nodes, edges };
}

export function clusterNodeId(clusterId: string): string {
  return `c:${clusterId}`;
}

export function trackNodeId(trackId: string): string {
  return `t:${trackId}`;
}

function humanCohort(c: string | null): string {
  if (!c) return "";
  if (c === "kenny_initial_50") return "Stage A — proof of methodology";
  if (c === "kenny_filtered_wins") return "Stage B — filtered wins";
  if (c === "kenny_filtered_engaged_losses") return "Stage B — engaged losses";
  if (c === "production") return "Production";
  return c;
}

function transitionStroke(condition: string): string {
  if (condition === "worked") return "#22c55e";
  if (condition === "partial") return "#f59e0b";
  return "#ef4444";
}
