// Stewart-namespace API client. Sibling to ion-api.ts. Endpoints under
// /api/stewart/* shipped in backend Day 4-7. Composer outputs (training
// brief, coaching prep) and Atlas search use this client.

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://spenceros-production.up.railway.app";

// ─── Composer output (shared shape used by training-brief + coaching-prep) ──

export type ComposerCitation = {
  id?: string;
  // Citations expand later (call_id, event_id, verbatim refs). Keep loose
  // until backend enriches.
  [key: string]: unknown;
};

export type ComposerSection = {
  heading: string;
  body: string;
  citation_ids?: string[];
  citations?: ComposerCitation[];
};

export type ComposerOutputPayload = {
  intent: string; // "training_brief" | "coaching_prep" | etc.
  headline: string;
  sections: ComposerSection[];
  citations?: ComposerCitation[];
  model?: string;
  cost_usd?: number;
  elapsed_seconds?: number;
};

// ─── Training brief ─────────────────────────────────────────────────────────

export async function fetchTrainingBrief(
  token: string,
  repId: string
): Promise<ComposerOutputPayload> {
  const url = `${BASE_URL}/api/stewart/training-brief?rep_id=${encodeURIComponent(
    repId
  )}&token=${encodeURIComponent(token)}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`training-brief ${res.status}: ${body || res.statusText}`);
  }
  return res.json();
}

// ─── Coaching prep ──────────────────────────────────────────────────────────

export async function fetchCoachingPrep(
  token: string,
  callId: string,
  repId: string
): Promise<ComposerOutputPayload> {
  const url = `${BASE_URL}/api/stewart/coaching-prep?token=${encodeURIComponent(
    token
  )}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ call_id: callId, rep_id: repId }),
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`coaching-prep ${res.status}: ${body || res.statusText}`);
  }
  return res.json();
}

// ─── Wiki graph (call-event GraphRAG) ───────────────────────────────────────

export type WikiGraphNodeType = "call" | "objection_event" | "solution_event";
export type WikiGraphEdgeType = "containment" | "similarity";

export type WikiGraphNode = {
  id: string;
  type: WikiGraphNodeType;
  label: string;
  data: Record<string, unknown>; // shape varies by node type
  x: number;
  y: number;
};

export type WikiGraphEdge = {
  id: string;
  source: string;
  target: string;
  type: WikiGraphEdgeType;
  weight: number;
};

export type WikiGraphPayload = {
  nodes: WikiGraphNode[];
  edges: WikiGraphEdge[];
  stats?: Record<string, unknown>;
};

export async function fetchWikiGraph(
  token: string,
  limitPerEvent = 8
): Promise<WikiGraphPayload> {
  const url = `${BASE_URL}/api/stewart/wiki/graph?limit_per_event=${limitPerEvent}&token=${encodeURIComponent(
    token
  )}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`wiki/graph ${res.status}: ${body || res.statusText}`);
  }
  return res.json();
}

// ─── Brain demo graph (3D, bounded, system_owner-gated) ─────────────────────
// Matches the contract in stewart-v2-brain-3d-backend-brief.md. Backend ships
// pre-computed {x, y, z} positions, cluster_id directly on event nodes, and
// is_bridge flag on call nodes. wiki:brain:read scope required (auto-included
// on system_owner role + kind=demo tokens).

export type BrainDemoCallData = {
  call_id: string;
  duration_seconds: number | null;
  outcome: string | null;
  setter_id: string | null;
  setter_name: string | null;
  call_date: string | null;
  cluster_ids: string[];
  is_bridge: boolean;
};

export type BrainDemoEventData = {
  event_id: number;
  call_id: string;
  cluster_id: string | null;
  text: string;                  // PII-redacted view (or full when role allows)
  text_full?: string | null;     // full PII; only present for trusted roles
  start_seconds: number | null;
  end_seconds: number | null;
  outcome?: string | null;       // objection_event only
  is_canonical: boolean;
  variant_id: number | null;
  solution_type_id?: string | null;  // solution_event only
  why_it_works?: string | null;       // solution_event only
};

export type BrainDemoNode =
  | {
      id: string;
      type: "call";
      label: string;
      data: BrainDemoCallData;
      x: number;
      y: number;
      z: number;
    }
  | {
      id: string;
      type: "objection_event";
      label: string;
      data: BrainDemoEventData;
      x: number;
      y: number;
      z: number;
    }
  | {
      id: string;
      type: "solution_event";
      label: string;
      data: BrainDemoEventData;
      x: number;
      y: number;
      z: number;
    };

export type BrainDemoEdge = {
  id: string;
  source: string;
  target: string;
  type: "containment" | "similarity";
  weight: number;
  data?: { similarity?: number };
};

export type BrainGraphDemoPayload = {
  generated_at: string;
  tenant_id: string;
  cohort: string | null;
  layout_signature: string;
  layout_compute_ms: number;
  layout_cache: "hit" | "miss";
  nodes: BrainDemoNode[];
  edges: BrainDemoEdge[];
  total_calls: number;
  total_objection_events: number;
  total_solution_events: number;
  total_canonical_events: number;
  total_bridge_calls: number;
  total_recent_fill: number;
  stats?: {
    sticky_signature: string;
    last_event_added_at: string;
    similarity_threshold: number;
    target_node_count: number;
    actual_node_count: number;
    dropped_for_budget: number;
  };
};

export async function fetchBrainGraphDemo(
  token: string,
  options: {
    tenantId?: string;
    targetNodeCount?: number;
    similarityFloor?: number;
    limitPerEvent?: number;
  } = {}
): Promise<BrainGraphDemoPayload> {
  const params = new URLSearchParams({ token });
  if (options.tenantId) params.set("tenant_id", options.tenantId);
  if (options.targetNodeCount != null)
    params.set("target_node_count", String(options.targetNodeCount));
  if (options.similarityFloor != null)
    params.set("similarity_floor", String(options.similarityFloor));
  if (options.limitPerEvent != null)
    params.set("limit_per_event", String(options.limitPerEvent));
  const url = `${BASE_URL}/api/stewart/wiki/graph/demo?${params.toString()}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `wiki/graph/demo ${res.status}: ${body || res.statusText}`
    );
  }
  return res.json();
}
