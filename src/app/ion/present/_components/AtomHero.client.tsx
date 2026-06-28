"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Line, Environment, MeshTransmissionMaterial } from "@react-three/drei";
import * as THREE from "three";

// Self-contained hero atom. Decoupled from /ion/brain data on purpose —
// this is a decorative, always-moving visual base, not a data render.
// A pearl crystal core (round, frosted — matched to Stewart's brain core)
// with electron "ions" sweeping tilted orbital rings, the whole assembly
// drifting slowly. Node colors are pulled from the brain's vivid domain
// palette (BrainV2Scene VIVID_DOMAIN_COLORS) so the atom reads as the
// same material family as the brain.

// Brain ion palette — the vivid schema-domain colors that make up
// Stewart's brain. The electron nodes cycle through these.
const ION_COLORS = [
  "#5dd8e6", // context — light cyan
  "#4ca8e6", // intros — medium blue
  "#74e683", // call_shape — light green
  "#3dc18f", // verify — teal-green
  "#e6c478", // bill_collection — sand
  "#e69a4d", // rebuttals — orange
  "#e65c5c", // protocols — warm red
  "#b67ce6", // coaching_philosophy — light purple
  "#e67cd8", // outcomes — pink
];

type Electron = { phase: number; color: string };

type Orbit = {
  radius: number;
  // Euler tilt (radians) applied to the orbit plane.
  tilt: [number, number, number];
  speed: number;
  // Ring line tint.
  ringColor: string;
  electrons: Electron[];
};

const ORBITS: Orbit[] = [
  {
    radius: 2.0,
    tilt: [1.4, 0.2, 0.0],
    speed: 0.6,
    ringColor: "#4ca8e6",
    electrons: [
      { phase: 0, color: ION_COLORS[0] },
      { phase: Math.PI, color: ION_COLORS[2] },
    ],
  },
  {
    radius: 2.5,
    tilt: [0.3, 1.2, 0.5],
    speed: -0.45,
    ringColor: "#3dc18f",
    electrons: [
      { phase: 1.1, color: ION_COLORS[3] },
      { phase: 4.0, color: ION_COLORS[4] },
    ],
  },
  {
    radius: 3.0,
    tilt: [0.9, -0.6, 1.1],
    speed: 0.35,
    ringColor: "#b67ce6",
    electrons: [
      { phase: 0.4, color: ION_COLORS[5] },
      { phase: 2.6, color: ION_COLORS[7] },
      { phase: 4.7, color: ION_COLORS[8] },
    ],
  },
];

function ringPoints(radius: number): [number, number, number][] {
  const pts: [number, number, number][] = [];
  const segs = 96;
  for (let i = 0; i <= segs; i++) {
    const a = (i / segs) * Math.PI * 2;
    pts.push([Math.cos(a) * radius, Math.sin(a) * radius, 0]);
  }
  return pts;
}

function OrbitRing({ orbit }: { orbit: Orbit }) {
  const points = useMemo(() => ringPoints(orbit.radius), [orbit.radius]);
  const electronRefs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * orbit.speed;
    orbit.electrons.forEach((electron, i) => {
      const mesh = electronRefs.current[i];
      if (!mesh) return;
      const a = t + electron.phase;
      mesh.position.set(
        Math.cos(a) * orbit.radius,
        Math.sin(a) * orbit.radius,
        0,
      );
    });
  });

  return (
    <group rotation={orbit.tilt}>
      <Line
        points={points}
        color={orbit.ringColor}
        transparent
        opacity={0.25}
        lineWidth={1}
      />
      {orbit.electrons.map((electron, i) => (
        <mesh
          key={i}
          ref={(el) => {
            electronRefs.current[i] = el;
          }}
        >
          {/* Round, smooth nodes */}
          <sphereGeometry args={[0.12, 32, 32]} />
          <meshStandardMaterial
            color={electron.color}
            emissive={electron.color}
            emissiveIntensity={0.9}
            roughness={0.3}
            metalness={0.1}
          />
        </mesh>
      ))}
    </group>
  );
}

function Nucleus() {
  return (
    <group>
      {/* Pearl crystal core — round, frosted, matched to the brain core.
          MeshTransmissionMaterial + the scene Environment give it the same
          glassy refraction the brain's core has. */}
      <mesh>
        <sphereGeometry args={[0.6, 64, 64]} />
        <MeshTransmissionMaterial
          color="#ffffff"
          thickness={0.8}
          roughness={0.15}
          transmission={1}
          ior={1.4}
          chromaticAberration={0.04}
          backside
          backsideThickness={0.4}
        />
      </mesh>
      {/* Soft pearl halo */}
      <mesh>
        <sphereGeometry args={[0.82, 32, 32]} />
        <meshBasicMaterial color="#cbd5e1" transparent opacity={0.06} />
      </mesh>
    </group>
  );
}

function Atom() {
  const group = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (group.current) {
      group.current.rotation.y += delta * 0.12;
      group.current.rotation.x += delta * 0.04;
    }
  });

  return (
    <group ref={group}>
      <Nucleus />
      {ORBITS.map((orbit, i) => (
        <OrbitRing key={i} orbit={orbit} />
      ))}
    </group>
  );
}

function AtomCanvas() {
  return (
    <Canvas
      camera={{ position: [0, 0, 8.5], fov: 50 }}
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 2]}
    >
      {/* Lighting + IBL matched to the brain scene so the core's
          transmission material refracts like real glass. */}
      <ambientLight intensity={0.45} />
      <pointLight position={[0, 0, 0]} intensity={1.8} color="#ffffff" />
      <directionalLight position={[6, 7, 8]} intensity={0.45} />
      <directionalLight position={[-7, -3, -6]} intensity={0.22} />
      <Environment preset="studio" background={false} />
      <Atom />
    </Canvas>
  );
}

export function AtomHero() {
  // The atom is the clean, full-screen hero visual — always moving, no
  // overlay. "About Spencer" lives in its own section below (scroll to
  // it); see AboutSpencer.client.tsx.
  return (
    <section className="relative h-[100svh] min-h-[600px] w-full overflow-hidden bg-black">
      <div className="absolute inset-0 z-0">
        <AtomCanvas />
      </div>

      {/* Subtle vignette to settle the atom against the black. */}
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(0,0,0,0.0) 35%, rgba(0,0,0,0.6) 100%)",
        }}
      />

      {/* Persistent scroll cue. */}
      <div className="absolute bottom-8 inset-x-0 z-20 flex justify-center pointer-events-none">
        <span className="text-xs uppercase tracking-[0.2em] text-stewart-muted animate-pulse">
          Scroll
        </span>
      </div>
    </section>
  );
}
