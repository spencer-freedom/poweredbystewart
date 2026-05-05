"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { NodeMouseHandler } from "reactflow";

import type { DecisionTreePayload } from "@/lib/ion-api";
import { GraphCanvas } from "./graph-canvas";
import { buildWikiGraph } from "./wiki-transform";
import { layoutGraph } from "./tree-layout";
import { NODE_TYPES } from "./tree-nodes";
import { TreeDetailCard } from "./tree-detail-card";
import type { DetailSelection } from "./tree-transform";

export function WikiGraph({
  data,
  token,
}: {
  data: DecisionTreePayload;
  token: string;
}) {
  const allClusterIds = useMemo(
    () => (data.clusters || []).map((c) => c.id),
    [data]
  );
  // Wiki default = collapsed overview (root + 8 clusters). Unlike the
  // cluster tree's focus-mode (only one cluster expanded at a time), the
  // wiki allows MULTIPLE clusters expanded so cross-call edges between
  // tracks in different clusters become visible — that's the "Obsidian
  // feel" signal. Click a cluster to toggle; expand 2-3 to see same-call
  // links connect across the graph.
  const [collapsed, setCollapsed] = useState<Set<string>>(
    () => new Set(allClusterIds)
  );
  const [detail, setDetail] = useState<DetailSelection>(null);

  useEffect(() => {
    if (!detail) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDetail(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [detail]);

  const { nodes, edges } = useMemo(() => {
    const g = buildWikiGraph(data, collapsed);
    const laidOut = layoutGraph(g.nodes, g.edges);
    return { nodes: laidOut, edges: g.edges };
  }, [data, collapsed]);

  // Multi-expand: clicking toggles JUST this cluster. Other expanded
  // clusters stay open — that's how cross-call edges become visible.
  const toggleCluster = useCallback((clusterId: string) => {
    setDetail(null);
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(clusterId)) next.delete(clusterId);
      else next.add(clusterId);
      return next;
    });
  }, []);

  const onNodeClick: NodeMouseHandler = useCallback(
    (_, node) => {
      if (node.id === "root") return;
      if (node.id.startsWith("c:")) {
        toggleCluster(node.id.slice(2));
        return;
      }
      if (node.id.startsWith("t:")) {
        const trackId = node.id.slice(2);
        setDetail((prev) =>
          prev && prev.kind === "track" && prev.id === trackId
            ? null
            : { kind: "track", id: trackId }
        );
        return;
      }
      if (node.id.startsWith("l:")) {
        const rest = node.id.slice(2);
        const lastColon = rest.lastIndexOf(":");
        const clusterId = rest.slice(0, lastColon);
        const index = Number(rest.slice(lastColon + 1)) || 0;
        setDetail((prev) =>
          prev &&
          prev.kind === "losing" &&
          prev.clusterId === clusterId &&
          prev.index === index
            ? null
            : { kind: "losing", clusterId, index }
        );
      }
    },
    [toggleCluster]
  );

  const collapseAll = () => {
    setDetail(null);
    setCollapsed(new Set(allClusterIds));
  };
  const allCollapsed = collapsed.size === allClusterIds.length;

  const selectedNodeId = detail
    ? detail.kind === "track"
      ? `t:${detail.id}`
      : `l:${detail.clusterId}:${detail.index}`
    : null;

  return (
    <GraphCanvas
      nodes={nodes}
      edges={edges}
      nodeTypes={NODE_TYPES}
      onNodeClick={onNodeClick}
      selectedNodeId={selectedNodeId}
      miniMapColor={miniMapColor}
      leftAnchor={false}
      renderToolbar={() => (
        <button
          onClick={collapseAll}
          disabled={allCollapsed}
          className="px-3 py-1.5 text-xs rounded hover:bg-stewart-border/50 text-stewart-text disabled:text-stewart-muted disabled:cursor-not-allowed transition-colors"
        >
          Reset
        </button>
      )}
      renderDetailCard={(topPx) => (
        <TreeDetailCard
          data={data}
          detail={detail}
          token={token}
          onClose={() => setDetail(null)}
          topPx={topPx}
        />
      )}
    />
  );
}

function miniMapColor(node: { type?: string }): string {
  if (node.type === "root") return "#fcd34d";
  if (node.type === "cluster") return "#c4b5fd";
  if (node.type === "track") return "#bae6fd";
  if (node.type === "losing") return "#fda4af";
  return "#94a3b8";
}
