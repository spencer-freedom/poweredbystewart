// Server-side data loader for the V1 brain renderer.
//
// Reads every JSON under data/ion_solar/brain/nodes/, projects each into
// the BrainV1Payload shape, computes (x, y, z) positions for cores and
// satellites, and ships a single bundle to the client. No further fetch
// happens client-side.

import { promises as fs } from "node:fs";
import path from "node:path";
import {
  type BrainV1Payload,
  type CoreNode,
  type GraySatellite,
  type RawBrainNodeJson,
  type SoftSatellite,
  DOMAIN_TIERS,
  hashAngle,
  tierFor,
} from "./types";

const NODES_DIR = path.join(process.cwd(), "data", "ion_solar", "brain", "nodes");

// Visual layout constants. Tweak here to retune the brain without
// touching the renderer.
const CORE_RADIUS_BASE = 6;
const CORE_RADIUS_PER_CALL = 1.4; // larger if more calls reference this section
const CORE_RADIUS_MAX = 20;

const CORE_DISC_INNER_RADIUS = 80;
const CORE_DISC_SPREAD_PER_CALL = 5; // a heavily-cited section drifts outward

const SOFT_ORBIT_RADIUS = 28;
const SOFT_ORBIT_RADIUS_JITTER = 14;
const SOFT_ORBIT_Y_JITTER = 22;

const GRAY_ORBIT_RADIUS = 18;
const GRAY_ORBIT_Y_JITTER = 10;

// Cap soft satellites per core to keep payload + scene tractable. 8 is
// what the brain node JSON already keeps in recent_examples; we just
// honor that.
const SOFT_PER_CORE_MAX = 8;

// Outcome map for soft-satellite color cue. Mirrors OUTCOME_COLOR in
// types.ts but here we read it off the parent call's outcome via the
// brain node's outcomes histogram — there is no per-cherrypick outcome
// in the brain-node JSON, only the parent-call distribution. So we
// approximate by sampling the histogram in order of recent_examples:
// most-frequent outcome lights up first.
function pickOutcomeForExample(
  outcomes: Record<string, number>,
  i: number
): string {
  const entries = Object.entries(outcomes).sort(([, a], [, b]) => b - a);
  if (entries.length === 0) return "unknown";
  return entries[i % entries.length][0];
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function corePosition(
  codexSection: string,
  callCount: number
): { x: number; y: number; z: number } {
  const angle = hashAngle(codexSection);
  const { y } = tierFor(codexSection);
  const radius = clamp(
    CORE_DISC_INNER_RADIUS + callCount * CORE_DISC_SPREAD_PER_CALL,
    CORE_DISC_INNER_RADIUS,
    CORE_DISC_INNER_RADIUS + 90
  );
  return {
    x: Math.cos(angle) * radius,
    y,
    z: Math.sin(angle) * radius,
  };
}

function softPosition(
  core: { x: number; y: number; z: number },
  seed: string
): { x: number; y: number; z: number } {
  const a = hashAngle(seed);
  const r =
    SOFT_ORBIT_RADIUS +
    (hashAngle(seed + ":r") / (Math.PI * 2)) * SOFT_ORBIT_RADIUS_JITTER;
  const yJ =
    (hashAngle(seed + ":y") / (Math.PI * 2) - 0.5) * SOFT_ORBIT_Y_JITTER;
  return {
    x: core.x + Math.cos(a) * r,
    y: core.y + yJ,
    z: core.z + Math.sin(a) * r,
  };
}

function grayPosition(
  core: { x: number; y: number; z: number },
  seed: string
): { x: number; y: number; z: number } {
  const a = hashAngle(seed + ":gray");
  const yJ =
    (hashAngle(seed + ":gray-y") / (Math.PI * 2) - 0.5) * GRAY_ORBIT_Y_JITTER;
  return {
    x: core.x + Math.cos(a) * GRAY_ORBIT_RADIUS,
    y: core.y + yJ,
    z: core.z + Math.sin(a) * GRAY_ORBIT_RADIUS,
  };
}

async function loadAllNodeJsons(): Promise<RawBrainNodeJson[]> {
  const entries = await fs.readdir(NODES_DIR);
  const jsons = entries.filter((e) => e.endsWith(".json"));
  const out = await Promise.all(
    jsons.map(async (filename) => {
      const raw = await fs.readFile(path.join(NODES_DIR, filename), "utf-8");
      return JSON.parse(raw) as RawBrainNodeJson;
    })
  );
  return out;
}

export async function loadBrainV1(): Promise<BrainV1Payload> {
  const rawNodes = await loadAllNodeJsons();

  const cores: CoreNode[] = [];
  const softs: SoftSatellite[] = [];
  const grays: GraySatellite[] = [];

  const seenCallIds = new Set<string>();

  for (const raw of rawNodes) {
    const callCount = raw.call_ids.length;
    const { tier, label } = tierFor(raw.codex_section);
    const corePos = corePosition(raw.codex_section, callCount);
    const coreId = `core:${raw.codex_section}`;

    const cherryPicks = (raw.recent_examples || []).slice(0, SOFT_PER_CORE_MAX);

    cores.push({
      id: coreId,
      kind: "core",
      codex_section: raw.codex_section,
      tier,
      tier_label: label,
      call_count: callCount,
      cherry_pick_count: cherryPicks.length,
      classifications: raw.pattern_counts_by_classification || {},
      outcomes: raw.outcomes || {},
      ...corePos,
    });

    cherryPicks.forEach((ex, i) => {
      const seed = `${raw.codex_section}:${ex.call_id}:${ex.ts}:${i}`;
      const pos = softPosition(corePos, seed);
      softs.push({
        id: `soft:${ex.call_id}:${ex.ts}:${i}`,
        kind: "soft",
        parent_id: coreId,
        parent_codex_section: raw.codex_section,
        call_id: ex.call_id,
        ts: ex.ts,
        quote: ex.quote,
        classification: ex.classification,
        outcome: pickOutcomeForExample(raw.outcomes || {}, i),
        ...pos,
      });
      seenCallIds.add(ex.call_id);
    });

    raw.call_ids?.forEach((cid) => seenCallIds.add(cid));

    (raw.gray_matter_exemplars || []).forEach((g, i) => {
      const seed = `${raw.codex_section}:${g.call_id}:gray:${i}`;
      const pos = grayPosition(corePos, seed);
      grays.push({
        id: `gray:${g.call_id}:${raw.codex_section}:${i}`,
        kind: "gray",
        parent_id: coreId,
        parent_codex_section: raw.codex_section,
        call_id: g.call_id,
        rep_id: g.rep_id,
        ts: g.ts,
        why: g.why,
        ...pos,
      });
    });
  }

  return {
    cores,
    softs,
    grays,
    stats: {
      total_calls: seenCallIds.size,
      total_sections: cores.length,
      total_cherry_picks: softs.length,
      gray_matter_count: grays.length,
    },
    tiers: DOMAIN_TIERS,
  };
}
