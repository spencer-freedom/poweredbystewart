"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlowProvider,
  useReactFlow,
  useViewport,
  type Edge,
  type Node,
  type NodeMouseHandler,
  type NodeTypes,
} from "reactflow";
import "reactflow/dist/style.css";

export type GraphCanvasProps = {
  nodes: Node[];
  edges: Edge[];
  nodeTypes: NodeTypes;
  onNodeClick: NodeMouseHandler;
  // Node id whose row the overlay detail card should align to. Null = no card.
  selectedNodeId?: string | null;
  // Render prop receives the computed top offset (px) for an overlay detail
  // card. Callers render their own card (cluster-tree, wiki, etc.) using it.
  renderDetailCard?: (topPx: number | null) => React.ReactNode;
  // Render prop for the optional top-left toolbar slot (Reset, etc.).
  renderToolbar?: () => React.ReactNode;
  // Optional intro text shown above the canvas — e.g. "click to drill in".
  intro?: React.ReactNode;
  miniMapColor?: (node: { type?: string }) => string;
  // Skew the auto-fit rectangle wider so the graph lands on the left ~62%
  // of the canvas with empty space on the right (invites drill-down). The
  // cluster tree wants this; the wiki overview (dense graph filling the
  // canvas) does not. Default true for backward compat.
  leftAnchor?: boolean;
};

const DEFAULT_COLOR = "#94a3b8";

export function GraphCanvas(props: GraphCanvasProps) {
  return (
    <ReactFlowProvider>
      <GraphCanvasInner {...props} />
    </ReactFlowProvider>
  );
}

function GraphCanvasInner({
  nodes,
  edges,
  nodeTypes,
  onNodeClick,
  selectedNodeId,
  renderDetailCard,
  renderToolbar,
  intro,
  miniMapColor = () => DEFAULT_COLOR,
  leftAnchor = true,
}: GraphCanvasProps) {
  const { fitBounds } = useReactFlow();
  const viewport = useViewport();
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setContainerHeight(el.clientHeight);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Auto-fit with a left-anchor rectangle skew (1.6× wider than the actual
  // tree extent), so the graph lands on the left ~62% of the canvas with
  // empty space on the right that visually invites drill-down.
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
      const widthMult = leftAnchor ? 1.6 : 1.0;
      const padding = leftAnchor ? 0.05 : 0.08;
      fitBounds(
        { x: minX, y: minY, width: w * widthMult, height: h * 1.05 },
        { padding, duration: 350 }
      );
    }, 30);
    return () => clearTimeout(t);
  }, [fitBounds, nodes, leftAnchor]);

  // Vertical position of the overlay detail card — slides to align with the
  // selected node's row. Clamped so it never spills past the canvas bottom.
  const cardTopPx = useMemo(() => {
    if (!selectedNodeId) return null;
    const node = nodes.find((n) => n.id === selectedNodeId);
    if (!node) return null;
    const screenY = node.position.y * viewport.zoom + viewport.y;
    const safeMin = 16;
    const safeMax = Math.max(safeMin, containerHeight - 340);
    return Math.max(safeMin, Math.min(safeMax, screenY));
  }, [selectedNodeId, nodes, viewport, containerHeight]);

  return (
    <div className="space-y-2">
      {intro}
      <div
        ref={containerRef}
        className="relative w-full h-[calc(100vh-260px)] min-h-[560px] rounded-lg border border-stewart-border bg-stewart-bg overflow-hidden"
      >
        {renderToolbar && (
          <div className="absolute top-3 left-3 z-30 flex gap-1 bg-stewart-card/90 border border-stewart-border rounded-md p-1 backdrop-blur-sm">
            {renderToolbar()}
          </div>
        )}
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
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
        {renderDetailCard?.(cardTopPx)}
      </div>
    </div>
  );
}
