"use client";

import { Suspense, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html, Line, OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";
import {
  type BrainV2Payload,
  type Moon,
  type Planet,
  type Tile,
  sphericalToCartesian,
  tileToSpherical,
} from "./types";
import { DetailPanel, type Selection } from "./DetailPanel.client";
import { Legend } from "./Legend.client";

// ───── Tuning ─────────────────────────────────────────────────────────

const SCENE_BG = "#020617";
const CORE_RADIUS_SCALE = 1.4; // bigger than payload core_radius for presence
const TILE_INACTIVE_COLOR = "#1a1d27";
const GROUNDING_LINE_COLOR = "#94a3b8";
const GROUNDING_LINE_OPACITY = 0.12;
const GROUNDING_LINE_OPACITY_HOVER = 0.7;
const ORBIT_LINE_OPACITY = 0.22;
const PLANET_FADE_FLOOR = 0.08;
const PLANET_SIZE_FLOOR = 0.55;
const MOON_BASE_SIZE = 0.35;
const GRAY_HALO_COLOR = "#fde68a";
const GRAY_HALO_BASE_SCALE = 1.9;

// ───── Top-level wrapper ──────────────────────────────────────────────

export function BrainV2Scene({ payload }: { payload: BrainV2Payload }) {
  const [selection, setSelection] = useState<Selection | null>(null);
  const [hoveredDomain, setHoveredDomain] = useState<string | null>(null);

  const coreRadius = payload.core.core_radius * CORE_RADIUS_SCALE;

  return (
    <div className="relative w-full" style={{ height: "78vh", minHeight: 540 }}>
      {/* Mobile fallback notice */}
      <div className="absolute inset-0 sm:hidden flex items-center justify-center p-6 text-center text-stewart-muted text-sm bg-stewart-bg/95 z-30 rounded-lg border border-stewart-border">
        Stewart&apos;s brain is best viewed on desktop. Open this page on
        a larger screen to explore the {payload.stats.sections_lit}-section
        structure interactively.
      </div>

      <div className="absolute inset-0 hidden sm:block">
        <Canvas
          shadows
          camera={{ position: [320, 140, 360], fov: 38 }}
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: false }}
          style={{ background: SCENE_BG }}
        >
          <Scene
            payload={payload}
            coreRadius={coreRadius}
            hoveredDomain={hoveredDomain}
            onSelect={setSelection}
          />
        </Canvas>
      </div>

      <DetailPanel
        payload={payload}
        selection={selection}
        onClose={() => setSelection(null)}
      />

      <Legend
        domainColors={payload.domain_colors}
        hoveredDomain={hoveredDomain}
        onHoverDomain={setHoveredDomain}
      />
    </div>
  );
}

// ───── Scene root ─────────────────────────────────────────────────────

function Scene({
  payload,
  coreRadius,
  hoveredDomain,
  onSelect,
}: {
  payload: BrainV2Payload;
  coreRadius: number;
  hoveredDomain: string | null;
  onSelect: (sel: Selection) => void;
}) {
  // Idle rotation of the whole scene (slow, museum-pace)
  const groupRef = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (groupRef.current) groupRef.current.rotation.y += dt * 0.04;
  });

  return (
    <>
      <ambientLight intensity={0.55} />
      <pointLight position={[0, 0, 0]} intensity={1.4} distance={400} color="#ffffff" />
      <directionalLight position={[180, 220, 240]} intensity={0.55} />
      <directionalLight position={[-220, -90, -180]} intensity={0.25} />

      <Suspense fallback={null}>
        <group ref={groupRef}>
          <CrystalCore
            core={payload.core}
            coreRadius={coreRadius}
            hoveredDomain={hoveredDomain}
            onSelect={onSelect}
          />
          <CallPlanets
            planets={payload.planets}
            radialConfig={payload.radial_config}
            tiles={payload.core.tiles}
            coreRadius={coreRadius}
            hoveredDomain={hoveredDomain}
            onSelect={onSelect}
          />
        </group>
      </Suspense>

      <OrbitControls
        enablePan={false}
        minDistance={120}
        maxDistance={620}
        autoRotate={false}
        target={[0, 0, 0]}
        makeDefault
      />
    </>
  );
}

// ───── Crystal core: sphere + lat/long lines + tiles ──────────────────

function CrystalCore({
  core,
  coreRadius,
  hoveredDomain,
  onSelect,
}: {
  core: BrainV2Payload["core"];
  coreRadius: number;
  hoveredDomain: string | null;
  onSelect: (sel: Selection) => void;
}) {
  // Glass sphere — translucent prismatic appearance
  return (
    <group>
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          onSelect({ kind: "core" });
        }}
      >
        <sphereGeometry args={[coreRadius, 64, 64]} />
        <meshPhysicalMaterial
          color="#1e293b"
          transmission={0.6}
          thickness={0.5}
          roughness={0.18}
          metalness={0.0}
          clearcoat={0.4}
          ior={1.45}
          transparent
          opacity={0.6}
          emissive="#0f172a"
          emissiveIntensity={0.18}
        />
      </mesh>

      <CoreInnerGlow radius={coreRadius * 0.93} />
      <LatLongGrid
        radius={coreRadius * 1.005}
        latCount={core.lat_count}
        lonCount={core.lon_count}
      />

      {core.tiles.map((tile) => (
        <Tile3D
          key={tile.tile_index}
          tile={tile}
          core={core}
          coreRadius={coreRadius * 1.02}
          hoveredDomain={hoveredDomain}
          onSelect={onSelect}
        />
      ))}
    </group>
  );
}

function CoreInnerGlow({ radius }: { radius: number }) {
  return (
    <mesh>
      <sphereGeometry args={[radius, 32, 32]} />
      <meshBasicMaterial
        color="#a5f3fc"
        transparent
        opacity={0.07}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}

function LatLongGrid({
  radius,
  latCount,
  lonCount,
}: {
  radius: number;
  latCount: number;
  lonCount: number;
}) {
  // Latitude rings (constant theta)
  const latRings = useMemo(() => {
    const rings: [number, number, number][][] = [];
    for (let i = 1; i < latCount; i++) {
      const theta = (i / latCount) * Math.PI;
      const r = radius * Math.sin(theta);
      const y = radius * Math.cos(theta);
      const pts: [number, number, number][] = [];
      const segments = 64;
      for (let s = 0; s <= segments; s++) {
        const phi = (s / segments) * Math.PI * 2;
        pts.push([r * Math.cos(phi), y, r * Math.sin(phi)]);
      }
      rings.push(pts);
    }
    return rings;
  }, [radius, latCount]);

  // Longitude arcs (constant phi)
  const lonArcs = useMemo(() => {
    const arcs: [number, number, number][][] = [];
    for (let i = 0; i < lonCount; i++) {
      const phi = (i / lonCount) * Math.PI * 2;
      const pts: [number, number, number][] = [];
      const segments = 64;
      for (let s = 0; s <= segments; s++) {
        const theta = (s / segments) * Math.PI;
        const x = radius * Math.sin(theta) * Math.cos(phi);
        const y = radius * Math.cos(theta);
        const z = radius * Math.sin(theta) * Math.sin(phi);
        pts.push([x, y, z]);
      }
      arcs.push(pts);
    }
    return arcs;
  }, [radius, lonCount]);

  return (
    <group>
      {latRings.map((pts, i) => (
        <Line key={`lat-${i}`} points={pts} color="#475569" opacity={0.45} transparent lineWidth={0.6} />
      ))}
      {lonArcs.map((pts, i) => (
        <Line key={`lon-${i}`} points={pts} color="#475569" opacity={0.45} transparent lineWidth={0.6} />
      ))}
    </group>
  );
}

function Tile3D({
  tile,
  core,
  coreRadius,
  hoveredDomain,
  onSelect,
}: {
  tile: Tile;
  core: BrainV2Payload["core"];
  coreRadius: number;
  hoveredDomain: string | null;
  onSelect: (sel: Selection) => void;
}) {
  const { theta, phi } = tileToSpherical(
    tile.lat_index,
    tile.lon_index,
    core.lat_count,
    core.lon_count
  );
  const center = sphericalToCartesian(theta, phi, coreRadius);

  // Normal at this tile (outward)
  const normal = new THREE.Vector3(...center).normalize();
  const quat = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 0, 1),
    normal
  );

  // Tile dimensions (small patches that sit on the surface)
  const dLat = (Math.PI / core.lat_count) * 0.85;
  const dLon = ((Math.PI * 2) / core.lon_count) * 0.85;
  const w = coreRadius * dLon * Math.sin(theta);
  const h = coreRadius * dLat;

  const baseColor = tile.is_active ? tile.color : TILE_INACTIVE_COLOR;
  const saturationBoost = tile.saturation_boost || 0;

  const domainMatch =
    hoveredDomain && tile.domain === hoveredDomain && tile.is_active;
  const emissiveIntensity =
    (tile.is_active ? 0.35 : 0.05) +
    saturationBoost * 0.85 +
    (domainMatch ? 0.5 : 0);

  return (
    <mesh
      position={center}
      quaternion={quat}
      onClick={(e) => {
        e.stopPropagation();
        if (tile.is_active) onSelect({ kind: "tile", tile });
      }}
    >
      <planeGeometry args={[w, h]} />
      <meshStandardMaterial
        color={baseColor}
        emissive={baseColor}
        emissiveIntensity={emissiveIntensity}
        side={THREE.DoubleSide}
        transparent
        opacity={tile.is_active ? 0.7 + saturationBoost * 0.25 : 0.35}
        depthWrite={false}
      />
    </mesh>
  );
}

// ───── Call planets ───────────────────────────────────────────────────

function CallPlanets({
  planets,
  radialConfig,
  tiles,
  coreRadius,
  hoveredDomain,
  onSelect,
}: {
  planets: Planet[];
  radialConfig: BrainV2Payload["radial_config"];
  tiles: Tile[];
  coreRadius: number;
  hoveredDomain: string | null;
  onSelect: (sel: Selection) => void;
}) {
  // Precompute tile centers keyed by codex_section so gray-matter
  // planets can be parented near their exemplar tile.
  const tileCenters = useMemo(() => {
    const map = new Map<string, [number, number, number]>();
    for (const t of tiles) {
      if (!t.codex_section) continue;
      const { theta, phi } = tileToSpherical(
        t.lat_index,
        t.lon_index,
        // matches Tile3D's lat/lon counts
        12,
        9
      );
      const c = sphericalToCartesian(theta, phi, coreRadius * 1.05);
      map.set(t.codex_section, c);
    }
    return map;
  }, [tiles, coreRadius]);

  return (
    <group>
      {planets.map((p) => (
        <SinglePlanet
          key={p.call_id}
          planet={p}
          radialConfig={radialConfig}
          tileCenter={
            p.is_gray_matter && p.gray_matter_section
              ? tileCenters.get(p.gray_matter_section) || null
              : null
          }
          hoveredDomain={hoveredDomain}
          onSelect={onSelect}
        />
      ))}
    </group>
  );
}

function SinglePlanet({
  planet,
  radialConfig,
  tileCenter,
  hoveredDomain,
  onSelect,
}: {
  planet: Planet;
  radialConfig: BrainV2Payload["radial_config"];
  tileCenter: [number, number, number] | null;
  hoveredDomain: string | null;
  onSelect: (sel: Selection) => void;
}) {
  // Gray-matter planets never absorb regardless of rank.
  const absorption = planet.is_gray_matter ? 0 : planet.absorption_factor;
  if (absorption >= 0.95) return null;

  const opacity = Math.max(PLANET_FADE_FLOOR, 1 - absorption);
  const sizeScale = 1 - 0.5 * absorption;
  const baseSize = Math.max(
    PLANET_SIZE_FLOOR,
    planet.planet_size * sizeScale
  );

  // Position
  let pos: [number, number, number];
  if (planet.is_gray_matter && tileCenter) {
    // Stick close to exemplifying tile — sit just outside the core in
    // the direction of the tile center.
    const dir = new THREE.Vector3(...tileCenter).normalize();
    const stuckRadius = radialConfig.r_gray_matter;
    pos = [dir.x * stuckRadius, dir.y * stuckRadius, dir.z * stuckRadius];
  } else {
    pos = sphericalToCartesian(
      planet.angular_theta,
      planet.angular_phi,
      planet.radius
    );
  }

  // Hover wiring on the planet itself drives a local hover state — the
  // grounding line uses it for the brighten effect.
  const [hover, setHover] = useState(false);

  // If hoveredDomain is set (from legend), brighten planets whose moons
  // include that domain at all.
  const domainHit =
    hoveredDomain &&
    planet.moons.some((m) => {
      const ref = m.codex_reference || "";
      return ref.split(".")[0] === hoveredDomain;
    });

  return (
    <group position={pos}>
      <GroundingLine
        from={pos}
        opacity={
          hover || domainHit
            ? GROUNDING_LINE_OPACITY_HOVER
            : GROUNDING_LINE_OPACITY
        }
      />

      {planet.is_gray_matter ? (
        <GrayMatterHalo size={baseSize} />
      ) : null}

      <mesh
        onPointerOver={(e) => {
          e.stopPropagation();
          setHover(true);
        }}
        onPointerOut={() => setHover(false)}
        onClick={(e) => {
          e.stopPropagation();
          onSelect({ kind: "planet", planet });
        }}
      >
        <sphereGeometry args={[baseSize, 16, 16]} />
        <meshStandardMaterial
          color={planet.outcome_tint_color}
          emissive={planet.outcome_tint_color}
          emissiveIntensity={
            (planet.is_gray_matter ? 0.55 : 0.25) +
            (hover ? 0.35 : 0) +
            (domainHit ? 0.25 : 0)
          }
          roughness={0.5}
          transparent
          opacity={opacity}
        />
      </mesh>

      {planet.is_gray_matter && planet.gray_matter_section ? (
        <ExemplarLabel section={planet.gray_matter_section} y={baseSize * 2.4} />
      ) : null}

      {planet.moons.map((m, i) => (
        <MoonNode
          key={`${planet.call_id}-${i}`}
          moon={m}
          parentRadius={baseSize}
          hoveredDomain={hoveredDomain}
          onSelect={(p) =>
            onSelect({ kind: "moon", planet, moon: m, planetSelectedFromMoon: p })
          }
        />
      ))}

      {hover ? <PlanetTooltip planet={planet} y={baseSize * 1.7} /> : null}
    </group>
  );
}

function GroundingLine({
  from,
  opacity,
}: {
  from: [number, number, number];
  opacity: number;
}) {
  // Line from planet (which is at this group's origin = from) back to
  // (0,0,0) in world. Inside the planet group, world (0,0,0) is at -from.
  const target: [number, number, number] = [-from[0], -from[1], -from[2]];
  return (
    <Line
      points={[[0, 0, 0], target]}
      color={GROUNDING_LINE_COLOR}
      opacity={opacity}
      transparent
      lineWidth={0.7}
      depthWrite={false}
    />
  );
}

function GrayMatterHalo({ size }: { size: number }) {
  // Pulse the halo so gray-matter catches the eye.
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.getElapsedTime();
    const scale = GRAY_HALO_BASE_SCALE + Math.sin(t * 2) * 0.18;
    ref.current.scale.setScalar(scale);
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[size, 24, 24]} />
      <meshBasicMaterial
        color={GRAY_HALO_COLOR}
        transparent
        opacity={0.18}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}

function ExemplarLabel({ section, y }: { section: string; y: number }) {
  // Text always faces camera (drei Text + billboard via parent group's
  // orientation isn't trivial here; using Html for crispness).
  return (
    <Html position={[0, y, 0]} center distanceFactor={170} zIndexRange={[1, 0]} pointerEvents="none">
      <div className="pointer-events-none whitespace-nowrap text-[10px] uppercase tracking-wider text-amber-300 bg-stewart-bg/70 border border-amber-300/30 rounded px-1.5 py-0.5 font-mono">
        EXEMPLAR &middot; {section}
      </div>
    </Html>
  );
}

function PlanetTooltip({ planet, y }: { planet: Planet; y: number }) {
  return (
    <Html position={[0, y, 0]} center distanceFactor={120} zIndexRange={[10, 0]} pointerEvents="none">
      <div className="pointer-events-none whitespace-nowrap text-[10px] font-mono bg-stewart-bg/90 border border-stewart-border rounded px-2 py-1 text-stewart-text">
        {planet.call_id}
        {planet.rep_id ? <> &middot; {planet.rep_id}</> : null}{" "}
        &middot;{" "}
        <span style={{ color: planet.outcome_tint_color }}>
          {planet.outcome.replace(/_/g, " ")}
        </span>
        {planet.duration_min ? (
          <>
            {" "}
            &middot; {planet.duration_min.toFixed(0)} min
          </>
        ) : null}
      </div>
    </Html>
  );
}

// ───── Moons ──────────────────────────────────────────────────────────

function MoonNode({
  moon,
  parentRadius,
  hoveredDomain,
  onSelect,
}: {
  moon: Moon;
  parentRadius: number;
  hoveredDomain: string | null;
  onSelect: (planetSelectedFromMoon: boolean) => void;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const orbitRadius = moon.orbit_radius + parentRadius * 0.4;

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.getElapsedTime();
    const phase = moon.orbit_phase + t * 0.18; // ~35s/rotation
    ref.current.position.set(
      Math.cos(phase) * orbitRadius,
      Math.sin(phase * 0.4) * orbitRadius * 0.25,
      Math.sin(phase) * orbitRadius
    );
  });

  const [hover, setHover] = useState(false);

  const ref_domain = (moon.codex_reference || "").split(".")[0];
  const domainHit =
    hoveredDomain && hoveredDomain !== "" && ref_domain === hoveredDomain;

  return (
    <>
      {/* Orbit ring */}
      <OrbitRing
        radius={orbitRadius}
        color={moon.moon_color}
        opacity={domainHit ? ORBIT_LINE_OPACITY * 2.2 : ORBIT_LINE_OPACITY}
      />
      <mesh
        ref={ref}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHover(true);
        }}
        onPointerOut={() => setHover(false)}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(true);
        }}
      >
        <sphereGeometry args={[MOON_BASE_SIZE, 12, 12]} />
        <meshStandardMaterial
          color={moon.moon_color}
          emissive={moon.moon_color}
          emissiveIntensity={(hover ? 0.9 : 0.45) + (domainHit ? 0.3 : 0)}
          roughness={0.45}
        />
        {hover ? <MoonTooltip moon={moon} /> : null}
      </mesh>
    </>
  );
}

function OrbitRing({
  radius,
  color,
  opacity,
}: {
  radius: number;
  color: string;
  opacity: number;
}) {
  const pts = useMemo(() => {
    const out: [number, number, number][] = [];
    const segments = 32;
    for (let i = 0; i <= segments; i++) {
      const a = (i / segments) * Math.PI * 2;
      out.push([Math.cos(a) * radius, 0, Math.sin(a) * radius]);
    }
    return out;
  }, [radius]);
  return (
    <Line
      points={pts}
      color={color}
      opacity={opacity}
      transparent
      lineWidth={0.5}
      depthWrite={false}
    />
  );
}

function MoonTooltip({ moon }: { moon: Moon }) {
  return (
    <Html position={[0, 0.7, 0]} center distanceFactor={90} zIndexRange={[10, 0]} pointerEvents="none">
      <div className="pointer-events-none max-w-[220px] text-[10px] font-mono bg-stewart-bg/90 border border-stewart-border rounded px-2 py-1 text-stewart-text">
        <div className="text-stewart-accent">{moon.ts}</div>
        <div className="text-stewart-muted truncate">
          {moon.classification.replace(/_/g, " ")}
        </div>
        <div className="text-stewart-text mt-1 line-clamp-2 italic">
          “{moon.quote_excerpt}”
        </div>
      </div>
    </Html>
  );
}
