// Animation loop that mutates emissiveIntensity on PulsableMesh materials
// to produce the pulse signal. Three pulse states stack:
//
//   1. Canonical events pulse gently and continuously (baseEmissive=0.5)
//   2. Click → 1-hop neighbors signal-fire for 3s (intensity boost on top)
//   3. Search-matched nodes pulse brighter while the highlight is active
//
// Pause rules:
//   • document.hidden (Page Visibility API) → skip ticks entirely
//   • signalFire entries auto-expire by timestamp
//
// The loop is shape-stable: we walk the scene each frame and only touch
// meshes whose userData.pulse is present. New meshes from rfg-3d's data
// changes are picked up automatically without re-registration.

import type * as THREE from "three";
import type { PulsableMesh } from "./brain-three-objects";

const PULSE_HZ = 0.4; // 0.4 cycles/sec → ~2.5s per oscillation, museum pace

export type PulseLoopHandle = {
  stop: () => void;
  fireSignal: (nodeIds: string[], durationMs?: number) => void;
  setSearchHighlight: (ids: ReadonlySet<string>) => void;
};

type SignalEntry = {
  ids: Set<string>;
  expiresAt: number;
};

type PulsableMaterial = THREE.MeshStandardMaterial;

export function startPulseLoop(getRoot: () => THREE.Object3D | null): PulseLoopHandle {
  let frameId: number | null = null;
  let stopped = false;
  const startedAt = performance.now();
  let signal: SignalEntry | null = null;
  let searchHighlight: ReadonlySet<string> = new Set();

  const tick = () => {
    if (stopped) return;
    if (typeof document !== "undefined" && document.hidden) {
      // Tab hidden — skip work but stay scheduled; we want to resume when visible
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
    const phase = Math.sin(elapsed * Math.PI * 2 * PULSE_HZ); // -1..1
    const lift = 0.5 + phase * 0.5; // 0..1

    // Expire signal-fire automatically
    if (signal && now > signal.expiresAt) signal = null;

    root.traverse((obj) => {
      const m = obj as PulsableMesh;
      const meta = m.userData?.pulse;
      if (!meta) return;
      const mat = m.material as PulsableMaterial;
      if (!mat || !("emissiveIntensity" in mat)) return;

      let intensity = meta.baseEmissive;

      if (meta.isCanonical) {
        // 0.35 .. 0.75 oscillation around baseEmissive=0.5
        intensity = 0.35 + lift * 0.4;
      } else if (meta.isBridge) {
        // Subtle gold breathing 0.30 .. 0.55
        intensity = 0.3 + lift * 0.25;
      }

      // Click signal-fire — boost matching nodes
      if (signal && signal.ids.has(meta.brainNodeId)) {
        intensity = Math.max(intensity, 0.6 + lift * 0.4); // 0.6 .. 1.0
      }

      // Search highlight — matched nodes lift back to full baseline,
      // non-matched fade to ~0.18. With a clear search the baseline
      // transparency (set at mesh construction) carries depth perception.
      mat.emissiveIntensity = intensity;
      if (searchHighlight.size > 0) {
        mat.opacity = searchHighlight.has(meta.brainNodeId)
          ? meta.baselineOpacity
          : 0.18;
      } else {
        mat.opacity = meta.baselineOpacity;
      }
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
      signal = {
        ids: new Set(nodeIds),
        expiresAt: performance.now() + durationMs,
      };
    },
    setSearchHighlight: (ids) => {
      searchHighlight = ids;
    },
  };
}
