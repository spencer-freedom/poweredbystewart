// d3-force layout pass for the brain wiki. Runs the simulation
// synchronously to convergence, then writes node.position from the
// simulation's x/y. React Flow renders the result statically; users
// pan/zoom but the layout doesn't re-run as they interact (cheap,
// predictable, and avoids the React-state churn of a live ticker).

import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from "d3-force";
import type { Edge, Node } from "reactflow";
import type { BrainNodeData } from "./wiki-brain-transform";

// Node visual radius (used for collision + sizing). Cluster nodes scale
// with frequency. Tracks medium. Calls small.
function nodeRadius(d: BrainNodeData): number {
  if (d.kind === "brain-cluster") {
    return 36 + Math.min(24, d.frequency * 1.5);
  }
  if (d.kind === "brain-track") return 26;
  return 14 + Math.min(10, d.cluster_count * 4);
}

type SimNode = SimulationNodeDatum & {
  id: string;
  data: BrainNodeData;
};

type SimLink = SimulationLinkDatum<SimNode>;

export function brainLayout(
  nodes: Node<BrainNodeData>[],
  edges: Edge[]
): Node<BrainNodeData>[] {
  const simNodes: SimNode[] = nodes.map((n) => ({
    id: n.id,
    data: n.data,
  }));
  const byId = new Map(simNodes.map((n) => [n.id, n]));
  const simLinks: SimLink[] = [];
  for (const e of edges) {
    const s = byId.get(e.source);
    const t = byId.get(e.target);
    if (s && t) simLinks.push({ source: s, target: t });
  }

  const sim = forceSimulation<SimNode>(simNodes)
    .force(
      "link",
      forceLink<SimNode, SimLink>(simLinks)
        .id((n) => n.id)
        .distance((l) => {
          const sd = (l.source as SimNode).data;
          const td = (l.target as SimNode).data;
          // Cluster→track: medium pull
          if (sd.kind === "brain-cluster" || td.kind === "brain-cluster")
            return 90;
          // Track→call: shorter; calls hug their tracks
          return 60;
        })
        .strength(0.3)
    )
    .force(
      "charge",
      forceManyBody<SimNode>().strength((n) => {
        if (n.data.kind === "brain-cluster") return -800;
        if (n.data.kind === "brain-track") return -200;
        return -80;
      })
    )
    .force(
      "collide",
      forceCollide<SimNode>((n) => nodeRadius(n.data) + 6).strength(0.9)
    )
    .force("center", forceCenter(0, 0).strength(0.05))
    .stop();

  // Run to convergence — 320 ticks is generous for ~70 nodes.
  for (let i = 0; i < 320; i++) sim.tick();

  return nodes.map((n) => {
    const sn = byId.get(n.id);
    const r = nodeRadius(n.data);
    return {
      ...n,
      position: { x: (sn?.x ?? 0) - r, y: (sn?.y ?? 0) - r },
      style: { ...(n.style || {}), width: r * 2, height: r * 2 },
    };
  });
}
