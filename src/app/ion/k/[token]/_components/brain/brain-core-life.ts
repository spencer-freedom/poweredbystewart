// Center "life source" composition — three subtle treatments that add
// readable focal weight at origin without raising overall brightness:
//
//   1. Halo plate — additive translucent sphere at origin (r=60), opacity
//      oscillates 0.10 → 0.14 at 0.6 Hz (slow heartbeat).
//   2. Radial drift particles — emit ~1 particle/sec from origin, drift
//      outward to r=100, fade with radius. Reads as energy radiating.
//
// Density at origin (where bridge calls cluster) plus these touches
// makes the center "feel like a heart" without cranking emissive.

import * as THREE from "three";

export type CoreLifeHandle = {
  dispose: () => void;
};

const HALO_RADIUS = 60;
const HALO_HZ = 0.6;
const HALO_OPACITY_MIN = 0.1;
const HALO_OPACITY_MAX = 0.14;

const PARTICLE_MAX = 60; // pool size; ~1/sec lifecycle keeps active count low
const PARTICLE_LIFETIME_MS = 8000;
const PARTICLE_FADE_RADIUS = 100;
const PARTICLE_SPEED_UNITS_PER_SEC = 14;

export function startCoreLife(scene: THREE.Scene): CoreLifeHandle {
  // Halo plate — additive blend so the existing background reads through.
  const haloMat = new THREE.MeshBasicMaterial({
    color: "#A5F3FC", // luminous cyan-white
    transparent: true,
    opacity: HALO_OPACITY_MIN,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.BackSide, // glow faces inward — feels volumetric
  });
  const halo = new THREE.Mesh(
    new THREE.SphereGeometry(HALO_RADIUS, 32, 32),
    haloMat
  );
  halo.name = "stewart-core-halo";
  scene.add(halo);

  // Radial particles — pool of `PARTICLE_MAX` slots, recycled as they
  // exit the fade radius. Each particle stores: position, velocity dir,
  // birth time. Bookkeeping via parallel arrays keeps the GC happy.
  const positions = new Float32Array(PARTICLE_MAX * 3);
  const opacities = new Float32Array(PARTICLE_MAX);
  const dirs = new Array<{ x: number; y: number; z: number }>(PARTICLE_MAX);
  const births = new Float64Array(PARTICLE_MAX);

  for (let i = 0; i < PARTICLE_MAX; i++) {
    positions[i * 3 + 0] = 0;
    positions[i * 3 + 1] = 0;
    positions[i * 3 + 2] = 0;
    opacities[i] = 0;
    dirs[i] = { x: 0, y: 0, z: 0 };
    births[i] = -Infinity; // not yet alive
  }

  const partGeo = new THREE.BufferGeometry();
  partGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const partMat = new THREE.PointsMaterial({
    color: "#A5F3FC",
    size: 1.4,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.32,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const particles = new THREE.Points(partGeo, partMat);
  particles.name = "stewart-core-emission";
  scene.add(particles);

  let frameId: number;
  let lastSpawn = performance.now();
  let cancelled = false;

  const spawnParticle = (now: number) => {
    // Find the oldest dead slot and respawn it from origin
    let oldestIdx = -1;
    let oldestBirth = Infinity;
    for (let i = 0; i < PARTICLE_MAX; i++) {
      if (now - births[i] > PARTICLE_LIFETIME_MS && births[i] < oldestBirth) {
        oldestBirth = births[i];
        oldestIdx = i;
      }
    }
    if (oldestIdx < 0) return; // pool full of live particles

    // Random outward direction on the unit sphere
    const phi = Math.acos(2 * Math.random() - 1);
    const theta = 2 * Math.PI * Math.random();
    dirs[oldestIdx].x = Math.sin(phi) * Math.cos(theta);
    dirs[oldestIdx].y = Math.sin(phi) * Math.sin(theta);
    dirs[oldestIdx].z = Math.cos(phi);
    positions[oldestIdx * 3 + 0] = 0;
    positions[oldestIdx * 3 + 1] = 0;
    positions[oldestIdx * 3 + 2] = 0;
    births[oldestIdx] = now;
  };

  const tick = () => {
    if (cancelled) return;
    if (typeof document !== "undefined" && document.hidden) {
      frameId = requestAnimationFrame(tick);
      return;
    }
    const now = performance.now();
    const elapsedSec = now / 1000;

    // Halo opacity oscillation — slow heartbeat
    const lift = (Math.sin(elapsedSec * Math.PI * 2 * HALO_HZ) + 1) / 2; // 0..1
    haloMat.opacity =
      HALO_OPACITY_MIN + (HALO_OPACITY_MAX - HALO_OPACITY_MIN) * lift;

    // Spawn ~1 particle/sec
    if (now - lastSpawn > 1000) {
      spawnParticle(now);
      lastSpawn = now;
    }

    // Advance live particles outward, fade with radius
    const dt = 1 / 60; // assume ~60fps; cosmetic loop not worth measured dt
    for (let i = 0; i < PARTICLE_MAX; i++) {
      const age = now - births[i];
      if (age < 0 || age > PARTICLE_LIFETIME_MS) continue;
      const d = dirs[i];
      positions[i * 3 + 0] += d.x * PARTICLE_SPEED_UNITS_PER_SEC * dt;
      positions[i * 3 + 1] += d.y * PARTICLE_SPEED_UNITS_PER_SEC * dt;
      positions[i * 3 + 2] += d.z * PARTICLE_SPEED_UNITS_PER_SEC * dt;
      const r = Math.hypot(
        positions[i * 3 + 0],
        positions[i * 3 + 1],
        positions[i * 3 + 2]
      );
      opacities[i] = Math.max(0, 1 - r / PARTICLE_FADE_RADIUS);
    }
    partGeo.attributes.position.needsUpdate = true;

    frameId = requestAnimationFrame(tick);
  };

  frameId = requestAnimationFrame(tick);

  return {
    dispose: () => {
      cancelled = true;
      if (frameId != null) cancelAnimationFrame(frameId);
      scene.remove(halo);
      scene.remove(particles);
      halo.geometry.dispose();
      haloMat.dispose();
      partGeo.dispose();
      partMat.dispose();
    },
  };
}
