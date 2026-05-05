"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { NodeMouseHandler } from "reactflow";

import type { DecisionTreePayload } from "@/lib/ion-api";
import { GraphCanvas } from "./graph-canvas";
import { buildBrainGraph } from "./wiki-brain-transform";
import { brainLayout } from "./wiki-brain-layout";
import { BRAIN_NODE_TYPES } from "./wiki-brain-nodes";
import { TreeDetailCard } from "./tree-detail-card";
import type { DetailSelection } from "./tree-transform";
import { EdgeLegend } from "./edge-legend";

const BRAIN_LEGEND = [
  { label: "winning track in cluster", variant: "solid" as const, color: "#bae6fd" },
  { label: "cross-cluster bridge call", variant: "dashed" as const, color: "#a78bfa" },
  { label: "single-cluster call", variant: "solid" as const, color: "#475569" },
];

export function WikiBrain({
  data,
  token,
}: {
  data: DecisionTreePayload;
  token: string;
}) {
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
    const g = buildBrainGraph(data);
    const laidOut = brainLayout(g.nodes, g.edges);
    return { nodes: laidOut, edges: g.edges };
  }, [data]);

  const onNodeClick: NodeMouseHandler = useCallback((_, node) => {
    if (node.id.startsWith("bt:")) {
      const trackId = node.id.slice(3);
      setDetail((prev) =>
        prev && prev.kind === "track" && prev.id === trackId
          ? null
          : { kind: "track", id: trackId }
      );
    }
    // Cluster + call clicks: no-op for prototype. Day 3 polish: cluster
    // click could focus that cluster's subgraph; call click could open a
    // call summary card.
  }, []);

  const selectedNodeId =
    detail && detail.kind === "track" ? `bt:${detail.id}` : null;

  return (
    <GraphCanvas
      nodes={nodes}
      edges={edges}
      nodeTypes={BRAIN_NODE_TYPES}
      onNodeClick={onNodeClick}
      selectedNodeId={selectedNodeId}
      miniMapColor={miniMapColor}
      leftAnchor={false}
      legend={<EdgeLegend items={BRAIN_LEGEND} />}
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
  if (node.type === "brain-cluster") return "#a78bfa";
  if (node.type === "brain-track") return "#bae6fd";
  if (node.type === "brain-call") return "#94a3b8";
  return "#94a3b8";
}
