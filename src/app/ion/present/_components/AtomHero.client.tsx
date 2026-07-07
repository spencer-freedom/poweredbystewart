"use client";

import { useEffect, useMemo, useRef } from "react";
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

// Ion green palette — the nodes and orbital vectors are all green to
// match Ion Solar's own logo. A range of greens keeps the ions distinct.
const ION_COLORS = [
  "#74e683", // light green
  "#4ade80", // green
  "#34d399", // emerald
  "#86efac", // pale green
  "#22c55e", // ion green
  "#5fe6a0", // spring green
  "#10b981", // deep emerald
  "#a7f3d0", // mint
  "#3dc18f", // teal-green
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

// All rings share the same radius and pass through a common pair of poles
// (the Y axis) — like lines of longitude — evenly spaced by rotating each
// ring around that polar axis in even increments (180°/N apart). The whole
// atom group tumbles over time (see Atom), so the poles aren't fixed.
const ORBIT_RADIUS = 2.7;
const T = Math.PI / 4; // 45° even spacing for the four longitude rings

// Every ion moves at the SAME speed so the spacing between them stays
// constant — they never bunch up or all crest the pole together. The nine
// longitude ions are seeded at evenly-spaced phases (2π/9 apart),
// interleaved across the four rings so consecutive phases land on
// different rings.
const SPEED = 0.4;
const P = (2 * Math.PI) / 9; // even phase step for the longitude ions

const ORBITS: Orbit[] = [
  {
    radius: ORBIT_RADIUS,
    tilt: [0, 0, 0],
    speed: SPEED,
    ringColor: "#4ade80",
    electrons: [
      { phase: 0 * P, color: ION_COLORS[0] },
      { phase: 4 * P, color: ION_COLORS[2] },
    ],
  },
  {
    radius: ORBIT_RADIUS,
    tilt: [0, T, 0],
    speed: SPEED,
    ringColor: "#34d399",
    electrons: [
      { phase: 1 * P, color: ION_COLORS[3] },
      { phase: 5 * P, color: ION_COLORS[4] },
    ],
  },
  {
    radius: ORBIT_RADIUS,
    tilt: [0, 2 * T, 0],
    speed: SPEED,
    ringColor: "#74e683",
    electrons: [
      { phase: 2 * P, color: ION_COLORS[5] },
      { phase: 6 * P, color: ION_COLORS[7] },
      { phase: 8 * P, color: ION_COLORS[8] },
    ],
  },
  {
    radius: ORBIT_RADIUS,
    tilt: [0, 3 * T, 0],
    speed: SPEED,
    ringColor: "#5fe6a0",
    electrons: [
      { phase: 3 * P, color: ION_COLORS[1] },
      { phase: 7 * P, color: ION_COLORS[6] },
    ],
  },
  {
    // Equatorial ring — rotated onto the XZ plane so it's perpendicular to
    // the four pole-sharing longitude rings. Its two ions sit opposite each
    // other and don't pass the poles.
    radius: ORBIT_RADIUS,
    tilt: [Math.PI / 2, 0, 0],
    speed: SPEED,
    ringColor: "#22c55e",
    electrons: [
      { phase: Math.PI / 6, color: ION_COLORS[4] },
      { phase: Math.PI / 6 + Math.PI, color: ION_COLORS[8] },
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
  // drei's <Line> uses LineMaterial, whose ShaderMaterial.fog defaults to
  // false — so enable it here so the scene fog fades the back of each ring.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lineRef = useRef<any>(null);

  useEffect(() => {
    const mat = lineRef.current?.material as
      | { fog: boolean; needsUpdate: boolean }
      | undefined;
    if (mat) {
      mat.fog = true;
      mat.needsUpdate = true;
    }
  }, []);

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
        ref={lineRef}
        points={points}
        color={orbit.ringColor}
        transparent
        opacity={0.44}
        lineWidth={1.4}
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

// Opal / mother-of-pearl color stops — pale, warm tones matched to the
// marbled bands of Stewart's brain core. The inner core sphere is
// vertex-colored from these so it reads as a colored crystal, not flat
// white, then a frosted transmission shell refracts over it.
const OPAL_STOPS = [
  "#f0e0b0", // warm cream
  "#f0b4d2", // pink
  "#e6c884", // gold sand
  "#c4b6ef", // lavender
  "#aeebd2", // mint
  "#f5c4a2", // peach
];

function makeOpalGeometry(radius: number): THREE.SphereGeometry {
  const geo = new THREE.SphereGeometry(radius, 96, 96);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const stops = OPAL_STOPS.map((c) => new THREE.Color(c));
  const tmp = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i) / radius;
    const y = pos.getY(i) / radius;
    // Banded by latitude, swirled by longitude → marbled, not striped.
    let t = y * 0.5 + 0.5 + 0.12 * Math.sin(x * 3.0 + y * 2.0);
    t = ((t % 1) + 1) % 1;
    const f = t * (stops.length - 1);
    const idx = Math.floor(f);
    tmp
      .copy(stops[idx])
      .lerp(stops[Math.min(idx + 1, stops.length - 1)], f - idx);
    colors[i * 3] = tmp.r;
    colors[i * 3 + 1] = tmp.g;
    colors[i * 3 + 2] = tmp.b;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  return geo;
}

// Core layering matched to the brain's CrystalCore: a glass transmission
// substrate INSIDE, a pearl inner sheen, then the marbled vertex-colored
// opal shell OUTERMOST and semi-transparent — that outer colored shell is
// what makes it read as colored pearl instead of flat white glass.
const CORE_R = 0.6;

function Nucleus() {
  const opalGeo = useMemo(() => makeOpalGeometry(CORE_R), []);
  return (
    <group>
      {/* Glass transmission substrate (inside) */}
      <mesh>
        <sphereGeometry args={[CORE_R * 0.985, 64, 64]} />
        <MeshTransmissionMaterial
          transmission={1.0}
          thickness={0.6}
          roughness={0.06}
          ior={1.52}
          chromaticAberration={0.035}
          attenuationDistance={0.5}
          attenuationColor="#fff5e6"
          clearcoat={1.0}
          clearcoatRoughness={0.0}
          samples={6}
          resolution={256}
          backside={false}
          anisotropicBlur={0.1}
          fog={false}
        />
      </mesh>
      {/* Pearl inner sheen — opal hint, not plain clear glass */}
      <mesh>
        <sphereGeometry args={[CORE_R * 0.95, 48, 48]} />
        <meshStandardMaterial
          color="#fff8ec"
          emissive="#fef3d6"
          emissiveIntensity={0.18}
          roughness={0.85}
          metalness={0.0}
          transparent
          opacity={0.12}
          depthWrite={false}
          fog={false}
        />
      </mesh>
      {/* Marbled colored shell (outermost) — vertex colors carry the warm
          opal palette; semi-transparent so the glass shows through. */}
      <mesh geometry={opalGeo}>
        <meshStandardMaterial
          vertexColors
          emissive="#0a0f1a"
          emissiveIntensity={0.25}
          roughness={0.55}
          metalness={0.0}
          transparent
          opacity={0.82}
          depthWrite={false}
          fog={false}
        />
      </mesh>
    </group>
  );
}

function Atom() {
  const group = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (group.current) {
      // Spin only around the polar (Y) axis — the north/south poles stay
      // fixed in place while the longitude rings rotate around them.
      group.current.rotation.y += delta * 0.18;
    }
  });

  return (
    // Poles fixed and vertical (no cant). The Y-spin rotates all the rings
    // to the right around that fixed axis; the ions sweep their rings.
    <group ref={group} rotation={[0, 0, 0]}>
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
      {/* Depth fade: black fog so rings/ions at the back of the atom
          darken toward black while the front stays full brightness. The
          camera is at z=8.5; the atom spans ±2.7, so near≈6 leaves the
          front unfogged and far≈13 fully fades the back. The core opts out
          via fog={false} on its materials. */}
      <fog attach="fog" args={["#000000", 6, 13]} />

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

      {/* ION title — seated near the top of the atom, centered. */}
      <div className="absolute inset-x-0 top-[26%] z-20 flex justify-center pointer-events-none">
        <h1 className="text-6xl sm:text-7xl lg:text-8xl font-bold tracking-[0.35em] pl-[0.35em] text-white/90 [text-shadow:0_0_40px_rgba(59,130,246,0.4)]">
          ION
        </h1>
      </div>

      {/* Persistent scroll cue. */}
      <div className="absolute bottom-8 inset-x-0 z-20 flex justify-center pointer-events-none">
        <span className="text-xs uppercase tracking-[0.2em] text-stewart-muted animate-pulse">
          Scroll
        </span>
      </div>
    </section>
  );
}
