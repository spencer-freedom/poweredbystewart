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
} from "./brain-types";
import type { WikiGraphPayload } from "@/lib/stewart-api";

type RealCallData = {
  call_id?: string;
  duration_seconds?: number | null;
  outcome?: string | null;
  setter_id?: string | null;
  setter_name?: string | null;
  call_date?: string | null;
};

type RealEventData = {
  event_id?: number;
  call_id?: string;
  variant_id?: number;
  encounter_id?: number;
  text?: string;
  cluster_id?: string | null;
  objection_type_id?: string | null;
  solution_type_id?: string | null;
  start_seconds?: number | null;
  end_seconds?: number | null;
  is_canonical?: boolean;
  outcome?: string | null;
  classifier_confidence?: number | null;
  reviewer_confidence?: number | null;
};

export function adaptWikiGraph(real: WikiGraphPayload): BrainGraphPayload {
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

  const calls: BrainCallNode[] = [];
  const objections: BrainObjectionNode[] = [];
  const solutions: BrainSolutionNode[] = [];

  for (const n of real.nodes) {
    if (n.type === "call") {
      const d = n.data as RealCallData;
      const callId = d.call_id ?? n.label;
      calls.push({
        id: n.id,
        type: "call",
        call_id: callId,
        setter_id: d.setter_id ?? null,
        setter_name: d.setter_name ?? d.setter_id ?? null,
        call_date: d.call_date ?? null,
        outcome: d.outcome ?? null,
        duration_seconds: d.duration_seconds ?? null,
        cluster_ids: eventsByCall.get(callId) ?? [],
        x: n.x,
        y: n.y,
      });
    } else if (n.type === "objection_event") {
      const d = n.data as RealEventData;
      objections.push({
        id: n.id,
        type: "objection",
        call_id: d.call_id ?? "",
        cluster_id: clusterFor("objection_event", d) ?? "unknown",
        verbatim: d.text ?? n.label,
        start_seconds: d.start_seconds ?? null,
        end_seconds: d.end_seconds ?? null,
        outcome: d.outcome ?? null,
        is_canonical: !!d.is_canonical,
        x: n.x,
        y: n.y,
      });
    } else if (n.type === "solution_event") {
      const d = n.data as RealEventData;
      solutions.push({
        id: n.id,
        type: "solution",
        call_id: d.call_id ?? "",
        cluster_id: clusterFor("solution_event", d) ?? "unknown",
        verbatim: d.text ?? n.label,
        why_it_works: null,
        start_seconds: d.start_seconds ?? null,
        end_seconds: d.end_seconds ?? null,
        is_canonical: !!d.is_canonical,
        x: n.x,
        y: n.y,
      });
    }
  }

  // Edges already have the shape the canvas expects (source/target/type/weight).
  const edges: BrainEdge[] = real.edges.map((e) => ({
    source: e.source,
    target: e.target,
    type: e.type,
    weight: e.weight,
  }));

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
