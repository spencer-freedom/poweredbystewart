"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import * as THREE from "three";
import {
  type BrainV1Node,
  type BrainV1Payload,
  type CoreNode,
  type GraySatellite,
  type SoftSatellite,
  outcomeColor,
} from "./types";

// react-force-graph-3d is WebGL — must load client-only to dodge SSR
// document/window errors.
const ForceGraph3D = dynamic(() => import("react-force-graph-3d"), {
  ssr: false,
});

// Visual tuning. Subtle bloom, generous fog falloff, deep void
// background. Per the brief: wow-factor levers are composition,
// motion, depth, chromatic richness — NOT brightness.
const SCENE_BG = "#020617";
const AUTO_ROTATE_SPEED = 0.18; // museum-case slow
const TIER_TINT: Record<number, string> = {
  0: "#60a5fa", // soft blue — call opening
  1: "#a78bfa", // violet — qualification
  2: "#22d3ee", // cyan — call shape / protocols
  3: "#f59e0b", // amber — coaching / rebuttals
  4: "#f472b6", // pink — cross-sell / outcomes / analysis
};

const GRAY_COLOR = "#fbbf24"; // gold

type FGNode = BrainV1Node & {
  fx?: number;
  fy?: number;
  fz?: number;
};

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
  };
  scene: () => THREE.Scene;
};

function coreRadius(callCount: number): number {
  // The biggest sun in this corpus has ~16 calls referencing it; smallest 1.
  return Math.min(20, 6 + Math.sqrt(callCount) * 2.5);
}

function buildNodeObject(node: BrainV1Node): THREE.Object3D {
  if (node.kind === "core") {
    return buildCoreObject(node);
  }
  if (node.kind === "gray") {
    return buildGrayObject(node);
  }
  return buildSoftObject(node);
}

function buildCoreObject(core: CoreNode): THREE.Object3D {
  const group = new THREE.Group();
  const r = coreRadius(core.call_count);
  const color = new THREE.Color(TIER_TINT[core.tier] || "#94a3b8");

  // Inner sphere — emissive lit-from-within
  const inner = new THREE.Mesh(
    new THREE.SphereGeometry(r, 32, 32),
    new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.55,
      roughness: 0.55,
      metalness: 0.0,
    })
  );
  group.add(inner);

  // Soft outer halo via additive sphere
  const halo = new THREE.Mesh(
    new THREE.SphereGeometry(r * 1.45, 24, 24),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.07,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  group.add(halo);

  return group;
}

function buildGrayObject(_g: GraySatellite): THREE.Object3D {
  const color = new THREE.Color(GRAY_COLOR);
  const group = new THREE.Group();

  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(3.2, 24, 24),
    new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.8,
      roughness: 0.35,
      metalness: 0.2,
    })
  );
  group.add(sphere);

  const halo = new THREE.Mesh(
    new THREE.SphereGeometry(6.5, 20, 20),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.15,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  group.add(halo);

  return group;
}

function buildSoftObject(soft: SoftSatellite): THREE.Object3D {
  const color = new THREE.Color(outcomeColor(soft.outcome));
  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(1.5, 16, 16),
    new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.4,
      roughness: 0.6,
    })
  );
  return sphere;
}

type HoverInfo =
  | { kind: "core"; node: CoreNode; x: number; y: number }
  | { kind: "gray"; node: GraySatellite; x: number; y: number }
  | { kind: "soft"; node: SoftSatellite; x: number; y: number };

export function BrainRendererV1({ payload }: { payload: BrainV1Payload }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const fgRef = useRef<ForceGraph3DInstance | null>(null);
  const [size, setSize] = useState({ width: 800, height: 700 });
  const [hover, setHover] = useState<HoverInfo | null>(null);
  const [pinned, setPinned] = useState<HoverInfo | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () =>
      setSize({ width: el.clientWidth, height: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const graphData = useMemo(() => {
    const all: FGNode[] = [
      ...payload.cores.map((c) => ({ ...c, fx: c.x, fy: c.y, fz: c.z })),
      ...payload.grays.map((g) => ({ ...g, fx: g.x, fy: g.y, fz: g.z })),
      ...payload.softs.map((s) => ({ ...s, fx: s.x, fy: s.y, fz: s.z })),
    ];
    return { nodes: all, links: [] };
  }, [payload]);

  const nodeThreeObject = useCallback(
    (raw: object): THREE.Object3D => buildNodeObject(raw as BrainV1Node),
    []
  );

  const handleHover = useCallback((raw: object | null) => {
    if (!raw) {
      setHover(null);
      return;
    }
    const node = raw as BrainV1Node & { x?: number; y?: number };
    // r3f returns scene coords; we'll position the tooltip via fixed
    // offset from the canvas container instead. Use container-relative
    // pointer coords via a ref tracker on the wrapper. For V1 we keep
    // the tooltip docked top-right rather than chasing the cursor.
    if (node.kind === "core") {
      setHover({ kind: "core", node, x: 0, y: 0 });
    } else if (node.kind === "gray") {
      setHover({ kind: "gray", node, x: 0, y: 0 });
    } else {
      setHover({ kind: "soft", node, x: 0, y: 0 });
    }
  }, []);

  const handleClick = useCallback((raw: object) => {
    const node = raw as BrainV1Node;
    if (node.kind === "core") {
      setPinned({ kind: "core", node, x: 0, y: 0 });
    } else if (node.kind === "gray") {
      setPinned({ kind: "gray", node, x: 0, y: 0 });
    } else {
      setPinned({ kind: "soft", node, x: 0, y: 0 });
    }
  }, []);

  const onEngineReady = useCallback(() => {
    const fg = fgRef.current;
    if (!fg) return;
    // Establishing cinematic shot — pulled back, slight elevation, looking
    // through the brain's vertical structure.
    fg.cameraPosition({ x: 220, y: 90, z: 260 }, { x: 0, y: 0, z: 0 }, 1800);
    const c = fg.controls();
    c.autoRotate = true;
    c.autoRotateSpeed = AUTO_ROTATE_SPEED;
    // Subtle ambient glow + fog handled by react-force-graph-3d defaults;
    // we only tweak the scene background.
    const scene = fg.scene();
    scene.background = new THREE.Color(SCENE_BG);
    scene.fog = new THREE.Fog(SCENE_BG, 300, 800);
  }, []);

  const activeDetail = pinned ?? hover;

  return (
    <div className="relative">
      <BrainStatStrip stats={payload.stats} />

      <div
        ref={containerRef}
        className="relative w-full rounded-lg overflow-hidden border border-stewart-border bg-[#020617]"
        style={{ height: "70vh", minHeight: 480 }}
      >
        {/* Responsive notice — the brain isn't worth fighting on a 375px
            viewport. Show a friendly message instead. */}
        <div className="absolute inset-0 sm:hidden flex items-center justify-center p-6 text-center text-stewart-muted text-sm bg-stewart-bg/95 z-10">
          Stewart&apos;s brain is best viewed on desktop. Open this page on
          a larger screen to explore the 101-section structure interactively.
        </div>

        {/*
          eslint-disable-next-line @typescript-eslint/no-explicit-any
          ForceGraph3D's published ref typing collides with the dynamic()
          lazy import shape — cast through any so the typecheck stays
          clean. Runtime API is verified via the ForceGraph3DInstance
          interface above.
        */}
        <ForceGraph3D
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ref={fgRef as any}
          graphData={graphData}
          width={size.width}
          height={size.height}
          backgroundColor={SCENE_BG}
          showNavInfo={false}
          enableNodeDrag={false}
          nodeThreeObject={nodeThreeObject}
          nodeThreeObjectExtend={false}
          onNodeHover={handleHover}
          onNodeClick={handleClick}
          cooldownTicks={0}
          warmupTicks={0}
          d3VelocityDecay={1}
          onEngineStop={onEngineReady}
        />

        {activeDetail ? (
          <DetailCard
            info={activeDetail}
            pinned={Boolean(pinned)}
            onClose={() => setPinned(null)}
          />
        ) : null}

        <Legend />
      </div>
    </div>
  );
}

function BrainStatStrip({ stats }: { stats: BrainV1Payload["stats"] }) {
  return (
    <div className="mb-4 flex flex-wrap items-baseline gap-x-6 gap-y-1 text-sm">
      <span className="text-stewart-text font-semibold text-base">
        Stewart&apos;s brain &mdash;{" "}
        <span className="text-stewart-accent">Ion Solar</span>
      </span>
      <span className="text-stewart-muted">
        <span className="text-stewart-text font-mono">
          {stats.total_calls}
        </span>{" "}
        calls processed
      </span>
      <span className="text-stewart-muted">
        <span className="text-stewart-text font-mono">
          {stats.total_sections}
        </span>{" "}
        codex sections lit
      </span>
      <span className="text-stewart-muted">
        <span className="text-stewart-text font-mono">
          {stats.total_cherry_picks}
        </span>{" "}
        cherry-pick moments
      </span>
      <span className="text-stewart-muted">
        <span className="text-stewart-text font-mono">
          {stats.gray_matter_count}
        </span>{" "}
        gray-matter exemplars
      </span>
    </div>
  );
}

function Legend() {
  return (
    <div className="absolute bottom-3 left-3 right-3 sm:left-3 sm:right-auto flex flex-wrap gap-3 text-[10px] font-mono pointer-events-none">
      <LegendItem swatch="#fbbf24" label="Gray matter (Kenny exemplar)" />
      <LegendItem swatch="#22c55e" label="Booked" />
      <LegendItem swatch="#ef4444" label="No interest / declined" />
      <LegendItem swatch="#3b82f6" label="Callback" />
      <LegendItem swatch="#94a3b8" label="Unknown" />
    </div>
  );
}

function LegendItem({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 bg-stewart-bg/80 backdrop-blur-sm border border-stewart-border/60 rounded px-2 py-1 text-stewart-muted">
      <span
        className="w-2 h-2 rounded-full"
        style={{ background: swatch }}
      />
      {label}
    </span>
  );
}

function DetailCard({
  info,
  pinned,
  onClose,
}: {
  info: HoverInfo;
  pinned: boolean;
  onClose: () => void;
}) {
  return (
    <div className="pointer-events-auto absolute top-3 right-3 max-w-sm w-full bg-stewart-card/95 backdrop-blur-md border border-stewart-border rounded-lg shadow-xl p-5 z-20">
      <div className="flex items-baseline justify-between gap-3 mb-3">
        <span
          className={
            "text-[10px] uppercase tracking-wider font-mono px-2 py-0.5 rounded border " +
            (info.kind === "core"
              ? "border-stewart-accent/40 text-stewart-accent"
              : info.kind === "gray"
              ? "border-amber-400/60 text-amber-400"
              : "border-stewart-muted/60 text-stewart-muted")
          }
        >
          {info.kind === "core"
            ? "Core · codex section"
            : info.kind === "gray"
            ? "Gray matter · exemplar"
            : "Soft · cherry-pick"}
        </span>
        {pinned ? (
          <button
            onClick={onClose}
            className="text-xs text-stewart-muted hover:text-stewart-text"
          >
            close ✕
          </button>
        ) : null}
      </div>

      {info.kind === "core" ? <CoreDetail node={info.node} /> : null}
      {info.kind === "gray" ? <GrayDetail node={info.node} /> : null}
      {info.kind === "soft" ? <SoftDetail node={info.node} /> : null}
    </div>
  );
}

function CoreDetail({ node }: { node: CoreNode }) {
  const classifEntries = Object.entries(node.classifications).sort(
    ([, a], [, b]) => b - a
  );
  const outcomeEntries = Object.entries(node.outcomes).sort(
    ([, a], [, b]) => b - a
  );
  return (
    <div className="space-y-3">
      <code className="block text-sm text-stewart-text font-mono break-all">
        {node.codex_section}
      </code>
      <p className="text-xs text-stewart-muted">
        Tier:{" "}
        <span className="text-stewart-text">{node.tier_label}</span> &middot;{" "}
        <span className="text-stewart-text font-mono">{node.call_count}</span>{" "}
        calls reference this section
      </p>

      {classifEntries.length > 0 ? (
        <div>
          <p className="text-[10px] uppercase tracking-wider text-stewart-muted mb-1">
            Pattern counts
          </p>
          <ul className="space-y-1 text-xs">
            {classifEntries.slice(0, 6).map(([k, n]) => (
              <li
                key={k}
                className="flex items-center justify-between gap-2"
              >
                <span className="text-stewart-text">
                  {k.replace(/_/g, " ")}
                </span>
                <span className="text-stewart-muted font-mono">{n}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {outcomeEntries.length > 0 ? (
        <div>
          <p className="text-[10px] uppercase tracking-wider text-stewart-muted mb-1">
            Parent-call outcomes
          </p>
          <div className="flex flex-wrap gap-1">
            {outcomeEntries.map(([k, n]) => (
              <span
                key={k}
                className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-stewart-border bg-stewart-bg/50 text-stewart-muted"
              >
                {k.replace(/_/g, " ")}:
                <span className="text-stewart-text ml-1">{n}</span>
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function GrayDetail({ node }: { node: GraySatellite }) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-stewart-text">
        <span className="text-amber-400 font-semibold">
          What good looks like
        </span>{" "}
        for{" "}
        <code className="text-xs font-mono text-stewart-accent">
          {node.parent_codex_section}
        </code>
      </p>
      <p className="text-xs text-stewart-muted">
        Call:{" "}
        <code className="text-stewart-text font-mono">{node.call_id}</code>
        {node.rep_id ? (
          <>
            {" "}
            &middot; Rep:{" "}
            <span className="text-stewart-text">{node.rep_id}</span>
          </>
        ) : null}
        {node.ts ? (
          <>
            {" "}
            &middot; {node.ts}
          </>
        ) : null}
      </p>
      {node.why ? (
        <p className="text-sm text-stewart-text leading-relaxed italic">
          &ldquo;{node.why}&rdquo;
        </p>
      ) : null}
    </div>
  );
}

function SoftDetail({ node }: { node: SoftSatellite }) {
  return (
    <div className="space-y-3">
      <code className="block text-xs font-mono text-stewart-accent">
        {node.parent_codex_section}
      </code>
      <p className="text-xs text-stewart-muted">
        Call{" "}
        <span className="text-stewart-text font-mono">{node.call_id}</span>{" "}
        &middot;{" "}
        <span className="font-mono text-stewart-text">{node.ts}</span>{" "}
        &middot;{" "}
        <span className="text-stewart-text">
          {node.classification.replace(/_/g, " ")}
        </span>
      </p>
      <blockquote className="text-sm text-stewart-text italic leading-relaxed border-l-2 border-stewart-accent/50 pl-3">
        &ldquo;{node.quote.length > 220 ? node.quote.slice(0, 220) + "…" : node.quote}
        &rdquo;
      </blockquote>
      <p className="text-[10px] uppercase tracking-wider text-stewart-muted">
        Parent call outcome:{" "}
        <span
          className="font-mono"
          style={{ color: outcomeColor(node.outcome) }}
        >
          {node.outcome}
        </span>
      </p>
    </div>
  );
}
