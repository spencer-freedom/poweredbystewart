import dagre from "dagre";
import type { Edge, Node } from "reactflow";
import type { TreeNodeData } from "./tree-transform";

const NODE_W = {
  root: 240,
  cluster: 240,
  track: 290,
  losing: 250,
};
const NODE_H = {
  root: 96,
  cluster: 96,
  track: 124,
  losing: 92,
};

export function layoutGraph(
  nodes: Node<TreeNodeData>[],
  edges: Edge[]
): Node<TreeNodeData>[] {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: "LR", nodesep: 18, ranksep: 90, marginx: 16, marginy: 16 });
  g.setDefaultEdgeLabel(() => ({}));

  for (const n of nodes) {
    const t = (n.type || "default") as keyof typeof NODE_W;
    g.setNode(n.id, {
      width: NODE_W[t] ?? 200,
      height: NODE_H[t] ?? 80,
    });
  }
  // Only feed hierarchical edges into dagre. Transition edges (track→track
  // within a cluster) and wiki cross-call edges (track→track across clusters)
  // both create cycles that confuse rank assignment — dagre lays out the
  // hierarchy and these edges render on top as visual annotations.
  for (const e of edges) {
    if (e.id.startsWith("e-tr-")) continue;
    if (e.id.startsWith("wiki-call-")) continue;
    g.setEdge(e.source, e.target);
  }

  dagre.layout(g);

  return nodes.map((n) => {
    const pos = g.node(n.id);
    const t = (n.type || "default") as keyof typeof NODE_W;
    const w = NODE_W[t] ?? 200;
    const h = NODE_H[t] ?? 80;
    return {
      ...n,
      position: { x: pos.x - w / 2, y: pos.y - h / 2 },
      style: { ...(n.style || {}), width: w, height: h },
    };
  });
}
