// Adapter — converts the real /api/stewart/wiki/graph response shape
// into the BrainGraphPayload shape the brain canvas already understands.
// Keeps the canvas + orchestrator stable across the mock→real swap.
//
// Shape differences:
//   • Real type strings have _event suffix → strip
//   • Field data lives under .data on real nodes → flatten
//   • Real objection events have data.text not data.verbatim → rename
//   • cluster_id isn't on real event nodes today → derive from
//     solution_type_id (when present) or null fallback
//   • call.cluster_ids not on real call nodes today → compute from
//     events touching that call

import type {
  BrainCallNode,
  BrainEdge,
  BrainGraphPayload,
  BrainObjectionNode,
  BrainSolutionNode,
  OutcomeBucket,
} from "./brain-types";
import { callOutcomeBucket, eventOutcomeBucket } from "./brain-types";
import type { BrainGraphDemoPayload, WikiGraphPayload } from "@/lib/stewart-api";

const OUTCOME_RANK: Record<OutcomeBucket, number> = {
  worked: 4,
  partial: 3,
  failed: 2,
  unknown: 1,
};

type RealCallData = {
  call_id?: string;
  duration_seconds?: number | null;
  outcome?: string | null;
  setter_id?: string | null;
  setter_name?: string | null;
  call_date?: string | null;
  // New (shipped by /wiki/graph/demo): backend pre-computes these
  cluster_ids?: string[];
  is_bridge?: boolean;
};

type RealEventData = {
  event_id?: number;
  call_id?: string;
  variant_id?: number;
  encounter_id?: number;
  text?: string;
  text_full?: string | null;
  cluster_id?: string | null;
  objection_type_id?: string | null;
  solution_type_id?: string | null;
  start_seconds?: number | null;
  end_seconds?: number | null;
  is_canonical?: boolean;
  outcome?: string | null;
  why_it_works?: string | null;
  classifier_confidence?: number | null;
  reviewer_confidence?: number | null;
};

export function adaptWikiGraph(
  real: WikiGraphPayload | BrainGraphDemoPayload
): BrainGraphPayload {
  // Pass 1: index events by call_id so we can populate cluster_ids on
  // each call node + count clusters per call (bridge call signal).
  const eventsByCall = new Map<string, string[]>();
  for (const n of real.nodes) {
    if (n.type === "objection_event" || n.type === "solution_event") {
      const d = n.data as RealEventData;
      const cid = clusterFor(n.type, d);
      if (cid && d.call_id) {
        const arr = eventsByCall.get(d.call_id) || [];
        if (!arr.includes(cid)) arr.push(cid);
        eventsByCall.set(d.call_id, arr);
      }
    }
  }

  // Pass 1b: derive each solution event's effective outcome bucket from
  // incoming answered_by edges, plus a "worked count" per solution so we
  // can crown the top-3 winners with a size bump. A solution can be tried
  // on multiple objections; we take the best bucket (worked > partial >
  // failed > unknown) so its sphere reflects its overall track record.
  const solutionOutcome = new Map<string, OutcomeBucket>();
  const solutionWorkedCount = new Map<string, number>();
  for (const e of real.edges) {
    if (e.type !== "answered_by") continue;
    const data = (e as { data?: { outcome?: string } }).data;
    const bucket = eventOutcomeBucket(data?.outcome);
    if (bucket === "unknown") continue;
    const prev = solutionOutcome.get(e.target);
    if (!prev || OUTCOME_RANK[bucket] > OUTCOME_RANK[prev]) {
      solutionOutcome.set(e.target, bucket);
    }
    if (bucket === "worked") {
      solutionWorkedCount.set(
        e.target,
        (solutionWorkedCount.get(e.target) ?? 0) + 1
      );
    }
  }
  // Top-3 solutions by worked-edge count → is_top_winner
  const topWinners = new Set(
    [...solutionWorkedCount.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([id]) => id)
  );

  const calls: BrainCallNode[] = [];
  const objections: BrainObjectionNode[] = [];
  const solutions: BrainSolutionNode[] = [];

  for (const n of real.nodes) {
    // 3D z coord — present on /wiki/graph/demo nodes; legacy /wiki/graph
    // nodes are 2D so default to 0.
    const z = (n as { z?: number }).z ?? 0;
    if (n.type === "call") {
      const d = n.data as RealCallData;
      const callId = d.call_id ?? n.label;
      // Prefer backend-computed cluster_ids when shipped (new /wiki/graph/demo
      // endpoint); fall back to the local computation from event scanning
      // (existing /wiki/graph 2D endpoint).
      const cluster_ids =
        d.cluster_ids && d.cluster_ids.length > 0
          ? d.cluster_ids
          : eventsByCall.get(callId) ?? [];
      const is_bridge =
        typeof d.is_bridge === "boolean" ? d.is_bridge : cluster_ids.length > 1;
      calls.push({
        id: n.id,
        type: "call",
        call_id: callId,
        setter_id: d.setter_id ?? null,
        setter_name: d.setter_name ?? d.setter_id ?? null,
        call_date: d.call_date ?? null,
        outcome: d.outcome ?? null,
        effective_outcome: callOutcomeBucket(d.outcome),
        duration_seconds: d.duration_seconds ?? null,
        cluster_ids,
        is_bridge,
        x: n.x,
        y: n.y,
        z,
      });
    } else if (n.type === "objection_event") {
      const d = n.data as RealEventData;
      objections.push({
        id: n.id,
        type: "objection",
        call_id: d.call_id ?? "",
        cluster_id: clusterFor("objection_event", d) ?? "unknown",
        verbatim: d.text_full ?? d.text ?? n.label,
        start_seconds: d.start_seconds ?? null,
        end_seconds: d.end_seconds ?? null,
        outcome: d.outcome ?? null,
        effective_outcome: eventOutcomeBucket(d.outcome),
        is_canonical: !!d.is_canonical,
        x: n.x,
        y: n.y,
        z,
      });
    } else if (n.type === "solution_event") {
      const d = n.data as RealEventData;
      solutions.push({
        id: n.id,
        type: "solution",
        call_id: d.call_id ?? "",
        cluster_id: clusterFor("solution_event", d) ?? "unknown",
        verbatim: d.text_full ?? d.text ?? n.label,
        why_it_works: d.why_it_works ?? null,
        start_seconds: d.start_seconds ?? null,
        end_seconds: d.end_seconds ?? null,
        is_canonical: !!d.is_canonical,
        effective_outcome: solutionOutcome.get(n.id) ?? "unknown",
        is_top_winner: topWinners.has(n.id),
        x: n.x,
        y: n.y,
        z,
      });
    }
  }

  // Edges: pass through type/weight. For answered_by edges, normalize
  // outcome strings into the visual bucket (topic_switched → partial,
  // walked_back → failed) so the canvas renders one consistent palette.
  // For similarity edges, carry the cosine score for opacity scaling.
  const edges: BrainEdge[] = real.edges.map((e) => {
    const data = (e as { data?: { outcome?: string; similarity?: number } }).data;
    const bucket =
      e.type === "answered_by" ? eventOutcomeBucket(data?.outcome) : null;
    return {
      source: e.source,
      target: e.target,
      type: e.type as BrainEdge["type"],
      weight: e.weight,
      ...(bucket ? { outcome: bucket } : {}),
      ...(data?.similarity != null ? { similarity: data.similarity } : {}),
    };
  });

  return {
    generated_at: new Date().toISOString(),
    cohort: "production",
    nodes: [...calls, ...objections, ...solutions],
    edges,
    total_calls: calls.length,
    total_objections: objections.length,
    total_solutions: solutions.length,
  };
}

// Connected-component sizes via union-find. Returns Map<nodeId, size>.
// Used by the canvas to de-emphasize edges in small components (<4 nodes)
// instead of dropping them — the barbell loudness dissolves while the
// nodes stay alive in the galaxy.
export function computeComponentSizes(
  nodes: Array<{ id: string }>,
  edges: BrainEdge[]
): Map<string, number> {
  const parent = new Map<string, string>();
  const find = (a: string): string => {
    let cur = a;
    while (parent.get(cur) !== cur) {
      const p = parent.get(cur)!;
      parent.set(cur, parent.get(p)!);
      cur = parent.get(cur)!;
    }
    return cur;
  };
  const union = (a: string, b: string) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent.set(ra, rb);
  };
  for (const n of nodes) parent.set(n.id, n.id);
  for (const e of edges) {
    if (parent.has(e.source) && parent.has(e.target)) union(e.source, e.target);
  }
  const sizeByRoot = new Map<string, number>();
  for (const n of nodes) {
    const r = find(n.id);
    sizeByRoot.set(r, (sizeByRoot.get(r) ?? 0) + 1);
  }
  const out = new Map<string, number>();
  for (const n of nodes) out.set(n.id, sizeByRoot.get(find(n.id)) ?? 1);
  return out;
}

// Best-effort cluster derivation. When backend enriches event nodes with
// cluster_id directly, this gets simpler.
function clusterFor(
  type: "objection_event" | "solution_event",
  d: RealEventData
): string | null {
  if (d.cluster_id) return d.cluster_id;
  if (type === "solution_event" && d.solution_type_id) return d.solution_type_id;
  if (type === "objection_event" && d.objection_type_id) return d.objection_type_id;
  return null;
}
