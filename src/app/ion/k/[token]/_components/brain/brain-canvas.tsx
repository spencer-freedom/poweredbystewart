"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";

import type {
  BrainEdge,
  BrainGraphPayload,
  BrainNode,
} from "./brain-types";
import { CLUSTER_DEFAULT_COLOR, colorForCluster } from "./brain-types";

// react-force-graph-2d uses Canvas — must load client-only to avoid
// SSR document-undefined errors. dynamic({ ssr: false }) is the wrapper.
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
});

const MUTED_ALPHA = 0.15;
const FULL_ALPHA = 1.0;

type RFGNode = BrainNode & { vx?: number; vy?: number; fx?: number; fy?: number };
type RFGLink = {
  source: string | RFGNode;
  target: string | RFGNode;
  type: BrainEdge["type"];
  weight: number;
};

export type BrainCanvasProps = {
  data: BrainGraphPayload;
  onNodeClick?: (node: BrainNode) => void;
  onNodeHover?: (node: BrainNode | null, screenX: number, screenY: number) => void;
  // Set of node IDs currently matching a search. Empty = no filter,
  // everything full saturation. Non-empty = matching full, others muted.
  searchHighlight?: ReadonlySet<string>;
};

export function BrainCanvas({
  data,
  onNodeClick,
  onNodeHover,
  searchHighlight,
}: BrainCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 800, height: 600 });
  const [hoveredNode, setHoveredNode] = useState<BrainNode | null>(null);
  // Lock layout — the backend (eventually) ships pre-computed positions,
  // and the mock data also pre-positions nodes. We disable d3-force's
  // ongoing simulation by setting cooldownTicks=0 in the props below.

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setSize({ width: el.clientWidth, height: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Detect whether the payload carries meaningful pre-computed positions.
  // Backend's /api/stewart/wiki/graph will ship {x, y} per node — that's
  // the production path. For mock / legacy data without positions, we let
  // d3-force run a normal simulation on mount and then settle.
  const hasPrecomputed = useMemo(
    () =>
      data.nodes.length > 0 &&
      data.nodes.some((n) => Math.abs(n.x) + Math.abs(n.y) > 1),
    [data.nodes]
  );

  const graphData = useMemo(() => {
    const nodes: RFGNode[] = data.nodes.map((n) =>
      hasPrecomputed ? { ...n, fx: n.x, fy: n.y } : { ...n }
    );
    const links: RFGLink[] = data.edges.map((e) => ({ ...e }));
    return { nodes, links };
  }, [data, hasPrecomputed]);

  const isHighlighted = useCallback(
    (id: string) => {
      if (!searchHighlight || searchHighlight.size === 0) return true;
      return searchHighlight.has(id);
    },
    [searchHighlight]
  );

  const isBridgeCall = useCallback(
    (n: BrainNode) => n.type === "call" && n.cluster_ids.length > 1,
    []
  );

  // Custom node painter — Canvas operations for max control over
  // bridge halos, cluster colors, canonical rings, hover effect.
  // The library passes nodes through its generic shape; we narrow
  // back to BrainNode at the boundary.
  const paintNode = useCallback(
    (
      rawNode: object,
      ctx: CanvasRenderingContext2D,
      _globalScale: number
    ) => {
      const node = rawNode as BrainNode & { x?: number; y?: number };
      const x = node.x ?? 0;
      const y = node.y ?? 0;
      const alpha = isHighlighted(node.id) ? FULL_ALPHA : MUTED_ALPHA;
      const isHover = hoveredNode?.id === node.id;

      if (node.type === "call") {
        const radius = isBridgeCall(node) ? 14 : 9;
        const fill = isBridgeCall(node) ? "#a78bfa" : "#475569";

        // Bridge halo + hover-pulse (hover only, not constant)
        if (isBridgeCall(node)) {
          const pulseR = isHover ? radius + 8 + Math.sin(Date.now() / 200) * 3 : radius + 4;
          ctx.globalAlpha = alpha * 0.35;
          ctx.fillStyle = "#a78bfa";
          ctx.beginPath();
          ctx.arc(x, y, pulseR, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.globalAlpha = alpha;
        ctx.fillStyle = fill;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();

        // Outline on hover
        if (isHover) {
          ctx.strokeStyle = "#fff";
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
        return;
      }

      const isObjection = node.type === "objection";
      const isCanonical = node.is_canonical;
      const radius = isCanonical ? 7 : 5;
      const color = colorForCluster(node.cluster_id);

      // Canonical ring
      if (isCanonical) {
        ctx.globalAlpha = alpha * 0.6;
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(x, y, radius + 2, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.beginPath();
      // Solutions = filled circle, objections = ring
      if (isObjection) {
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(15,17,23,0.7)";
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.8;
        ctx.stroke();
      } else {
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Hover outline
      if (isHover) {
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x, y, radius + 3, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.globalAlpha = 1;
    },
    [hoveredNode, isHighlighted, isBridgeCall]
  );

  const linkColor = useCallback(
    (rawLink: object) => {
      const link = rawLink as RFGLink;
      const sId = typeof link.source === "string" ? link.source : link.source.id;
      const tId = typeof link.target === "string" ? link.target : link.target.id;
      const matched = isHighlighted(sId) && isHighlighted(tId);
      const baseAlpha = matched ? 1 : MUTED_ALPHA;

      if (link.type === "similarity") {
        // Similarity edges — opacity scales with weight (cosine score)
        const a = baseAlpha * (0.25 + link.weight * 0.55);
        return `rgba(167, 139, 250, ${a.toFixed(3)})`;
      }
      // Containment — solid muted line
      return `rgba(148, 163, 184, ${(baseAlpha * 0.45).toFixed(3)})`;
    },
    [isHighlighted]
  );

  const linkWidth = useCallback((rawLink: object) => {
    const link = rawLink as RFGLink;
    if (link.type === "similarity") return 0.4 + link.weight * 1.2;
    return 1.0;
  }, []);

  const handleNodeClick = useCallback(
    (n: object) => {
      const node = n as BrainNode;
      onNodeClick?.(node);
    },
    [onNodeClick]
  );

  const handleNodeHover = useCallback(
    (n: object | null) => {
      const node = (n as BrainNode | null) ?? null;
      setHoveredNode(node);
      // react-force-graph doesn't give us screen coords directly; the
      // tooltip positions itself from the canvas mousemove via a ref.
      onNodeHover?.(node, 0, 0);
    },
    [onNodeHover]
  );

  // Auto-fit to all nodes after the simulation settles. With pre-computed
  // positions the simulation never runs, so we call zoomToFit on mount.
  // Without pre-computed positions, we wait for onEngineStop (called when
  // d3-force cools below alphaMin) and fit then.
  const fgRef = useRef<{ zoomToFit?: (ms: number, pad: number) => void } | null>(null);
  useEffect(() => {
    if (!hasPrecomputed) return;
    const id = setTimeout(() => {
      fgRef.current?.zoomToFit?.(400, 80);
    }, 100);
    return () => clearTimeout(id);
  }, [data, hasPrecomputed]);

  const handleEngineStop = useCallback(() => {
    fgRef.current?.zoomToFit?.(400, 80);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[calc(100vh-260px)] min-h-[560px] rounded-lg border border-stewart-border bg-stewart-bg overflow-hidden"
    >
      <ForceGraph2D
        ref={fgRef as unknown as React.MutableRefObject<undefined>}
        width={size.width}
        height={size.height}
        graphData={graphData}
        backgroundColor="#0f1117"
        nodeRelSize={5}
        nodeCanvasObject={paintNode}
        nodePointerAreaPaint={(node: object, color: string, ctx: CanvasRenderingContext2D) => {
          const n = node as BrainNode & { x?: number; y?: number };
          const x = n.x ?? 0;
          const y = n.y ?? 0;
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(x, y, 12, 0, Math.PI * 2);
          ctx.fill();
        }}
        linkColor={linkColor}
        linkWidth={linkWidth}
        onNodeClick={handleNodeClick}
        onNodeHover={handleNodeHover}
        cooldownTicks={hasPrecomputed ? 0 : 200}
        warmupTicks={hasPrecomputed ? 0 : 80}
        d3AlphaDecay={hasPrecomputed ? 1 : 0.04}
        d3VelocityDecay={0.4}
        enableNodeDrag={false}
        onEngineStop={handleEngineStop}
      />
    </div>
  );
}

// Re-export for type inference at use sites.
export type { BrainNode, BrainEdge };
export { CLUSTER_DEFAULT_COLOR };
