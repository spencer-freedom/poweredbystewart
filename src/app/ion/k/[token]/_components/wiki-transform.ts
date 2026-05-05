// Wiki graph transform — local fallback view computed from the existing
// /api/ion/decision-tree payload. Renders the cluster taxonomy as a
// navigable knowledge graph. The real /api/ion/wiki endpoint (Archivist,
// shipping ~Day 6) will return richer cross-call traversals; this is the
// placeholder + visual prototype that lights up immediately on existing
// data so Spencer + customers see the surface.
//
// Differences from the cluster-tree graph (same data, different framing):
//   • Default state = all clusters expanded (overview, not focus-drill)
//   • Cross-call edges added: when two tracks share source_call_id, a
//     dashed violet edge connects them — the "Obsidian feel" hint of
//     cross-cluster relationships even before Archivist's full traversal
//   • Same node components (cluster / track / losing) so the visual
//     vocabulary stays consistent across surfaces

import type { DecisionTreePayload } from "@/lib/ion-api";
import {
  buildTreeGraph,
  type ClusterNodeData,
  type TrackNodeData,
  type TreeGraph,
} from "./tree-transform";

export function buildWikiGraph(
  data: DecisionTreePayload,
  collapsedClusterIds: Set<string>
): TreeGraph {
  const base = buildTreeGraph(data, collapsedClusterIds);

  // Group VISIBLE track nodes by source_call_id so we only add edges between
  // tracks the user can actually see right now.
  const callsToVisibleTracks = new Map<string, string[]>();
  for (const node of base.nodes) {
    if (!node.id.startsWith("t:")) continue;
    const d = node.data as TrackNodeData | ClusterNodeData;
    if (d.kind !== "track") continue;
    const callId = d.track.source_call_id;
    const arr = callsToVisibleTracks.get(callId) || [];
    arr.push(node.id);
    callsToVisibleTracks.set(callId, arr);
  }

  for (const [callId, trackIds] of callsToVisibleTracks) {
    if (trackIds.length < 2) continue;
    for (let i = 0; i < trackIds.length - 1; i++) {
      for (let j = i + 1; j < trackIds.length; j++) {
        base.edges.push({
          id: `wiki-call-${callId}-${i}-${j}`,
          source: trackIds[i],
          target: trackIds[j],
          type: "default",
          style: { stroke: "#a78bfa", strokeOpacity: 0.45, strokeDasharray: "3 4" },
          label: "same call",
          labelStyle: { fontSize: 10, fill: "#a78bfa" },
          labelBgPadding: [4, 2] as [number, number],
          labelBgBorderRadius: 4,
        });
      }
    }
  }

  return base;
}
