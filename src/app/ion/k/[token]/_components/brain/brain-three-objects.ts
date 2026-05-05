// Per-node Three.js Object3D construction. Called by react-force-graph-3d's
// nodeThreeObject callback. Each node returns a Mesh whose material we tag
// (via userData.pulse) so the pulse loop can mutate emissiveIntensity +
// scale at 60Hz without an extra lookup pass.
//
// Visual encoding (ethereal palette, locked 2026-05-05):
//   • Calls — sphere R=4.5 base / R=7 bridge, MeshPhysicalMaterial colored
//     by call.effective_outcome bucket. Bridge calls add a thin white rim
//     (extra slightly-larger wireframe child) so they pop against non-
//     bridges at any rotation.
//   • Objection / Solution events — sphere R=2.5 base, R=3.0 top winner,
//     R=3.5 canonical. Cluster-blended outcome color, emissive core.
//   • Canonical — wireframe halo overlay + persistent ~1.2Hz size pulse
//     handled by the pulse loop (10% amplitude).
//   • Baseline 0.78 opacity for depth perception. transparent + depthWrite
//     false so far / near nodes blend cleanly through one another.

import * as THREE from "three";
import type { BrainNode } from "./brain-types";
import { paletteForOutcome } from "./brain-types";

const BRIDGE_RIM = "#ffffff";

// Baseline transparency for all spheres. Low-ish so outer nodes reveal
// inner ones — depth perception strengthens. Tuned so emissive glow
// still reads strongly.
const NODE_OPACITY = 0.78;

// Geometry caches — Three.js is happier sharing geometry across many
// instances of the same shape. ~1500 nodes × fresh geometry would chew
// memory; the cache keeps it cheap.
const geos = {
  callBase: new THREE.SphereGeometry(4.5, 16, 16),
  callBridge: new THREE.SphereGeometry(7, 24, 24),
  callBridgeRim: new THREE.SphereGeometry(7.4, 24, 24),
  eventBase: new THREE.SphereGeometry(2.5, 12, 12),
  eventTopWinner: new THREE.SphereGeometry(3.0, 14, 14),
  eventCanonical: new THREE.SphereGeometry(3.5, 14, 14),
  canonicalRing: new THREE.SphereGeometry(4.1, 16, 16),
};

const ringMat = new THREE.MeshBasicMaterial({
  color: "#ffffff",
  wireframe: true,
  transparent: true,
  opacity: 0.32,
  depthWrite: false,
});

const bridgeRimMat = new THREE.MeshBasicMaterial({
  color: BRIDGE_RIM,
  wireframe: true,
  transparent: true,
  opacity: 0.28,
  depthWrite: false,
});

export type PulsableMesh = THREE.Mesh & {
  userData: {
    pulse?: {
      brainNodeId: string;
      isCanonical: boolean;
      isBridge: boolean;
      isTopWinner: boolean;
      baseEmissive: number;
      baselineOpacity: number;
      baseScale: number;
      color: string;
    };
  };
};

function makeNodeMaterial(args: {
  shell: string;
  core: string;
  emissive: number;
}): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color: args.shell,
    emissive: args.core,
    emissiveIntensity: args.emissive,
    metalness: 0.0,
    roughness: 0.25,
    clearcoat: 0.6,
    clearcoatRoughness: 0.2,
    transparent: true,
    opacity: NODE_OPACITY,
    depthWrite: false,
  });
}

export function buildBrainNode(node: BrainNode): THREE.Object3D {
  if (node.type === "call") {
    const palette = paletteForOutcome(node.effective_outcome);
    const baseEmissive = node.is_bridge ? palette.emissive + 0.08 : palette.emissive;
    const mat = makeNodeMaterial({
      shell: palette.shell,
      core: palette.core,
      emissive: baseEmissive,
    });
    const geo = node.is_bridge ? geos.callBridge : geos.callBase;
    const mesh = new THREE.Mesh(geo, mat) as PulsableMesh;

    if (node.is_bridge) {
      // White wireframe rim — "this call cross-pollinates clusters"
      const rim = new THREE.Mesh(geos.callBridgeRim, bridgeRimMat);
      mesh.add(rim);
    }

    mesh.userData.pulse = {
      brainNodeId: node.id,
      isCanonical: false,
      isBridge: node.is_bridge,
      isTopWinner: false,
      baseEmissive,
      baselineOpacity: NODE_OPACITY,
      baseScale: 1.0,
      color: palette.core,
    };
    return mesh;
  }

  // Event nodes
  const palette = paletteForOutcome(node.effective_outcome);
  const isTopWinner = node.type === "solution" && node.is_top_winner;
  const baseEmissive = node.is_canonical
    ? palette.emissive + 0.1
    : isTopWinner
    ? palette.emissive + 0.05
    : palette.emissive * 0.6; // non-canonical events glow softer
  const mat = makeNodeMaterial({
    shell: palette.shell,
    core: palette.core,
    emissive: baseEmissive,
  });
  const geo = node.is_canonical
    ? geos.eventCanonical
    : isTopWinner
    ? geos.eventTopWinner
    : geos.eventBase;
  const mesh = new THREE.Mesh(geo, mat) as PulsableMesh;

  if (node.is_canonical) {
    const ring = new THREE.Mesh(geos.canonicalRing, ringMat);
    mesh.add(ring);
  }

  mesh.userData.pulse = {
    brainNodeId: node.id,
    isCanonical: node.is_canonical,
    isBridge: false,
    isTopWinner,
    baseEmissive,
    baselineOpacity: NODE_OPACITY,
    baseScale: 1.0,
    color: palette.core,
  };
  return mesh;
}

// Visit every PulsableMesh in the scene tree starting at root. Used by
// the pulse loop after rfg-3d rebuilds meshes on graphData updates.
export function walkPulsable(
  root: THREE.Object3D,
  visit: (m: PulsableMesh) => void
): void {
  root.traverse((obj) => {
    const m = obj as PulsableMesh;
    if (m.userData?.pulse) visit(m);
  });
}
