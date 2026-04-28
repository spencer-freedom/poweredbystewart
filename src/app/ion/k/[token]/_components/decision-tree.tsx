"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlowProvider,
  useReactFlow,
  type NodeMouseHandler,
} from "reactflow";
import "reactflow/dist/style.css";

import type { DecisionTreePayload } from "@/lib/ion-api";
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
  return (
    <ReactFlowProvider>
      <DecisionTreeInner data={data} token={token} />
    </ReactFlowProvider>
  );
}

function DecisionTreeInner({
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
  const { fitBounds } = useReactFlow();

  const toggleCluster = useCallback(
    (clusterId: string) => {
      setDetail(null);
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

  // Left-anchor the tree: stretch the fit-bounds rectangle 1.6x to the right
  // so the tree lands on the left ~62% of the canvas and the empty space
  // visually invites drill-down.
  useEffect(() => {
    const t = setTimeout(() => {
      if (!nodes.length) return;
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const n of nodes) {
        const w = (n.style?.width as number) ?? 200;
        const h = (n.style?.height as number) ?? 80;
        if (n.position.x < minX) minX = n.position.x;
        if (n.position.y < minY) minY = n.position.y;
        if (n.position.x + w > maxX) maxX = n.position.x + w;
        if (n.position.y + h > maxY) maxY = n.position.y + h;
      }
      const w = Math.max(1, maxX - minX);
      const h = Math.max(1, maxY - minY);
      fitBounds(
        { x: minX, y: minY, width: w * 1.6, height: h * 1.05 },
        { padding: 0.05, duration: 350 }
      );
    }, 30);
    return () => clearTimeout(t);
  }, [collapsed, fitBounds, nodes]);

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

  return (
    <div className="relative w-full h-[calc(100vh-260px)] min-h-[560px] rounded-lg border border-stewart-border bg-stewart-bg overflow-hidden">
      <div className="absolute top-3 left-3 z-30 flex gap-1 bg-stewart-card/90 border border-stewart-border rounded-md p-1 backdrop-blur-sm">
        <button
          onClick={collapseAll}
          disabled={allCollapsed}
          className="px-3 py-1.5 text-xs rounded hover:bg-stewart-border/50 text-stewart-text disabled:text-stewart-muted disabled:cursor-not-allowed transition-colors"
        >
          Reset
        </button>
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={NODE_TYPES}
        onNodeClick={onNodeClick}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable
        proOptions={{ hideAttribution: true }}
        minZoom={0.18}
        maxZoom={1.8}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1}
          color="#2a2d3a"
        />
        <Controls
          showInteractive={false}
          className="!bg-stewart-card !border-stewart-border"
        />
        <MiniMap
          pannable
          zoomable
          nodeColor={miniMapColor}
          maskColor="rgba(15,17,23,0.7)"
          className="!bg-stewart-card !border !border-stewart-border"
        />
      </ReactFlow>
      <TreeDetailCard
        data={data}
        detail={detail}
        token={token}
        onClose={() => setDetail(null)}
      />
    </div>
  );
}

function miniMapColor(node: { type?: string }): string {
  if (node.type === "root") return "#fcd34d";
  if (node.type === "cluster") return "#c4b5fd";
  if (node.type === "track") return "#bae6fd";
  if (node.type === "losing") return "#fda4af";
  return "#94a3b8";
}
