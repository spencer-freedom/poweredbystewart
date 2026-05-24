"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Line, OrbitControls } from "@react-three/drei";
import { MeshTransmissionMaterial } from "@react-three/drei";
import * as THREE from "three";
import {
  type BrainV2Payload,
  type Moon,
  type Planet,
  type Tile,
  sphericalToCartesian,
  tileToSpherical,
} from "./types";
import { type Selection } from "./DetailPanel.client";
import { Legend } from "./Legend.client";

// ───── Tuning ─────────────────────────────────────────────────────────

const SCENE_BG = "#020617";
const CORE_RADIUS_SCALE = 1.4; // bigger than payload core_radius for presence
const TILE_INACTIVE_COLOR = "#1a1d27";
const GROUNDING_LINE_COLOR = "#e2e8f0";
const GROUNDING_LINE_OPACITY = 0.4;
const GROUNDING_LINE_OPACITY_HOVER = 0.9;
const ORBIT_LINE_OPACITY = 0.22;
const PLANET_FADE_FLOOR = 0.08;
const PLANET_SIZE_FLOOR = 0.55;
const MOON_BASE_SIZE = 0.5;
const GRAY_HALO_COLOR = "#fde68a";
const GRAY_HALO_BASE_SCALE = 1.9;

// V2.0.4 — bumped emissive levels so domain hues stay legible at the
// pulled-back default camera distance. Pearl core can dominate the
// brightness budget if these are too low.
const MOON_EMISSIVE_BASE = 0.95;
const MOON_EMISSIVE_HOVER_BOOST = 0.6;
const MOON_EMISSIVE_DOMAIN_BOOST = 0.35;
const PLANET_EMISSIVE_BASE = 0.55;
const PLANET_EMISSIVE_GRAY_BASE = 0.85;
const PLANET_EMISSIVE_HOVER_BOOST = 0.45;
const PLANET_EMISSIVE_DOMAIN_BOOST = 0.3;

// V2.0.2.1 — Strategy Claude desaturated the domain palette in the
// payload to give the core sphere a "frosted crystal" feel, but that
// muted the orbiting moons too. Spencer wants the moons to keep
// their original vivid colors; only the core should read as
// crystal-pastel. Renderer-side override: moons resolve their color
// from this saturated palette by domain instead of using the
// payload's softened moon_color.
const VIVID_DOMAIN_COLORS: Record<string, string> = {
  context: "#5dd8e6",            // light cyan
  intros: "#4ca8e6",             // medium blue
  call_shape: "#74e683",         // light green
  verify: "#3dc18f",             // teal-green
  qualifiers: "#8de6c4",         // mint
  bill_collection: "#e6c478",    // sand / yellow
  rebuttals: "#e69a4d",          // orange
  protocols: "#e65c5c",          // warm red
  coaching_philosophy: "#b67ce6", // light purple
  cross_sell_signals: "#e6e64d", // yellow
  outcomes: "#e67cd8",           // pink
  dq_rules: "#909090",           // neutral gray
  analysis_directives: "#c87ce6", // magenta
  _unclassified: "#5a5a5a",
  _unknown: "#7d7d7d",
  _reserved: "#3c3540",
};

function vividMoonColor(codexReference: string | null, fallback: string): string {
  if (!codexReference) return fallback;
  const domain = codexReference.split(".")[0];
  return VIVID_DOMAIN_COLORS[domain] || fallback;
}

// ───── Canvas-only component (state lifted to BrainPageShell) ─────────
//
// V2.0.1: selection + hoveredDomain state moved up to BrainPageShell
// so the detail panel can render in a side-docked column instead of as
// an overlay on top of the brain. This component now just owns the
// canvas + the bottom-of-canvas legend; the shell composes the rest.

const AUTO_ROTATE_RESUME_MS = 2000;
const AUTO_ROTATE_SPEED = 0.45;

export function BrainV2Scene({
  payload,
  hoveredDomain,
  onHoverDomain,
  onSelect,
}: {
  payload: BrainV2Payload;
  hoveredDomain: string | null;
  onHoverDomain: (d: string | null) => void;
  onSelect: (sel: Selection) => void;
}) {
  const coreRadius = payload.core.core_radius * CORE_RADIUS_SCALE;
  const [autoRotate, setAutoRotate] = useState(true);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (resumeTimer.current) clearTimeout(resumeTimer.current);
    },
    []
  );

  const handleInteractStart = () => {
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    setAutoRotate(false);
  };
  const handleInteractEnd = () => {
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(
      () => setAutoRotate(true),
      AUTO_ROTATE_RESUME_MS
    );
  };

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden border border-stewart-border">
      {/* Mobile fallback notice */}
      <div className="absolute inset-0 sm:hidden flex items-center justify-center p-6 text-center text-stewart-muted text-sm bg-stewart-bg/95 z-30">
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
            onSelect={onSelect}
            autoRotate={autoRotate}
            onInteractStart={handleInteractStart}
            onInteractEnd={handleInteractEnd}
          />
        </Canvas>
      </div>

      <Legend
        domainColors={payload.domain_colors}
        hoveredDomain={hoveredDomain}
        onHoverDomain={onHoverDomain}
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
  autoRotate,
  onInteractStart,
  onInteractEnd,
}: {
  payload: BrainV2Payload;
  coreRadius: number;
  hoveredDomain: string | null;
  onSelect: (sel: Selection) => void;
  autoRotate: boolean;
  onInteractStart: () => void;
  onInteractEnd: () => void;
}) {
  return (
    <>
      <ambientLight intensity={0.45} />
      <pointLight
        position={[0, 0, 0]}
        intensity={1.6}
        distance={400}
        color="#ffffff"
      />
      <directionalLight position={[180, 220, 240]} intensity={0.45} />
      <directionalLight position={[-220, -90, -180]} intensity={0.22} />

      {/* Environment provides the IBL contribution that makes the
          transmission material's refraction read as real glass.
          background={false} keeps the void backdrop intact. */}
      <Environment preset="studio" background={false} />

      <Suspense fallback={null}>
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
      </Suspense>

      <OrbitControls
        enablePan={false}
        minDistance={120}
        maxDistance={620}
        autoRotate={autoRotate}
        autoRotateSpeed={AUTO_ROTATE_SPEED}
        enableDamping
        target={[0, 0, 0]}
        makeDefault
        onStart={onInteractStart}
        onEnd={onInteractEnd}
      />
    </>
  );
}

// ───── Crystal core: continuous sphere with per-vertex coloring ───────
//
// V2.0.1 rebuild: replaces the 108-separate-tile-mesh layout with one
// high-poly sphere whose vertex colors are sampled from the tile each
// vertex lies in. Adjacent vertices across tile boundaries get smooth
// interpolation, so the core reads as one continuous lit crystal with
// colored regions melting into each other — no visible grout.
//
// Click/hover targets are still per-tile, but rendered as invisible
// raycaster-hittable spheres at each active tile's center.

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
  // Build the per-vertex-color sphere geometry once per (core + radius)
  const geometry = useMemo(
    () => buildCoreGeometry(core, coreRadius, hoveredDomain),
    [core, coreRadius, hoveredDomain]
  );

  return (
    <group>
      {/* Crystal substrate — drei MeshTransmissionMaterial for real
          glass refraction. Sits just inside the colored shell; depth
          + chromatic aberration + clearcoat sells "tinted leaded
          crystal orb". V2.0.2.1: subtle pearl-white tint via warm
          attenuation color so the orb reads pearl-glass instead of
          plain clear, per Spencer's note. */}
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          onSelect({ kind: "core" });
        }}
      >
        <sphereGeometry args={[coreRadius * 0.985, 64, 64]} />
        <MeshTransmissionMaterial
          transmission={1.0}
          thickness={2.4}
          roughness={0.05}
          ior={1.52}
          chromaticAberration={0.035}
          attenuationDistance={0.6}
          attenuationColor="#fff5e6"
          clearcoat={1.0}
          clearcoatRoughness={0.0}
          samples={6}
          resolution={256}
          backside={false}
          anisotropicBlur={0.1}
        />
      </mesh>

      {/* Pearl-white inner sheen — subtle iridescent layer that
          gives the crystal a hint of opal/pearl rather than reading
          as plain clear glass. */}
      <mesh>
        <sphereGeometry args={[coreRadius * 0.95, 48, 48]} />
        <meshStandardMaterial
          color="#fff8ec"
          emissive="#fef3d6"
          emissiveIntensity={0.18}
          roughness={0.85}
          metalness={0.0}
          transparent
          opacity={0.12}
          depthWrite={false}
        />
      </mesh>

      {/* Colored shell — single mesh, vertex colors carry the tile
          palette + saturation boost. Lower opacity so the underlying
          crystal + pearl layers read through. */}
      <mesh
        geometry={geometry}
        onClick={(e) => {
          e.stopPropagation();
          onSelect({ kind: "core" });
        }}
      >
        <meshStandardMaterial
          vertexColors
          emissive="#0a0f1a"
          emissiveIntensity={0.32}
          roughness={0.6}
          metalness={0.0}
          transparent
          opacity={0.48}
          depthWrite={false}
        />
      </mesh>

      <CoreInnerGlow radius={coreRadius * 0.93} />

      {/* V2.0.7 — Ion Earth crosshair. One equator + one meridian
          rendered prominently on the crystal surface so the core
          reads as the "globe with crosshair" from Ion's own logo
          (ION EARTH = circle with + center + orbital rings). */}
      <CoreCrosshair radius={coreRadius * 1.012} />

      {/* Invisible click/hover targets for the 101 active tiles. The
          shell mesh is one piece, so we still need per-tile pickables
          for the detail panel. Inactive (_reserved) tiles get no
          target — per V2.0.1 spec they render but don't interact. */}
      {core.tiles
        .filter((t) => t.is_active && t.codex_section)
        .map((tile) => (
          <TileClickTarget
            key={tile.tile_index}
            tile={tile}
            core={core}
            coreRadius={coreRadius}
            onSelect={onSelect}
          />
        ))}
    </group>
  );
}

function buildCoreGeometry(
  core: BrainV2Payload["core"],
  radius: number,
  hoveredDomain: string | null
): THREE.SphereGeometry {
  // Mesh resolution. Higher = smoother boundaries between tile colors,
  // larger geometry payload. 128×80 is plenty for a 12×9 tile grid.
  const widthSegments = 128;
  const heightSegments = 80;
  const geom = new THREE.SphereGeometry(
    radius,
    widthSegments,
    heightSegments
  );

  // Index tiles by (lat, lon) cell.
  const byCell = new Map<string, Tile>();
  for (const t of core.tiles) {
    byCell.set(`${t.lat_index}:${t.lon_index}`, t);
  }

  const pos = geom.attributes.position;
  const colors = new Float32Array(pos.count * 3);

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const r = Math.sqrt(x * x + y * y + z * z) || 1;

    // theta (polar) ∈ [0, π], phi (azimuth) ∈ [0, 2π)
    const theta = Math.acos(Math.min(1, Math.max(-1, y / r)));
    let phi = Math.atan2(z, x);
    if (phi < 0) phi += Math.PI * 2;

    const latIdx = Math.min(
      core.lat_count - 1,
      Math.floor((theta / Math.PI) * core.lat_count)
    );
    const lonIdx = Math.min(
      core.lon_count - 1,
      Math.floor((phi / (Math.PI * 2)) * core.lon_count)
    );
    const tile = byCell.get(`${latIdx}:${lonIdx}`);

    const baseHex = tile?.color || "#3c3540";
    const c = new THREE.Color(baseHex);

    // Saturation boost lifts brightness on heavily-referenced tiles
    // (quantity-per-section rule baked into the payload).
    const boost = (tile?.saturation_boost || 0) * 0.65;

    // Legend hover: brighten the tile's domain across the whole sphere
    // by ~25% lift on r/g/b. Implementation only applies if tile is
    // active (matches the click-target gating).
    const domainHit =
      hoveredDomain &&
      tile?.is_active &&
      tile?.domain === hoveredDomain;
    const hoverLift = domainHit ? 0.35 : 0;

    const scale = 1 + boost + hoverLift;
    colors[i * 3] = Math.min(1.4, c.r * scale);
    colors[i * 3 + 1] = Math.min(1.4, c.g * scale);
    colors[i * 3 + 2] = Math.min(1.4, c.b * scale);
  }

  geom.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  return geom;
}

function CoreInnerGlow({ radius }: { radius: number }) {
  return (
    <mesh>
      <sphereGeometry args={[radius, 32, 32]} />
      <meshBasicMaterial
        color="#a5f3fc"
        transparent
        opacity={0.05}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}

function CoreCrosshair({ radius }: { radius: number }) {
  // One equator (constant theta = π/2 — circle on the XZ plane) and
  // one meridian (constant phi = 0 — circle on the XY plane). Echoes
  // the "+" inside Ion Earth's logo at the crystal surface.
  const equator = useMemo(() => {
    const pts: [number, number, number][] = [];
    const segments = 96;
    for (let i = 0; i <= segments; i++) {
      const a = (i / segments) * Math.PI * 2;
      pts.push([Math.cos(a) * radius, 0, Math.sin(a) * radius]);
    }
    return pts;
  }, [radius]);
  const meridian = useMemo(() => {
    const pts: [number, number, number][] = [];
    const segments = 96;
    for (let i = 0; i <= segments; i++) {
      const a = (i / segments) * Math.PI * 2;
      pts.push([Math.cos(a) * radius, Math.sin(a) * radius, 0]);
    }
    return pts;
  }, [radius]);
  return (
    <group>
      <Line
        points={equator}
        color="#fff8ec"
        opacity={0.55}
        transparent
        lineWidth={1.2}
        depthWrite={false}
      />
      <Line
        points={meridian}
        color="#fff8ec"
        opacity={0.55}
        transparent
        lineWidth={1.2}
        depthWrite={false}
      />
    </group>
  );
}

function TileClickTarget({
  tile,
  core,
  coreRadius,
  onSelect,
}: {
  tile: Tile;
  core: BrainV2Payload["core"];
  coreRadius: number;
  onSelect: (sel: Selection) => void;
}) {
  const { theta, phi } = tileToSpherical(
    tile.lat_index,
    tile.lon_index,
    core.lat_count,
    core.lon_count
  );
  const center = sphericalToCartesian(theta, phi, coreRadius * 1.02);

  // Small invisible sphere — sized so adjacent tile targets don't
  // overlap on the 12×9 grid. Raycaster still picks it cleanly.
  const targetRadius =
    (coreRadius * Math.PI) / Math.max(core.lat_count * 2, core.lon_count * 2);

  return (
    <mesh
      position={center}
      onClick={(e) => {
        e.stopPropagation();
        onSelect({ kind: "tile", tile });
      }}
    >
      <sphereGeometry args={[targetRadius * 0.9, 8, 8]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
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
            (planet.is_gray_matter ? PLANET_EMISSIVE_GRAY_BASE : PLANET_EMISSIVE_BASE) +
            (hover ? PLANET_EMISSIVE_HOVER_BOOST : 0) +
            (domainHit ? PLANET_EMISSIVE_DOMAIN_BOOST : 0)
          }
          roughness={0.35}
          transparent
          opacity={opacity}
        />
      </mesh>

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

// V2.0.5: floating labels removed (ExemplarLabel / PlanetTooltip /
// MoonTooltip). With the crystal core transparent, far-side labels
// bled through the front hemisphere and read as visual noise.
// Identity is recovered via click → PlanetDetail card below the
// brain. Gray-matter exemplars still carry their pulsing gold halo
// for at-a-glance identification.

// ───── Moons (ion-orbital — atom, not Saturn) ─────────────────────────
//
// V2.0.1: each moon orbits its planet on its own 3D plane defined by
// (orbit_normal_phi, orbit_normal_theta). Result: planet + moons reads
// as a nucleus with electrons/ions in 3D orbit, not as a Saturn-ring.
// The Ion Solar brand tie-in is intentional — Stewart's ion-orbital
// architecture is the visual identity that no generic AI sales tool
// can match.

// V2.0.6: bumped to atomic-electron pace after Spencer spotted Ion's
// own ION EARTH logo (globe + three orbital rings = atom). The brain
// IS Ion Solar's brand mark. Moons whip around their planet now.
const BASE_ORBITAL_SPEED = 1.5; // multiplier on per-moon orbit_speed

function buildOrbitBasis(
  normalPhi: number,
  normalTheta: number
): { u: THREE.Vector3; v: THREE.Vector3 } {
  // Normal from spherical coords (matches Strategy Claude's payload
  // convention: phi azimuth + theta polar)
  const n = new THREE.Vector3(
    Math.sin(normalTheta) * Math.cos(normalPhi),
    Math.sin(normalTheta) * Math.sin(normalPhi),
    Math.cos(normalTheta)
  ).normalize();

  // Pick any vector not parallel to n, then Gram-Schmidt.
  const worldUp = new THREE.Vector3(0, 1, 0);
  const seed =
    Math.abs(n.dot(worldUp)) > 0.99
      ? new THREE.Vector3(1, 0, 0)
      : worldUp.clone();
  const u = new THREE.Vector3().crossVectors(seed, n).normalize();
  const v = new THREE.Vector3().crossVectors(n, u).normalize();
  return { u, v };
}

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
  // Fallback to the payload's softened color only if the codex
  // reference doesn't map cleanly into the vivid palette.
  const moonColor = vividMoonColor(moon.codex_reference, "#94a3b8");

  // Precompute the orbital plane basis once per moon. orbit_normal_phi
  // and orbit_normal_theta come from the V2.0.1 payload — deterministic
  // per call+cherry-pick so renders are byte-identical across loads.
  const { u, v } = useMemo(
    () => buildOrbitBasis(moon.orbit_normal_phi, moon.orbit_normal_theta),
    [moon.orbit_normal_phi, moon.orbit_normal_theta]
  );

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.getElapsedTime();
    const angle = moon.orbit_phase + t * moon.orbit_speed * BASE_ORBITAL_SPEED;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    ref.current.position.set(
      u.x * cos * orbitRadius + v.x * sin * orbitRadius,
      u.y * cos * orbitRadius + v.y * sin * orbitRadius,
      u.z * cos * orbitRadius + v.z * sin * orbitRadius
    );
  });

  const [hover, setHover] = useState(false);

  const ref_domain = (moon.codex_reference || "").split(".")[0];
  const domainHit =
    hoveredDomain && hoveredDomain !== "" && ref_domain === hoveredDomain;

  return (
    <>
      <OrbitRing
        u={u}
        v={v}
        radius={orbitRadius}
        color={moonColor}
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
          color={moonColor}
          emissive={moonColor}
          emissiveIntensity={
            MOON_EMISSIVE_BASE +
            (hover ? MOON_EMISSIVE_HOVER_BOOST : 0) +
            (domainHit ? MOON_EMISSIVE_DOMAIN_BOOST : 0)
          }
          roughness={0.3}
        />
      </mesh>
    </>
  );
}

function OrbitRing({
  u,
  v,
  radius,
  color,
  opacity,
}: {
  u: THREE.Vector3;
  v: THREE.Vector3;
  radius: number;
  color: string;
  opacity: number;
}) {
  // Trace an ellipse on the (u, v) plane so the ring sits exactly
  // where the moon orbits.
  const pts = useMemo(() => {
    const out: [number, number, number][] = [];
    const segments = 48;
    for (let i = 0; i <= segments; i++) {
      const a = (i / segments) * Math.PI * 2;
      const cos = Math.cos(a);
      const sin = Math.sin(a);
      out.push([
        u.x * cos * radius + v.x * sin * radius,
        u.y * cos * radius + v.y * sin * radius,
        u.z * cos * radius + v.z * sin * radius,
      ]);
    }
    return out;
  }, [u, v, radius]);
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

