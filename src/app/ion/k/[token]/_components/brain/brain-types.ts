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
  // Effective outcome used for node coloring. For objections this is
  // typically `outcome`; populated by the adapter so the canvas doesn't
  // have to chase edges.
  effective_outcome: AnsweredByOutcome | null;
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
  effective_outcome: AnsweredByOutcome | null;
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
  // Type-specific payload. answered_by edges carry the encounter outcome
  // (worked / partial / failed) — useful for outcome-colored rendering.
  // similarity edges carry the cosine score.
  outcome?: AnsweredByOutcome | string;
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

// Outcome palette — drives event-node coloring so the win/partial/loss
// signal reads at any rotation. Same hues as the answered_by edge tints
// + the rest of the wiki/tree surfaces.
export const OUTCOME_COLORS: Record<AnsweredByOutcome, string> = {
  worked: "#34d399", // emerald
  partial: "#fbbf24", // amber
  failed: "#f87171", // red
};

export const OUTCOME_UNKNOWN_COLOR = "#94a3b8"; // slate gray

export const colorForOutcome = (
  outcome: AnsweredByOutcome | null | undefined
): string => (outcome && OUTCOME_COLORS[outcome]) || OUTCOME_UNKNOWN_COLOR;
