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
import { buildTreeGraph } from "./tree-transform";
import { layoutGraph } from "./tree-layout";
import { NODE_TYPES } from "./tree-nodes";
import {
  TreeSidePanel,
  selectionFromNodeId,
  type Selection,
} from "./tree-side-panel";

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
  const [selection, setSelection] = useState<Selection>(null);
  const { fitView } = useReactFlow();

  useEffect(() => {
    const handler = (ev: Event) => {
      const detail = (ev as CustomEvent<{ clusterId: string }>).detail;
      if (!detail?.clusterId) return;
      setCollapsed((prev) => {
        // Focus-mode: clicking a collapsed cluster expands ONLY that one
        // (auto-collapses all others). Clicking an already-expanded cluster
        // simply collapses it.
        if (prev.has(detail.clusterId)) {
          const next = new Set(allClusterIds);
          next.delete(detail.clusterId);
          return next;
        }
        return new Set([...prev, detail.clusterId]);
      });
    };
    window.addEventListener("ion-tree-toggle", handler as EventListener);
    return () =>
      window.removeEventListener("ion-tree-toggle", handler as EventListener);
  }, [allClusterIds]);

  const { nodes, edges } = useMemo(() => {
    const g = buildTreeGraph(data, collapsed);
    const laidOut = layoutGraph(g.nodes, g.edges);
    return { nodes: laidOut, edges: g.edges };
  }, [data, collapsed]);

  // Re-fit viewport when the visible node set changes.
  useEffect(() => {
    const t = setTimeout(() => {
      fitView({ padding: 0.1, duration: 350, maxZoom: 1.3 });
    }, 30);
    return () => clearTimeout(t);
  }, [collapsed, fitView]);

  const onNodeClick: NodeMouseHandler = useCallback((_, node) => {
    if (node.id === "root") return;
    setSelection(selectionFromNodeId(node.id));
  }, []);

  const expandAll = () => setCollapsed(new Set());
  const collapseAll = () => setCollapsed(new Set(allClusterIds));
  const allExpanded = collapsed.size === 0;
  const allCollapsed = collapsed.size === allClusterIds.length;

  return (
    <div className="relative w-full h-[calc(100vh-260px)] min-h-[560px] rounded-lg border border-stewart-border bg-stewart-bg overflow-hidden">
      <div className="absolute top-3 left-3 z-30 flex gap-1 bg-stewart-card/90 border border-stewart-border rounded-md p-1 backdrop-blur-sm">
        <button
          onClick={expandAll}
          disabled={allExpanded}
          className="px-3 py-1.5 text-xs rounded hover:bg-stewart-border/50 text-stewart-text disabled:text-stewart-muted disabled:cursor-not-allowed transition-colors"
        >
          Expand all
        </button>
        <button
          onClick={collapseAll}
          disabled={allCollapsed}
          className="px-3 py-1.5 text-xs rounded hover:bg-stewart-border/50 text-stewart-text disabled:text-stewart-muted disabled:cursor-not-allowed transition-colors"
        >
          Collapse all
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
        fitView
        fitViewOptions={{ padding: 0.1, includeHiddenNodes: false, maxZoom: 1.3 }}
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
      <TreeSidePanel
        data={data}
        selection={selection}
        token={token}
        onClose={() => setSelection(null)}
      />
    </div>
  );
}

function miniMapColor(node: { type?: string }): string {
  if (node.type === "root") return "#fcd34d";
  if (node.type === "cluster") return "#c4b5fd";
  if (node.type === "track") return "#bae6fd";
  return "#94a3b8";
}
