// Type contract for the call-event graph (Stewart's brain). Matches the
// shape of GET /api/stewart/wiki/graph (backend, Day 7). Pre-computed
// force-layout positions ship in the response: each node carries {x, y}.
//
// Per-edge weight 0-1: containment edges = 1.0; similarity edges =
// cosine score from pgvector. Frontend varies opacity / thickness by
// strength.

export type BrainNodeType = "call" | "objection" | "solution";
export type BrainEdgeType = "containment" | "similarity" | "answered_by";
export type AnsweredByOutcome = "worked" | "partial" | "failed";

export type BrainCallNode = {
  id: string;
  type: "call";
  call_id: string;
  setter_id: string | null;
  setter_name: string | null;
  call_date: string | null; // ISO
  outcome: string | null; // "booked" | "callback" | etc.
  // Bucket of `outcome` that drives node color (worked/partial/failed/
  // unknown). Populated by the adapter so the canvas reads one field.
  effective_outcome: OutcomeBucket;
  duration_seconds: number | null;
  cluster_ids: string[]; // clusters this call touched (1+ → bridge)
  is_bridge: boolean; // pre-computed by backend; legacy adapter falls back to cluster_ids.length > 1
  // Pre-computed layout coords from backend.
  x: number;
  y: number;
  z: number;
};

export type BrainObjectionNode = {
  id: string;
  type: "objection";
  call_id: string;
  cluster_id: string;
  verbatim: string;
  start_seconds: number | null;
  end_seconds: number | null;
  outcome: string | null; // "worked" | "partial" | "failed" | etc.
  effective_outcome: OutcomeBucket;
  is_canonical: boolean;
  x: number;
  y: number;
  z: number;
};

export type BrainSolutionNode = {
  id: string;
  type: "solution";
  call_id: string;
  cluster_id: string;
  verbatim: string;
  why_it_works: string | null;
  start_seconds: number | null;
  end_seconds: number | null;
  is_canonical: boolean;
  // Best incoming answered_by outcome — what happened when a rep used
  // this solution. Populated by the adapter from edge metadata.
  effective_outcome: OutcomeBucket;
  // Top-3 winners get a size bump per the visual encoding pass.
  is_top_winner: boolean;
  x: number;
  y: number;
  z: number;
};

export type BrainNode = BrainCallNode | BrainObjectionNode | BrainSolutionNode;

export type BrainEdge = {
  source: string;
  target: string;
  type: BrainEdgeType;
  weight: number; // 0-1
  // answered_by edges carry the bucketed outcome (worked/partial/failed/
  // unknown) for outcome-colored rendering. similarity edges carry the
  // cosine score for opacity scaling.
  outcome?: OutcomeBucket;
  similarity?: number;
};

export type BrainGraphPayload = {
  generated_at: string;
  cohort: string;
  nodes: BrainNode[];
  edges: BrainEdge[];
  // Total counts even if pagination kicks in later.
  total_calls: number;
  total_objections: number;
  total_solutions: number;
};

// Cluster colors — same categorical palette as the rest of the wiki/tree
// surfaces so the visual signal stays consistent.
export const CLUSTER_COLORS: Record<string, string> = {
  scheduling: "#a78bfa",
  roof_concerns: "#fbbf24",
  spouse_decision_maker: "#f472b6",
  qualification: "#fb7185",
  price_cost: "#34d399",
  appointment_format: "#60a5fa",
  timing_not_ready: "#facc15",
  current_provider_competitor: "#22d3ee",
};

export const CLUSTER_DEFAULT_COLOR = "#94a3b8";

export const colorForCluster = (clusterId: string | null | undefined): string =>
  (clusterId && CLUSTER_COLORS[clusterId]) || CLUSTER_DEFAULT_COLOR;

// ETHEREAL outcome palette (locked 2026-05-05). Each bucket carries a
// luminous "core" (used as emissive) and a softer "shell" (used as base
// color) so spheres glow from within against the cosmic background. Tesla
// ether aesthetic — plasma / aurora / bioluminescence, not industrial UI.
export type OutcomeBucket = AnsweredByOutcome | "unknown";

export const OUTCOME_PALETTE: Record<
  OutcomeBucket,
  { core: string; shell: string; emissive: number }
> = {
  // Emissive values tuned 2026-05-05 after bloom over-blew at zoom-in.
  // Bloom adds its own halo over the hot pixels; the material itself
  // only needs enough emissive to clear the bloom threshold (~0.6).
  worked: { core: "#5EEAD4", shell: "#6EE7B7", emissive: 0.45 },
  partial: { core: "#FBBF24", shell: "#FCD34D", emissive: 0.4 },
  failed: { core: "#FB7185", shell: "#F9A8D4", emissive: 0.42 },
  unknown: { core: "#CBD5E1", shell: "#E2E8F0", emissive: 0.15 },
};

// Single-color helpers for places that need a flat hex (legend, edges).
export const OUTCOME_COLORS: Record<OutcomeBucket, string> = {
  worked: "#34D399",
  partial: "#FBBF24",
  failed: "#F87171",
  unknown: "#9CA3AF",
};

export const colorForOutcome = (outcome: OutcomeBucket | null | undefined): string =>
  (outcome && OUTCOME_COLORS[outcome]) || OUTCOME_COLORS.unknown;

export const paletteForOutcome = (outcome: OutcomeBucket | null | undefined) =>
  (outcome && OUTCOME_PALETTE[outcome]) || OUTCOME_PALETTE.unknown;

// Backend ships objection outcomes that aren't in the worked/partial/failed
// trio. Bucket them into the visual palette so the encoding stays clean:
//   topic_switched → partial (objection deferred — neither resolved nor lost)
//   walked_back    → failed  (rep retreated under pressure)
export function eventOutcomeBucket(
  outcome: string | null | undefined
): OutcomeBucket {
  if (outcome === "worked") return "worked";
  if (outcome === "failed" || outcome === "walked_back") return "failed";
  if (outcome === "partial" || outcome === "topic_switched") return "partial";
  return "unknown";
}

// Call-level outcome buckets per the brief. Win signals (booked / appt
// set / transferred) → worked; lost signals → failed; callback or spouse-
// gate → partial; nulls / "unknown" → unknown.
export function callOutcomeBucket(
  outcome: string | null | undefined
): OutcomeBucket {
  if (
    outcome === "booked" ||
    outcome === "tentative_appointment" ||
    outcome === "transferred_to_closer"
  )
    return "worked";
  if (
    outcome === "declined" ||
    outcome === "no_interest" ||
    outcome === "unqualified"
  )
    return "failed";
  if (outcome === "callback" || outcome === "spouse_not_present") return "partial";
  return "unknown";
}
