"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import * as THREE from "three";

import type { BrainEdge, BrainGraphPayload, BrainNode } from "./brain-types";
import { CLUSTER_DEFAULT_COLOR, OUTCOME_COLORS, paletteForOutcome } from "./brain-types";
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
  outcome?: BrainEdge["outcome"];
  similarity?: number;
};

// react-force-graph-3d's runtime ref shape — narrowed to the methods we
// touch. The published types ship as `any` for some entry points, so we
// declare locally where it helps.
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
  camera: () => THREE.Camera;
  renderer: () => THREE.WebGLRenderer;
  postProcessingComposer: () => {
    addPass: (pass: unknown) => void;
    passes: unknown[];
  };
  zoomToFit: (ms: number, pad: number) => void;
};

export type BrainCanvasProps = {
  data: BrainGraphPayload;
  onNodeClick?: (node: BrainNode) => void;
  onNodeHover?: (node: BrainNode | null, screenX: number, screenY: number) => void;
  searchHighlight?: ReadonlySet<string>;
};

const IDLE_RESUME_MS = 5000;
const AUTO_ROTATE_SPEED = 0.25; // ~3-min per rotation, museum-case slow
const SCENE_BG = "#020617"; // deep cosmic void
const FOG_NEAR_COLOR = "#0F172A";

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

  // Edge styling — answered_by becomes the eye-catcher (bold, outcome-
  // tinted, with directional particles flowing source→target). Similarity
  // edges are subtle violet threads. Containment is muted gray scaffolding.
  const linkColor = useCallback((rawLink: object) => {
    const link = rawLink as RFGLink;
    if (link.type === "answered_by") {
      const bucket = link.outcome ?? "unknown";
      const palette = paletteForOutcome(bucket);
      return palette.core;
    }
    if (link.type === "similarity") {
      const a = 0.16 + (link.weight ?? 0) * 0.45;
      return `rgba(167, 139, 250, ${a.toFixed(3)})`;
    }
    return "rgba(148, 163, 184, 0.22)";
  }, []);

  const linkWidth = useCallback((rawLink: object) => {
    const link = rawLink as RFGLink;
    if (link.type === "answered_by") return 2.5;
    if (link.type === "similarity") return 0.4 + (link.weight ?? 0) * 1.0;
    return 0.5;
  }, []);

  const linkOpacity = useCallback((rawLink: object) => {
    const link = rawLink as RFGLink;
    if (link.type === "answered_by") return 0.85;
    if (link.type === "similarity") return 0.55;
    return 0.35;
  }, []);

  const linkParticles = useCallback((rawLink: object) => {
    const link = rawLink as RFGLink;
    return link.type === "answered_by" ? 2 : 0;
  }, []);

  const linkParticleColor = useCallback((rawLink: object) => {
    const link = rawLink as RFGLink;
    const palette = paletteForOutcome(link.outcome ?? "unknown");
    return palette.shell;
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

  useEffect(() => {
    pulseRef.current?.setSearchHighlight(searchHighlight ?? new Set());
  }, [searchHighlight]);

  // Boot OrbitControls auto-rotate + scene fog + bloom postprocessing +
  // ether particles once the underlying graph mounts. rfg-3d resolves
  // controls/scene/camera lazily, so we poll briefly until ready.
  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    let etherDisposer: (() => void) | null = null;

    const tryWire = async () => {
      if (cancelled) return;
      const fg = fgRef.current;
      const ctl = fg?.controls?.();
      const scene = fg?.scene?.();
      if (!ctl || !scene) {
        attempts++;
        if (attempts < 50) setTimeout(tryWire, 100);
        return;
      }

      // Auto-rotate at idle, pause on user interaction, resume after idle window
      ctl.autoRotate = true;
      ctl.autoRotateSpeed = AUTO_ROTATE_SPEED;
      const onInteract = () => {
        ctl.autoRotate = false;
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        idleTimerRef.current = setTimeout(() => {
          if (!document.hidden) ctl.autoRotate = true;
        }, IDLE_RESUME_MS);
      };
      ctl.addEventListener("start", onInteract);

      // Cosmic background + fog — outer nodes haze into the void, inner
      // nodes pop. Cheap depth signal that doesn't cost frame budget.
      scene.background = new THREE.Color(SCENE_BG);
      scene.fog = new THREE.FogExp2(FOG_NEAR_COLOR, 0.0017);

      // Ether particle field — drifts very slowly behind the graph so the
      // void feels like a luminous medium, not pure black. Tuned at 1500
      // particles for cost/visual ratio.
      const ETHER_COUNT = 1500;
      const positions = new Float32Array(ETHER_COUNT * 3);
      const opacities = new Float32Array(ETHER_COUNT);
      for (let i = 0; i < ETHER_COUNT; i++) {
        // Sphere of radius 600 around origin
        const r = 200 + Math.random() * 400;
        const phi = Math.acos(2 * Math.random() - 1);
        const theta = 2 * Math.PI * Math.random();
        positions[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = r * Math.cos(phi);
        opacities[i] = 0.1 + Math.random() * 0.25;
      }
      const etherGeo = new THREE.BufferGeometry();
      etherGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      const etherMat = new THREE.PointsMaterial({
        color: "#94A3B8",
        size: 1.0,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.35,
        depthWrite: false,
      });
      const ether = new THREE.Points(etherGeo, etherMat);
      ether.name = "stewart-ether-field";
      scene.add(ether);

      // Slow rotation of the ether field so the medium feels alive
      let etherFrameId: number;
      const etherTick = () => {
        if (cancelled) return;
        ether.rotation.y += 0.0003;
        ether.rotation.x += 0.00015;
        etherFrameId = requestAnimationFrame(etherTick);
      };
      etherFrameId = requestAnimationFrame(etherTick);
      etherDisposer = () => {
        cancelAnimationFrame(etherFrameId);
        scene.remove(ether);
        etherGeo.dispose();
        etherMat.dispose();
      };

      // UnrealBloom — only emissive contributes meaningfully because
      // every outcome-colored sphere is emissive. Threshold 0.5 means
      // canonical + winner + bridge + click pulses bloom; muted nodes
      // stay calm.
      try {
        const composer = fg?.postProcessingComposer?.();
        if (composer) {
          const { UnrealBloomPass } = await import(
            "three/examples/jsm/postprocessing/UnrealBloomPass.js"
          );
          const bloom = new UnrealBloomPass(
            new THREE.Vector2(size.width, size.height),
            0.85, // strength
            0.6,  // radius
            0.5   // threshold
          );
          composer.addPass(bloom);
        }
      } catch {
        // Postprocessing failing shouldn't break the brain — bloom is
        // polish, not a load-bearing feature.
      }
    };

    tryWire();
    return () => {
      cancelled = true;
      etherDisposer?.();
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
    // We intentionally only run this once on mount; the wiring is sticky.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      // the node. Distance ~80 in scene units gives a comfortable framing
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
        const ctl = fg.controls?.();
        if (ctl) {
          ctl.autoRotate = false;
          if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
          idleTimerRef.current = setTimeout(() => {
            if (!document.hidden) ctl.autoRotate = true;
          }, IDLE_RESUME_MS);
        }
      }
      const ids = [node.id, ...Array.from(neighbors.get(node.id) ?? [])];
      pulseRef.current?.fireSignal(ids, 3000);
      onNodeClick?.(node);
    },
    [onNodeClick, neighbors]
  );

  const handleNodeHover = useCallback(
    (rawNode: object | null) => {
      const node = (rawNode as BrainNode | null) ?? null;
      if (node) {
        const ids = [node.id, ...Array.from(neighbors.get(node.id) ?? [])];
        pulseRef.current?.fireHover(ids, 800);
      }
      onNodeHover?.(node, 0, 0);
    },
    [onNodeHover, neighbors]
  );

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[calc(100vh-260px)] min-h-[560px] rounded-lg border border-stewart-border overflow-hidden"
      style={{ background: SCENE_BG }}
    >
      <ForceGraph3D
        ref={fgRef as unknown as React.MutableRefObject<undefined>}
        width={size.width}
        height={size.height}
        graphData={graphData}
        backgroundColor={SCENE_BG}
        nodeThreeObject={nodeThreeObject}
        nodeThreeObjectExtend={false}
        nodeLabel={(n: object) => {
          const node = n as BrainNode;
          const tipStyle =
            "background:rgba(8,10,18,0.92);border:1px solid #1e293b;color:#e2e8f0;padding:6px 10px;border-radius:6px;font-family:ui-monospace,monospace;font-size:11px;max-width:320px;backdrop-filter:blur(6px)";
          if (node.type === "call") {
            const oc = node.effective_outcome;
            return `<div style="${tipStyle}"><strong style="color:${OUTCOME_COLORS[oc]}">call · ${oc}</strong><br/>${node.setter_name ?? node.setter_id ?? "—"}${node.is_bridge ? " · bridge" : ""}</div>`;
          }
          const oc = node.effective_outcome;
          const winner = node.type === "solution" && node.is_top_winner ? " · top winner" : "";
          return `<div style="${tipStyle}"><strong style="color:${OUTCOME_COLORS[oc]}">${node.type} · ${oc}</strong>${winner}${node.is_canonical ? " · canonical" : ""}<br/>${node.cluster_id.replace(/_/g, " ")}</div>`;
        }}
        linkColor={linkColor}
        linkWidth={linkWidth}
        linkOpacity={1}
        linkDirectionalParticles={linkParticles}
        linkDirectionalParticleSpeed={0.006}
        linkDirectionalParticleWidth={2.0}
        linkDirectionalParticleColor={linkParticleColor}
        onNodeClick={handleNodeClick}
        onNodeHover={handleNodeHover}
        cooldownTicks={0}
        warmupTicks={0}
        enableNodeDrag={false}
      />
      {/* Vignette — radial darkening on container edges so the brain
          feels held in a luminous well rather than floating on a flat
          background. Pointer-events: none so it never blocks interaction. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at center, transparent 55%, rgba(0,0,0,0.55) 100%)",
        }}
      />
      {/* Edge legend — bottom-left fixed panel, auto-faded after 8s
          and returning on hover. Anchored inside the canvas frame. */}
      <BrainLegend />
    </div>
  );
}

function BrainLegend() {
  const [hovered, setHovered] = useState(false);
  const [expired, setExpired] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setExpired(true), 8000);
    return () => clearTimeout(t);
  }, []);
  const visible = !expired || hovered;
  return (
    <div
      className="absolute bottom-3 left-3 transition-opacity duration-700"
      style={{ opacity: visible ? 1 : 0.18 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className="rounded-md border px-3 py-2 text-[11px] font-mono leading-relaxed"
        style={{
          background: "rgba(8,10,18,0.78)",
          borderColor: "#1e293b",
          color: "#cbd5e1",
          backdropFilter: "blur(6px)",
          minWidth: 188,
        }}
      >
        <div className="flex items-center gap-2">
          <Dot color="#34D399" /> worked
        </div>
        <div className="flex items-center gap-2">
          <Dot color="#FBBF24" /> partial
        </div>
        <div className="flex items-center gap-2">
          <Dot color="#F87171" /> failed
        </div>
        <div className="flex items-center gap-2">
          <Dot color="#9CA3AF" /> unobserved
        </div>
        <div className="flex items-center gap-2 mt-1 pt-1 border-t border-[#1e293b]">
          <span className="inline-block h-3 w-3 rounded-full ring-2 ring-white/70" />{" "}
          bridge call
        </div>
      </div>
    </div>
  );
}

function Dot({ color }: { color: string }) {
  return (
    <span
      className="inline-block h-2.5 w-2.5 rounded-full"
      style={{ background: color, boxShadow: `0 0 8px ${color}99` }}
    />
  );
}

// Re-export for type inference at use sites.
export type { BrainNode, BrainEdge };
export { CLUSTER_DEFAULT_COLOR };
