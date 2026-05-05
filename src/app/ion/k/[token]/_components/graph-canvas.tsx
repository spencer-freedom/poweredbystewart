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

// Cap the zoom-out so cards never shrink past readable. Below this the
// user pans rather than seeing everything at once. Tunable per surface.
const MIN_READABLE_ZOOM = 0.55;
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
  // Optional legend slot — renders absolutely-positioned in the top-right
  // of the canvas. Use for explaining edge styles or color codes.
  legend?: React.ReactNode;
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
  legend,
}: GraphCanvasProps) {
  const { setViewport } = useReactFlow();
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

  // Auto-fit with a min-zoom clamp so cards never shrink past readable
  // even when the graph is dense. Once we hit MIN_READABLE_ZOOM, content
  // overflows and the user pans — better than auto-shrinking everything
  // to fit. Left-anchor mode skews the graph onto the left ~62% of the
  // canvas (cluster-tree drill-down hint); center mode is for the wiki.
  useEffect(() => {
    const t = setTimeout(() => {
      const containerEl = containerRef.current;
      if (!nodes.length || !containerEl) return;

      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const n of nodes) {
        const w = (n.style?.width as number) ?? 200;
        const h = (n.style?.height as number) ?? 80;
        if (n.position.x < minX) minX = n.position.x;
        if (n.position.y < minY) minY = n.position.y;
        if (n.position.x + w > maxX) maxX = n.position.x + w;
        if (n.position.y + h > maxY) maxY = n.position.y + h;
      }
      const graphW = Math.max(1, maxX - minX);
      const graphH = Math.max(1, maxY - minY);
      const cw = containerEl.clientWidth;
      const ch = containerEl.clientHeight;

      // Width allotted to the graph: full canvas in center mode, ~62% in
      // left-anchor mode (so the right ~38% stays empty as drill-down
      // invitation).
      const allottedW = leftAnchor ? cw * 0.62 : cw;
      const allottedH = ch;
      const padding = leftAnchor ? 32 : 48;

      const naturalZoom = Math.min(
        (allottedW - padding * 2) / graphW,
        (allottedH - padding * 2) / graphH
      );
      const zoom = Math.max(MIN_READABLE_ZOOM, Math.min(1.3, naturalZoom));

      // Center vs left-anchor placement of the graph.
      const x = leftAnchor
        ? padding - minX * zoom
        : (cw - graphW * zoom) / 2 - minX * zoom;
      const y = (ch - graphH * zoom) / 2 - minY * zoom;

      setViewport({ x, y, zoom }, { duration: 350 });
    }, 30);
    return () => clearTimeout(t);
  }, [setViewport, nodes, leftAnchor]);

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
        {legend && (
          <div className="absolute top-3 right-3 z-30 bg-stewart-card/90 border border-stewart-border rounded-md p-2.5 backdrop-blur-sm">
            {legend}
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
