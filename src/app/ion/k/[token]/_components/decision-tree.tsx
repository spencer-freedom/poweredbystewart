"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { type NodeMouseHandler } from "reactflow";

import type { DecisionTreePayload } from "@/lib/ion-api";
import { GraphCanvas } from "./graph-canvas";
import { buildTreeGraph, type DetailSelection } from "./tree-transform";
import { layoutGraph } from "./tree-layout";
import { NODE_TYPES } from "./tree-nodes";
import { TreeDetailCard } from "./tree-detail-card";

export function DecisionTree({
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
  const [collapsed, setCollapsed] = useState<Set<string>>(
    () => new Set(allClusterIds)
  );
  const [detail, setDetail] = useState<DetailSelection>(null);
  const [hasDrilled, setHasDrilled] = useState(false);

  const toggleCluster = useCallback(
    (clusterId: string) => {
      setDetail(null);
      setHasDrilled(true);
      setCollapsed((prev) => {
        if (prev.has(clusterId)) {
          const next = new Set(allClusterIds);
          next.delete(clusterId);
          return next;
        }
        return new Set([...prev, clusterId]);
      });
    },
    [allClusterIds]
  );

  useEffect(() => {
    if (!detail) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDetail(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [detail]);

  const { nodes, edges } = useMemo(() => {
    const g = buildTreeGraph(data, collapsed);
    const laidOut = layoutGraph(g.nodes, g.edges);
    return { nodes: laidOut, edges: g.edges };
  }, [data, collapsed]);

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
      intro={
        !hasDrilled ? (
          <p className="text-stewart-muted text-sm">
            Click a cluster to drill in. Click a winning track to hear the
            audio. Pan + scroll to zoom.
          </p>
        ) : null
      }
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
