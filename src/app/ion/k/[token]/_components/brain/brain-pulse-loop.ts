// Animation loop that mutates emissiveIntensity + scale on PulsableMesh
// materials to produce the pulse signal. Stacked pulse states:
//
//   1. Canonical events — persistent ~1.2 Hz size pulse (10% amplitude)
//      + emissive lift; signals "Stewart's stable knowledge."
//   2. Top-winner solutions — gentler emissive breathing.
//   3. Bridge calls — slow gold breathing.
//   4. Click signal-fire — clicked node + 1-hop neighbors flare for 3s.
//   5. Hover signal — hovered node + 1-hop neighbors briefly pulse 800ms.
//   6. Search highlight — matched nodes glow brighter; non-matched fade.
//
// Pause rules:
//   • document.hidden (Page Visibility API) → skip ticks entirely
//   • signal entries auto-expire by timestamp
//
// The loop is shape-stable: walks the scene each frame and only touches
// meshes whose userData.pulse is present. New meshes from graphData
// changes are picked up automatically without re-registration.

import type * as THREE from "three";
import type { PulsableMesh } from "./brain-three-objects";

const CANONICAL_HZ = 1.2;
const BRIDGE_HZ = 0.4;
const SIGNAL_HZ = 1.6;

export type PulseLoopHandle = {
  stop: () => void;
  fireSignal: (nodeIds: string[], durationMs?: number) => void;
  fireHover: (nodeIds: string[], durationMs?: number) => void;
  setSearchHighlight: (ids: ReadonlySet<string>) => void;
};

type SignalEntry = {
  ids: Set<string>;
  expiresAt: number;
};

type PulsableMaterial = THREE.MeshPhysicalMaterial | THREE.MeshStandardMaterial;

export function startPulseLoop(getRoot: () => THREE.Object3D | null): PulseLoopHandle {
  let frameId: number | null = null;
  let stopped = false;
  const startedAt = performance.now();
  let click: SignalEntry | null = null;
  let hover: SignalEntry | null = null;
  let searchHighlight: ReadonlySet<string> = new Set();

  const tick = () => {
    if (stopped) return;
    if (typeof document !== "undefined" && document.hidden) {
      frameId = requestAnimationFrame(tick);
      return;
    }

    const root = getRoot();
    if (!root) {
      frameId = requestAnimationFrame(tick);
      return;
    }

    const now = performance.now();
    const elapsed = (now - startedAt) / 1000;

    // Pre-compute oscillators once per frame
    const canonicalLift = 0.5 + Math.sin(elapsed * Math.PI * 2 * CANONICAL_HZ) * 0.5; // 0..1
    const bridgeLift = 0.5 + Math.sin(elapsed * Math.PI * 2 * BRIDGE_HZ) * 0.5; // 0..1
    const signalLift = 0.5 + Math.sin(elapsed * Math.PI * 2 * SIGNAL_HZ) * 0.5; // 0..1

    // Auto-expire signal-fires
    if (click && now > click.expiresAt) click = null;
    if (hover && now > hover.expiresAt) hover = null;

    root.traverse((obj) => {
      const m = obj as PulsableMesh;
      const meta = m.userData?.pulse;
      if (!meta) return;
      const mat = m.material as PulsableMaterial;
      if (!mat || !("emissiveIntensity" in mat)) return;

      let intensity = meta.baseEmissive;
      let scale = meta.baseScale;

      if (meta.isCanonical) {
        // Persistent breathing — 10% size oscillation + emissive lift
        intensity = meta.baseEmissive + canonicalLift * 0.4;
        scale = meta.baseScale * (1 + canonicalLift * 0.10);
      } else if (meta.isBridge) {
        intensity = meta.baseEmissive * 0.8 + bridgeLift * 0.25;
      } else if (meta.isTopWinner) {
        // Gentler than canonical
        intensity = meta.baseEmissive + canonicalLift * 0.18;
      }

      // Click signal-fire
      if (click && click.ids.has(meta.brainNodeId)) {
        intensity = Math.max(intensity, 0.6 + signalLift * 0.4);
        scale = Math.max(scale, meta.baseScale * (1 + signalLift * 0.18));
      }

      // Hover signal — gentler / faster than click
      if (hover && hover.ids.has(meta.brainNodeId)) {
        intensity = Math.max(intensity, 0.55 + signalLift * 0.30);
        scale = Math.max(scale, meta.baseScale * (1 + signalLift * 0.15));
      }

      // Search highlight — matched lift, non-matched fade
      let opacity = meta.baselineOpacity;
      if (searchHighlight.size > 0) {
        if (searchHighlight.has(meta.brainNodeId)) {
          intensity = Math.max(intensity, 0.65 + canonicalLift * 0.25);
          opacity = meta.baselineOpacity;
        } else {
          opacity = 0.18;
        }
      }

      mat.emissiveIntensity = intensity;
      mat.opacity = opacity;
      m.scale.setScalar(scale);
    });

    frameId = requestAnimationFrame(tick);
  };

  frameId = requestAnimationFrame(tick);

  return {
    stop: () => {
      stopped = true;
      if (frameId != null) cancelAnimationFrame(frameId);
    },
    fireSignal: (nodeIds, durationMs = 3000) => {
      click = { ids: new Set(nodeIds), expiresAt: performance.now() + durationMs };
    },
    fireHover: (nodeIds, durationMs = 800) => {
      hover = { ids: new Set(nodeIds), expiresAt: performance.now() + durationMs };
    },
    setSearchHighlight: (ids) => {
      searchHighlight = ids;
    },
  };
}
