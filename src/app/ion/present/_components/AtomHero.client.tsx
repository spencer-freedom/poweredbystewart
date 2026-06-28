"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import * as THREE from "three";

// Self-contained hero atom. Decoupled from /ion/brain data on purpose —
// this is a decorative, always-moving visual base, not a data render.
// A central nucleus with electrons sweeping tilted orbital rings, the
// whole assembly drifting slowly. The "ion" tie-in (Stewart's atomic
// brand) is intentional but the geometry is hand-tuned, not loaded.

const ACCENT = "#3b82f6";
const CORE = "#e2e8f0";

type Orbit = {
  radius: number;
  // Euler tilt (radians) applied to the orbit plane.
  tilt: [number, number, number];
  speed: number;
  // Starting angles for each electron on this ring.
  electrons: number[];
};

const ORBITS: Orbit[] = [
  { radius: 2.0, tilt: [1.4, 0.2, 0.0], speed: 0.6, electrons: [0, Math.PI] },
  { radius: 2.5, tilt: [0.3, 1.2, 0.5], speed: -0.45, electrons: [1.1] },
  { radius: 3.0, tilt: [0.9, -0.6, 1.1], speed: 0.35, electrons: [0.4, 3.7] },
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
    orbit.electrons.forEach((phase, i) => {
      const mesh = electronRefs.current[i];
      if (!mesh) return;
      const a = t + phase;
      mesh.position.set(
        Math.cos(a) * orbit.radius,
        Math.sin(a) * orbit.radius,
        0,
      );
    });
  });

  return (
    <group rotation={orbit.tilt}>
      <Line points={points} color={ACCENT} transparent opacity={0.28} lineWidth={1} />
      {orbit.electrons.map((_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            electronRefs.current[i] = el;
          }}
        >
          <sphereGeometry args={[0.11, 16, 16]} />
          <meshBasicMaterial color={ACCENT} />
        </mesh>
      ))}
    </group>
  );
}

function Nucleus() {
  return (
    <group>
      {/* Glowing core */}
      <mesh>
        <icosahedronGeometry args={[0.55, 1]} />
        <meshStandardMaterial
          color={CORE}
          emissive={ACCENT}
          emissiveIntensity={0.5}
          roughness={0.25}
          metalness={0.1}
        />
      </mesh>
      {/* Soft halo */}
      <mesh>
        <sphereGeometry args={[0.78, 24, 24]} />
        <meshBasicMaterial color={ACCENT} transparent opacity={0.08} />
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
      <ambientLight intensity={0.4} />
      <pointLight position={[0, 0, 0]} intensity={2.2} color={ACCENT} />
      <pointLight position={[6, 6, 6]} intensity={0.6} />
      <Atom />
    </Canvas>
  );
}

const DISMISS_KEY = "ion-present-about-dismissed";

function AboutCard({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center px-6">
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Begin the walkthrough"
        className="group max-w-xl w-full text-left rounded-2xl border border-white/15 bg-black/70 backdrop-blur-md p-8 sm:p-10 shadow-2xl cursor-pointer hover:border-white/25 transition-colors"
      >
        <p className="text-xs uppercase tracking-[0.2em] font-semibold text-stewart-accent mb-4">
          A note before we start
        </p>

        {/*
          ABOUT_SPENCER_COPY — placeholder. Spencer provides the final
          about-Spencer card text at handoff (distilled from the bear-hunt
          origin + Brent Brown #5→#1 + the 13-year sales-DNA write-up).
          Replace the paragraphs below with that copy; keep the dismiss
          affordance and the markup shape.
          <!-- ABOUT_SPENCER_COPY -->
        */}
        <div className="space-y-4 text-base sm:text-lg text-stewart-text leading-relaxed">
          <p>
            [ABOUT_SPENCER_COPY placeholder — Spencer&apos;s about-me copy
            lands here. A few sentences on who built Stewart and why:
            thirteen years on the floor, the bear-hunt origin, and the
            #5&rarr;#1 turnaround that taught him what good actually looks
            like.]
          </p>
          <p className="text-stewart-muted text-base">
            This is the warm-up frame, not the pitch. The pitch is below.
          </p>
        </div>

        <p className="mt-8 text-sm font-medium text-stewart-accent group-hover:translate-x-1 inline-block transition-transform">
          Click anywhere to begin &rarr;
        </p>
      </button>
    </div>
  );
}

export function AtomHero() {
  // mounted gate avoids SSR/localStorage hydration mismatch. Card starts
  // hidden until we've checked localStorage on the client, then shows
  // unless it was previously dismissed. The atom always renders.
  const [mounted, setMounted] = useState(false);
  const [showCard, setShowCard] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const dismissed = window.localStorage.getItem(DISMISS_KEY) === "1";
      setShowCard(!dismissed);
    } catch {
      setShowCard(true);
    }
  }, []);

  const dismiss = () => {
    setShowCard(false);
    try {
      window.localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // ignore — dismissal just won't persist
    }
  };

  return (
    <section className="relative h-[100svh] min-h-[600px] w-full overflow-hidden bg-black">
      {/* Atom is the persistent visual base — keeps moving after dismiss. */}
      <div className="absolute inset-0 z-0">
        <AtomCanvas />
      </div>

      {/* Radial vignette so the floating card reads against the atom. */}
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.75) 100%)",
        }}
      />

      {mounted && showCard && <AboutCard onDismiss={dismiss} />}

      {/* Scroll cue, only once the card is gone. */}
      {mounted && !showCard && (
        <div className="absolute bottom-8 inset-x-0 z-20 flex justify-center pointer-events-none">
          <span className="text-xs uppercase tracking-[0.2em] text-stewart-muted animate-pulse">
            Scroll
          </span>
        </div>
      )}
    </section>
  );
}
