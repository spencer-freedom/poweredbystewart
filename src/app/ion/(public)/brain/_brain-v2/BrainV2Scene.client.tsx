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

// ───── Tuning ─────────────────────────────────────────────────────────

const SCENE_BG = "#020617";
const CORE_RADIUS_SCALE = 1.4; // bigger than payload core_radius for presence
const TILE_INACTIVE_COLOR = "#1a1d27";

// V2.0.12 — switchable PLANET (call nucleus) palettes. Spencer wants
// the nodes to read as natural materials (brown / bronze / copper)
// for better visibility against the pearl crystal core. Each palette
// overrides the payload's outcome_tint_color with a hardcoded natural
// tone. Once Spencer picks, lock the chosen one + rip the picker.
//
// Core itself stays pearl — only the planet bodies change palette.
export type PlanetPalette = {
  id: string;
  label: string;
  // Color picker swatch (one representative tone for the picker UI)
  swatch: string;
  // Per-outcome bucket tints applied to the planet sphere material
  outcomes: Record<string, string>;
};

// Resolve a payload outcome string to the palette's bucket. Anything
// outside the named buckets falls back to "unknown".
function bucketOf(outcome: string): string {
  const o = (outcome || "").toLowerCase();
  if (o === "booked" || o === "appointment_set" || o === "transferred_to_closer")
    return "booked";
  if (o === "no_interest" || o === "lost") return "no_interest";
  if (o === "declined" || o === "unqualified") return "declined";
  if (o === "callback" || o === "conditional_booking") return "callback";
  if (o.startsWith("tentative") || o === "fragile") return "tentative";
  return "unknown";
}

export const PLANET_PALETTES: PlanetPalette[] = [
  {
    id: "current",
    label: "Current (payload)",
    swatch: "#9a9a9a",
    outcomes: {}, // empty → falls through to payload outcome_tint_color
  },
  {
    id: "bronze",
    label: "Bronze foundry",
    swatch: "#cd7f32",
    outcomes: {
      booked: "#cd7f32",      // copper
      no_interest: "#5c2e10", // dark coffee
      declined: "#5c2e10",
      callback: "#b8860b",    // dark goldenrod
      tentative: "#a0522d",   // sienna
      unknown: "#6b5e4f",     // taupe
    },
  },
  {
    id: "leather",
    label: "Aged leather",
    swatch: "#8b6f47",
    outcomes: {
      booked: "#8b6f47",      // warm tan
      no_interest: "#5c3317", // burnt umber
      declined: "#5c3317",
      callback: "#c19a6b",    // camel
      tentative: "#a0522d",   // sienna
      unknown: "#7d6e58",     // mushroom
    },
  },
  {
    id: "walnut",
    label: "Polished walnut",
    swatch: "#8b5a2b",
    outcomes: {
      booked: "#8b5a2b",      // saddle brown
      no_interest: "#3d2817", // espresso
      declined: "#3d2817",
      callback: "#a08060",    // walnut
      tentative: "#b8860b",   // goldenrod
      unknown: "#5d4e3a",     // driftwood
    },
  },
];

// Locked: Polished walnut. The other PLANET_PALETTES entries stay in
// the file as documentation of alternates we considered.
export const DEFAULT_PLANET_PALETTE: PlanetPalette =
  PLANET_PALETTES.find((p) => p.id === "walnut") || PLANET_PALETTES[0];

export function planetColor(
  outcome: string,
  payloadTint: string,
  palette: PlanetPalette
): string {
  const overrideColor = palette.outcomes[bucketOf(outcome)];
  return overrideColor || payloadTint;
}
const GROUNDING_LINE_COLOR = "#e2e8f0";
const GROUNDING_LINE_OPACITY = 0.22;
const GROUNDING_LINE_OPACITY_HOVER = 0.8;
// V2.0.13 — moon orbit paths lifted in brightness + thickness so the
// per-domain ion-orbital traces stay legible at the pulled-back default
// camera. Previous 0.22 / lineWidth 0.5 read as ghost-faint.
const ORBIT_LINE_OPACITY = 0.44;
const ORBIT_LINE_WIDTH = 0.5;
const PLANET_FADE_FLOOR = 0.08;
const PLANET_SIZE_FLOOR = 0.55;
const MOON_BASE_SIZE = 0.5;
const GRAY_HALO_COLOR = "#fde68a";
const GRAY_HALO_BASE_SCALE = 1.9;
// V2.1.1 — gray-matter exemplars get a warm-gray body in the walnut
// palette family so they're visibly different from regular call
// nuclei before the halo/pulse even register. Halo stays gold.
const GRAY_MATTER_BODY_COLOR = "#8b7f6b";

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

function vividMoonColor(schemaReference: string | null, fallback: string): string {
  if (!schemaReference) return fallback;
  const domain = schemaReference.split(".")[0];
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
  planetPalette = DEFAULT_PLANET_PALETTE,
}: {
  payload: BrainV2Payload;
  hoveredDomain: string | null;
  onHoverDomain: (d: string | null) => void;
  onSelect: (sel: Selection) => void;
  planetPalette?: PlanetPalette;
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
            planetPalette={planetPalette}
          />
        </Canvas>
      </div>
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
  planetPalette,
}: {
  payload: BrainV2Payload;
  coreRadius: number;
  hoveredDomain: string | null;
  onSelect: (sel: Selection) => void;
  autoRotate: boolean;
  onInteractStart: () => void;
  onInteractEnd: () => void;
  planetPalette: PlanetPalette;
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
          planetPalette={planetPalette}
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

      {/* Pearl inner sheen — gives the crystal an opal/pearl hint
          rather than reading as plain clear glass. */}
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
          palette + saturation boost. */}
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

      {/* Invisible click/hover targets for the 101 active tiles. The
          shell mesh is one piece, so we still need per-tile pickables
          for the detail panel. Inactive (_reserved) tiles get no
          target — per V2.0.1 spec they render but don't interact. */}
      {core.tiles
        .filter((t) => t.is_active && t.schema_section)
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
  planetPalette,
}: {
  planets: Planet[];
  radialConfig: BrainV2Payload["radial_config"];
  tiles: Tile[];
  coreRadius: number;
  hoveredDomain: string | null;
  onSelect: (sel: Selection) => void;
  planetPalette: PlanetPalette;
}) {
  // Precompute tile centers keyed by schema_section so gray-matter
  // planets can be parented near their exemplar tile.
  const tileCenters = useMemo(() => {
    const map = new Map<string, [number, number, number]>();
    for (const t of tiles) {
      if (!t.schema_section) continue;
      const { theta, phi } = tileToSpherical(
        t.lat_index,
        t.lon_index,
        // matches Tile3D's lat/lon counts
        12,
        9
      );
      const c = sphericalToCartesian(theta, phi, coreRadius * 1.05);
      map.set(t.schema_section, c);
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
          coreRadius={coreRadius}
          hoveredDomain={hoveredDomain}
          onSelect={onSelect}
          planetPalette={planetPalette}
        />
      ))}
    </group>
  );
}

function SinglePlanet({
  planet,
  radialConfig,
  tileCenter,
  coreRadius,
  hoveredDomain,
  onSelect,
  planetPalette,
}: {
  planet: Planet;
  radialConfig: BrainV2Payload["radial_config"];
  tileCenter: [number, number, number] | null;
  coreRadius: number;
  hoveredDomain: string | null;
  onSelect: (sel: Selection) => void;
  planetPalette: PlanetPalette;
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
      const ref = m.schema_reference || "";
      return ref.split(".")[0] === hoveredDomain;
    });

  return (
    <group position={pos}>
      <GroundingLine
        from={pos}
        coreRadius={coreRadius}
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
          color={
            planet.is_gray_matter
              ? GRAY_MATTER_BODY_COLOR
              : planetColor(
                  planet.outcome,
                  planet.outcome_tint_color,
                  planetPalette
                )
          }
          emissive={
            planet.is_gray_matter
              ? GRAY_MATTER_BODY_COLOR
              : planetColor(
                  planet.outcome,
                  planet.outcome_tint_color,
                  planetPalette
                )
          }
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
  coreRadius,
  opacity,
}: {
  from: [number, number, number];
  coreRadius: number;
  opacity: number;
}) {
  // V2.0.10: line truncates at the crystal surface instead of running
  // all the way to (0,0,0). Without this, brightened lines were
  // visible THROUGH the transparent core — read as visual noise.
  // Stop at distance coreRadius from origin, in the direction of the
  // planet. Inside the planet group, world (0,0,0) sits at -from, so
  // the stop point is -from scaled by ((dist - coreRadius) / dist).
  const dist = Math.sqrt(
    from[0] * from[0] + from[1] * from[1] + from[2] * from[2]
  );
  // Gray-matter planets can sit inside the core radius — no line to
  // render in that case.
  if (dist <= coreRadius) return null;
  const t = (dist - coreRadius) / dist;
  const target: [number, number, number] = [
    -from[0] * t,
    -from[1] * t,
    -from[2] * t,
  ];
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
  // Fallback to the payload's softened color only if the schema
  // reference doesn't map cleanly into the vivid palette.
  const moonColor = vividMoonColor(moon.schema_reference, "#94a3b8");

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

  const ref_domain = (moon.schema_reference || "").split(".")[0];
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
      lineWidth={ORBIT_LINE_WIDTH}
      depthWrite={false}
    />
  );
}

