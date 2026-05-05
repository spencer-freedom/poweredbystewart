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
