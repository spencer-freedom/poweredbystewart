// Per-node Three.js Object3D construction. Called by react-force-graph-3d's
// nodeThreeObject callback. Each node returns a Mesh whose material we tag
// (via userData.pulse) so the pulse loop can mutate emissiveIntensity at
// 60Hz without another lookup pass.
//
// Geometry choices (locked in stewart-v2-brain-3d-frontend-port.md):
//   • Bridge call → R=7 gold-emissive sphere ("standout / valuable")
//   • Standard call → R=4 muted gray sphere
//   • Objection event → R=2.5 cluster-colored sphere
//   • Solution event → R=3 cluster-colored sphere
//   • Canonical event → emissive=0.5 + white wireframe halo

import * as THREE from "three";
import type { BrainNode } from "./brain-types";
import { colorForCluster } from "./brain-types";

const BRIDGE_GOLD = "#facc15";
const CALL_GRAY = "#475569";

// Geometry + material caches — Three.js performs better when we share
// geometry across instances of the same shape. ~1500 nodes × fresh
// geometry would chew memory; sharing keeps it cheap.
let bridgeGeo: THREE.SphereGeometry | null = null;
let callGeo: THREE.SphereGeometry | null = null;
let objectionGeo: THREE.SphereGeometry | null = null;
let solutionGeo: THREE.SphereGeometry | null = null;
let canonicalRingGeoObj: THREE.SphereGeometry | null = null;
let canonicalRingGeoSol: THREE.SphereGeometry | null = null;

function getBridgeGeo() {
  if (!bridgeGeo) bridgeGeo = new THREE.SphereGeometry(7, 20, 20);
  return bridgeGeo;
}
function getCallGeo() {
  if (!callGeo) callGeo = new THREE.SphereGeometry(4, 16, 16);
  return callGeo;
}
function getObjectionGeo() {
  if (!objectionGeo) objectionGeo = new THREE.SphereGeometry(2.5, 12, 12);
  return objectionGeo;
}
function getSolutionGeo() {
  if (!solutionGeo) solutionGeo = new THREE.SphereGeometry(3, 12, 12);
  return solutionGeo;
}
function getCanonicalRingGeo(forSolution: boolean) {
  if (forSolution) {
    if (!canonicalRingGeoSol)
      canonicalRingGeoSol = new THREE.SphereGeometry(3.7, 14, 14);
    return canonicalRingGeoSol;
  }
  if (!canonicalRingGeoObj)
    canonicalRingGeoObj = new THREE.SphereGeometry(3.2, 14, 14);
  return canonicalRingGeoObj;
}

const ringMat = new THREE.MeshBasicMaterial({
  color: "#ffffff",
  wireframe: true,
  transparent: true,
  opacity: 0.3,
});

export type PulsableMesh = THREE.Mesh & {
  userData: {
    pulse?: {
      brainNodeId: string;
      isCanonical: boolean;
      isBridge: boolean;
      baseEmissive: number;
      color: string;
    };
  };
};

export function buildBrainNode(node: BrainNode): THREE.Object3D {
  if (node.type === "call") {
    if (node.is_bridge) {
      const mat = new THREE.MeshStandardMaterial({
        color: BRIDGE_GOLD,
        emissive: BRIDGE_GOLD,
        emissiveIntensity: 0.4,
        metalness: 0.5,
        roughness: 0.35,
      });
      const mesh = new THREE.Mesh(getBridgeGeo(), mat) as PulsableMesh;
      mesh.userData.pulse = {
        brainNodeId: node.id,
        isCanonical: false,
        isBridge: true,
        baseEmissive: 0.4,
        color: BRIDGE_GOLD,
      };
      return mesh;
    }
    const mat = new THREE.MeshStandardMaterial({
      color: CALL_GRAY,
      emissive: "#000000",
      emissiveIntensity: 0,
      metalness: 0.2,
      roughness: 0.6,
    });
    const mesh = new THREE.Mesh(getCallGeo(), mat) as PulsableMesh;
    mesh.userData.pulse = {
      brainNodeId: node.id,
      isCanonical: false,
      isBridge: false,
      baseEmissive: 0,
      color: CALL_GRAY,
    };
    return mesh;
  }

  // Event nodes
  const color = colorForCluster(node.cluster_id);
  const isObjection = node.type === "objection";
  const baseEmissive = node.is_canonical ? 0.5 : 0.05;
  const mat = new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: baseEmissive,
    metalness: 0.1,
    roughness: 0.7,
  });
  const geo = isObjection ? getObjectionGeo() : getSolutionGeo();
  const mesh = new THREE.Mesh(geo, mat) as PulsableMesh;
  mesh.userData.pulse = {
    brainNodeId: node.id,
    isCanonical: node.is_canonical,
    isBridge: false,
    baseEmissive,
    color,
  };

  if (node.is_canonical) {
    const ringGeo = getCanonicalRingGeo(!isObjection);
    const ring = new THREE.Mesh(ringGeo, ringMat);
    mesh.add(ring);
  }

  return mesh;
}

// Visit every PulsableMesh in the scene tree starting at root. We register
// each scene node we build with the pulse loop, but rfg-3d may swap meshes
// when graphData updates — `walk` rediscovers them after data changes.
export function walkPulsable(
  root: THREE.Object3D,
  visit: (m: PulsableMesh) => void
): void {
  root.traverse((obj) => {
    const m = obj as PulsableMesh;
    if (m.userData?.pulse) visit(m);
  });
}
