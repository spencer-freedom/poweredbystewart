"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import * as THREE from "three";

import type { BrainEdge, BrainGraphPayload, BrainNode } from "./brain-types";
import { CLUSTER_DEFAULT_COLOR } from "./brain-types";
import { buildBrainNode } from "./brain-three-objects";
import { startPulseLoop, type PulseLoopHandle } from "./brain-pulse-loop";

// react-force-graph-3d is WebGL/Three.js — must load client-only to avoid
// SSR document/window errors. dynamic({ ssr: false }) is the wrapper.
const ForceGraph3D = dynamic(() => import("react-force-graph-3d"), {
  ssr: false,
});

type RFGNode = BrainNode & {
  vx?: number;
  vy?: number;
  vz?: number;
  fx?: number;
  fy?: number;
  fz?: number;
};
type RFGLink = {
  source: string | RFGNode;
  target: string | RFGNode;
  type: BrainEdge["type"];
  weight: number;
  outcome?: string;
  similarity?: number;
};

// react-force-graph-3d's runtime ref shape — narrowed to the methods
// we call. The published types ship as `any`, so we declare locally.
type ForceGraph3DInstance = {
  cameraPosition: (
    pos: { x?: number; y?: number; z?: number },
    lookAt?: { x: number; y: number; z: number },
    ms?: number
  ) => void;
  controls: () => {
    autoRotate: boolean;
    autoRotateSpeed: number;
    update: () => void;
    addEventListener: (event: string, fn: () => void) => void;
  };
  scene: () => THREE.Scene;
  zoomToFit: (ms: number, pad: number) => void;
};

export type BrainCanvasProps = {
  data: BrainGraphPayload;
  onNodeClick?: (node: BrainNode) => void;
  onNodeHover?: (node: BrainNode | null, screenX: number, screenY: number) => void;
  searchHighlight?: ReadonlySet<string>;
};

const IDLE_RESUME_MS = 8000;
const AUTO_ROTATE_SPEED = 0.4; // ~2.5 min per full rotation, museum pace

export function BrainCanvas({
  data,
  onNodeClick,
  onNodeHover,
  searchHighlight,
}: BrainCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const fgRef = useRef<ForceGraph3DInstance | null>(null);
  const pulseRef = useRef<PulseLoopHandle | null>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [size, setSize] = useState({ width: 800, height: 600 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setSize({ width: el.clientWidth, height: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Pre-positioned nodes from the backend's force layout. Pin them via
  // fx/fy/fz so d3-force-3d doesn't keep wiggling — the visual signal we
  // want is calls clustered at center, events orbiting on the rim.
  const graphData = useMemo(() => {
    const nodes: RFGNode[] = data.nodes.map((n) => ({
      ...n,
      fx: n.x,
      fy: n.y,
      fz: n.z,
    }));
    const links: RFGLink[] = data.edges.map((e) => ({ ...e }));
    return { nodes, links };
  }, [data]);

  // Custom Three.js node builder. rfg-3d caches the returned object per
  // node id, so this only fires when the node first renders or graphData
  // changes — not every frame.
  const nodeThreeObject = useCallback((rawNode: object): THREE.Object3D => {
    const node = rawNode as BrainNode;
    return buildBrainNode(node);
  }, []);

  const linkColor = useCallback((rawLink: object) => {
    const link = rawLink as RFGLink;
    if (link.type === "answered_by") {
      // Outcome-tinted: green/amber/red for worked/partial/failed
      const outcome = link.outcome ?? "partial";
      if (outcome === "worked") return "rgba(52, 211, 153, 0.55)";
      if (outcome === "failed") return "rgba(248, 113, 113, 0.45)";
      return "rgba(251, 191, 36, 0.45)"; // partial / unknown
    }
    if (link.type === "similarity") {
      // Opacity scales with weight (cosine score)
      const a = 0.18 + link.weight * 0.5;
      return `rgba(167, 139, 250, ${a.toFixed(3)})`;
    }
    // Containment — muted gray
    return "rgba(148, 163, 184, 0.32)";
  }, []);

  const linkWidth = useCallback((rawLink: object) => {
    const link = rawLink as RFGLink;
    if (link.type === "similarity") return 0.3 + link.weight * 1.2;
    if (link.type === "answered_by") return 0.8;
    return 0.6;
  }, []);

  // Pulse loop boots once, looks up the scene root from the rfg ref every
  // tick. We don't need to restart it when graphData changes — the loop
  // re-traverses the scene, so new nodes pick up the pulse automatically.
  useEffect(() => {
    pulseRef.current = startPulseLoop(() => fgRef.current?.scene() ?? null);
    return () => {
      pulseRef.current?.stop();
      pulseRef.current = null;
    };
  }, []);

  // Push search highlight changes into the pulse loop so it can drive
  // the alpha-fade + intensity-boost behaviors per frame.
  useEffect(() => {
    pulseRef.current?.setSearchHighlight(searchHighlight ?? new Set());
  }, [searchHighlight]);

  // Boot OrbitControls auto-rotate once the underlying graph mounts.
  // rfg-3d resolves controls() lazily, so we poll briefly until ready.
  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    const tryWire = () => {
      if (cancelled) return;
      const fg = fgRef.current;
      const ctl = fg?.controls?.();
      if (!ctl) {
        attempts++;
        if (attempts < 40) setTimeout(tryWire, 100);
        return;
      }
      ctl.autoRotate = true;
      ctl.autoRotateSpeed = AUTO_ROTATE_SPEED;
      // Pause auto-rotate on user interaction; resume after idle window.
      const onInteract = () => {
        ctl.autoRotate = false;
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        idleTimerRef.current = setTimeout(() => {
          if (!document.hidden) ctl.autoRotate = true;
        }, IDLE_RESUME_MS);
      };
      ctl.addEventListener("start", onInteract);
    };
    tryWire();
    return () => {
      cancelled = true;
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, []);

  // Pre-build adjacency for click signal-fire (1-hop neighbors).
  const neighbors = useMemo(() => {
    const map = new Map<string, Set<string>>();
    const add = (a: string, b: string) => {
      const arr = map.get(a) ?? new Set<string>();
      arr.add(b);
      map.set(a, arr);
    };
    for (const e of data.edges) {
      add(e.source, e.target);
      add(e.target, e.source);
    }
    return map;
  }, [data.edges]);

  const handleNodeClick = useCallback(
    (rawNode: object) => {
      const node = rawNode as BrainNode;
      // Cinematic camera move: pull back along the vector from origin to
      // the node. Distance ~ 80 in scene units gives a comfortable framing
      // without zooming inside other geometry.
      const fg = fgRef.current;
      if (fg) {
        const dist = Math.hypot(node.x, node.y, node.z) || 1;
        const ratio = 1 + 80 / dist;
        fg.cameraPosition(
          { x: node.x * ratio, y: node.y * ratio, z: node.z * ratio },
          { x: node.x, y: node.y, z: node.z },
          1500
        );
        // Pause auto-rotate during the move; idle timer will resume it.
        const ctl = fg.controls?.();
        if (ctl) {
          ctl.autoRotate = false;
          if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
          idleTimerRef.current = setTimeout(() => {
            if (!document.hidden) ctl.autoRotate = true;
          }, IDLE_RESUME_MS);
        }
      }
      // Signal-fire pulse on the clicked node + 1-hop neighbors
      const ids = [node.id, ...Array.from(neighbors.get(node.id) ?? [])];
      pulseRef.current?.fireSignal(ids, 3000);
      onNodeClick?.(node);
    },
    [onNodeClick, neighbors]
  );

  const handleNodeHover = useCallback(
    (rawNode: object | null) => {
      const node = (rawNode as BrainNode | null) ?? null;
      onNodeHover?.(node, 0, 0);
    },
    [onNodeHover]
  );

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[calc(100vh-260px)] min-h-[560px] rounded-lg border border-stewart-border bg-stewart-bg overflow-hidden"
    >
      <ForceGraph3D
        ref={fgRef as unknown as React.MutableRefObject<undefined>}
        width={size.width}
        height={size.height}
        graphData={graphData}
        backgroundColor="#0f1117"
        nodeThreeObject={nodeThreeObject}
        nodeThreeObjectExtend={false}
        nodeLabel={(n: object) => {
          const node = n as BrainNode;
          const tipStyle =
            "background:#0f1117;border:1px solid #2d3748;color:#e2e8f0;padding:6px 10px;border-radius:6px;font-family:ui-monospace,monospace;font-size:11px;max-width:280px";
          if (node.type === "call") {
            return `<div style="${tipStyle}">call · ${node.setter_name ?? node.setter_id ?? "—"}${node.is_bridge ? " · bridge" : ""}</div>`;
          }
          const outcome = node.effective_outcome ?? "unknown";
          return `<div style="${tipStyle}">${node.cluster_id.replace(/_/g, " ")} · ${node.type} · ${outcome}${node.is_canonical ? " · canonical" : ""}</div>`;
        }}
        linkColor={linkColor}
        linkWidth={linkWidth}
        linkOpacity={1}
        onNodeClick={handleNodeClick}
        onNodeHover={handleNodeHover}
        cooldownTicks={0}
        warmupTicks={0}
        enableNodeDrag={false}
      />
    </div>
  );
}

// Re-export for type inference at use sites.
export type { BrainNode, BrainEdge };
export { CLUSTER_DEFAULT_COLOR };
