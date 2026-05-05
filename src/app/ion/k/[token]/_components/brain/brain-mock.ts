// Mock 80-node brain graph payload for prototyping while backend builds
// the real /api/stewart/wiki/graph endpoint. Positions are pre-laid via
// a deterministic placement that loosely mimics what d3-force will give
// us — clusters of objection/solution events orbiting their parent calls,
// similar-cluster events drawn toward each other.
//
// Once the real endpoint ships, this file goes away (or stays as a test
// fixture). brain-canvas.tsx switches its source automatically.

import type {
  BrainCallNode,
  BrainEdge,
  BrainGraphPayload,
  BrainObjectionNode,
  BrainSolutionNode,
} from "./brain-types";

const CLUSTERS = [
  "scheduling",
  "roof_concerns",
  "spouse_decision_maker",
  "qualification",
  "price_cost",
  "appointment_format",
  "timing_not_ready",
  "current_provider_competitor",
] as const;

const SETTERS = [
  { id: "rep_alex", name: "Alex Rivera" },
  { id: "rep_marcus", name: "Marcus Bell" },
  { id: "rep_priya", name: "Priya Shah" },
  { id: "rep_joel", name: "Joel Carter" },
  { id: "rep_sam", name: "Sam Wu" },
];

const OUTCOMES = ["worked", "partial", "failed"] as const;
const CALL_OUTCOMES = ["booked", "callback", "not_interested", "transferred"] as const;

const SAMPLE_OBJECTIONS: Record<string, string[]> = {
  scheduling: [
    "Can you do something next week instead?",
    "I'm not sure I'll be around tomorrow.",
    "What about evenings?",
  ],
  roof_concerns: [
    "We just put a new roof on a couple years ago.",
    "Our roof is older — would that matter?",
  ],
  spouse_decision_maker: [
    "I'd need to talk to my wife first.",
    "My husband handles those decisions.",
  ],
  qualification: [
    "What kind of credit do we need for that?",
    "We had a bankruptcy a few years ago.",
  ],
  price_cost: [
    "How much is it going to cost upfront?",
    "I just want to know what it'll cost.",
  ],
  appointment_format: [
    "Can we just do this over the phone?",
    "Why does it have to be in-person?",
  ],
  timing_not_ready: [
    "Maybe in the spring.",
    "We're not ready to do anything yet.",
  ],
  current_provider_competitor: [
    "We already have solar.",
    "We just signed with another company.",
  ],
};

const SAMPLE_SOLUTIONS: Record<string, string[]> = {
  scheduling: [
    "Yes. So we could do Friday, or we could do a seven or 8PM on Tuesday.",
    "I have Tuesday at 4 or Thursday at 11.",
  ],
  roof_concerns: [
    "Our install team checks during the survey — if it needs work, no cost or commitment lost.",
  ],
  spouse_decision_maker: [
    "Totally — what time tonight or tomorrow works for both of you?",
  ],
  qualification: [
    "We probably won't be able to help until your score is around 640, 650 — but I can call you back in a couple months.",
  ],
  price_cost: [
    "Most folks pay nothing upfront — it's structured to swap your bill.",
  ],
  appointment_format: [
    "Most people end up with questions when they see the actual numbers — that's why we walk through it together.",
  ],
  timing_not_ready: [
    "Spring's perfect — what we'll do is lock the rate now and schedule the install for then.",
  ],
  current_provider_competitor: [
    "Got it — we're not pushy about competing — would it help if I just sent over a comparison sheet?",
  ],
};

let _id = 0;
const nextId = (prefix: string) => `${prefix}_${++_id}`;

function rand<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function jitter(amt: number) {
  return (Math.random() - 0.5) * amt;
}

export function buildMockGraph(): BrainGraphPayload {
  _id = 0;

  const calls: BrainCallNode[] = [];
  const objections: BrainObjectionNode[] = [];
  const solutions: BrainSolutionNode[] = [];
  const edges: BrainEdge[] = [];

  // 8 clusters → place call hubs in a wide ring; events orbit them
  const ringR = 600;
  const callsPerCluster = 2; // ~16 calls
  const bridgeCallCount = 4;

  // Per-cluster anchor coords
  const clusterAnchor: Record<string, { x: number; y: number }> = {};
  CLUSTERS.forEach((cid, i) => {
    const angle = (i / CLUSTERS.length) * Math.PI * 2;
    clusterAnchor[cid] = {
      x: Math.cos(angle) * ringR,
      y: Math.sin(angle) * ringR,
    };
  });

  // Single-cluster calls
  for (const cid of CLUSTERS) {
    for (let n = 0; n < callsPerCluster; n++) {
      const setter = rand(SETTERS);
      const callId = nextId("call");
      // No pre-computed positions in the mock — frontend simulation
      // organizes naturally. Backend production payload will ship real
      // positions.
      const cx = 0;
      const cy = 0;
      calls.push({
        id: callId,
        type: "call",
        call_id: callId.replace("call_", "10000"),
        setter_id: setter.id,
        setter_name: setter.name,
        call_date: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 30).toISOString(),
        outcome: rand(CALL_OUTCOMES),
        duration_seconds: 200 + Math.floor(Math.random() * 600),
        cluster_ids: [cid],
        is_bridge: false,
        x: cx,
        y: cy,
        z: 0,
      });

      // 2-3 objection events per call, all in this call's cluster
      const nObj = 2 + Math.floor(Math.random() * 2);
      for (let i = 0; i < nObj; i++) {
        const oid = nextId("obj");
        const verbs = SAMPLE_OBJECTIONS[cid];
        objections.push({
          id: oid,
          type: "objection",
          call_id: callId,
          cluster_id: cid,
          verbatim: verbs[i % verbs.length],
          start_seconds: 100 + i * 60,
          end_seconds: 110 + i * 60,
          outcome: rand(OUTCOMES),
          is_canonical: Math.random() < 0.15,
          x: cx + jitter(80),
          y: cy + jitter(80),
          z: jitter(80),
        });
        edges.push({
          source: callId,
          target: oid,
          type: "containment",
          weight: 1.0,
        });
      }

      // 1-2 solution events per call
      const nSol = 1 + Math.floor(Math.random() * 2);
      for (let i = 0; i < nSol; i++) {
        const sid = nextId("sol");
        const verbs = SAMPLE_SOLUTIONS[cid];
        solutions.push({
          id: sid,
          type: "solution",
          call_id: callId,
          cluster_id: cid,
          verbatim: verbs[i % verbs.length],
          why_it_works:
            "Direct, specific, low-friction — gives the prospect an easy yes path.",
          start_seconds: 150 + i * 60,
          end_seconds: 165 + i * 60,
          is_canonical: Math.random() < 0.2,
          x: cx + jitter(80),
          y: cy + jitter(80),
          z: jitter(80),
        });
        edges.push({
          source: callId,
          target: sid,
          type: "containment",
          weight: 1.0,
        });
      }
    }
  }

  // Bridge calls — each touches 2-3 clusters. These get the violet halo
  // signal in the rendering.
  for (let b = 0; b < bridgeCallCount; b++) {
    const setter = rand(SETTERS);
    const callId = nextId("call");
    const touchedClusters = [...CLUSTERS]
      .sort(() => Math.random() - 0.5)
      .slice(0, 2 + Math.floor(Math.random() * 2));
    const cx = 0;
    const cy = 0;
    calls.push({
      id: callId,
      type: "call",
      call_id: callId.replace("call_", "20000"),
      setter_id: setter.id,
      setter_name: setter.name,
      call_date: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 30).toISOString(),
      outcome: rand(CALL_OUTCOMES),
      duration_seconds: 400 + Math.floor(Math.random() * 600),
      cluster_ids: touchedClusters,
      is_bridge: true,
      x: cx,
      y: cy,
      z: 0,
    });

    for (const cid of touchedClusters) {
      const oid = nextId("obj");
      objections.push({
        id: oid,
        type: "objection",
        call_id: callId,
        cluster_id: cid,
        verbatim: rand(SAMPLE_OBJECTIONS[cid]),
        start_seconds: 100 + Math.random() * 200,
        end_seconds: 110 + Math.random() * 200,
        outcome: rand(OUTCOMES),
        is_canonical: false,
        x: cx + (clusterAnchor[cid].x - cx) * 0.4 + jitter(40),
        y: cy + (clusterAnchor[cid].y - cy) * 0.4 + jitter(40),
        z: jitter(40),
      });
      edges.push({
        source: callId,
        target: oid,
        type: "containment",
        weight: 1.0,
      });

      const sid = nextId("sol");
      solutions.push({
        id: sid,
        type: "solution",
        call_id: callId,
        cluster_id: cid,
        verbatim: rand(SAMPLE_SOLUTIONS[cid]),
        why_it_works: "Pivots smoothly to the next concern.",
        start_seconds: 200 + Math.random() * 200,
        end_seconds: 215 + Math.random() * 200,
        is_canonical: Math.random() < 0.3,
        x: cx + (clusterAnchor[cid].x - cx) * 0.4 + jitter(40),
        y: cy + (clusterAnchor[cid].y - cy) * 0.4 + jitter(40),
        z: jitter(40),
      });
      edges.push({
        source: callId,
        target: sid,
        type: "containment",
        weight: 1.0,
      });
    }
  }

  // Similarity edges: link events of the same cluster across different
  // calls. ~5 per event, weighted by mock cosine score 0.65-0.95.
  const eventsByCluster = new Map<string, (BrainObjectionNode | BrainSolutionNode)[]>();
  for (const e of [...objections, ...solutions]) {
    const arr = eventsByCluster.get(e.cluster_id) || [];
    arr.push(e);
    eventsByCluster.set(e.cluster_id, arr);
  }
  for (const [, events] of eventsByCluster) {
    for (const a of events) {
      // Connect to up to 3 same-cluster peers from different calls
      const peers = events
        .filter((b) => b.id !== a.id && b.call_id !== a.call_id && b.type === a.type)
        .slice(0, 3);
      for (const b of peers) {
        edges.push({
          source: a.id,
          target: b.id,
          type: "similarity",
          weight: 0.65 + Math.random() * 0.3,
        });
      }
    }
  }

  return {
    generated_at: new Date().toISOString(),
    cohort: "kenny_initial_50",
    nodes: [...calls, ...objections, ...solutions],
    edges,
    total_calls: calls.length,
    total_objections: objections.length,
    total_solutions: solutions.length,
  };
}
