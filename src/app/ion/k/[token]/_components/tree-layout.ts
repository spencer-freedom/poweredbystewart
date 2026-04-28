import dagre from "dagre";
import type { Edge, Node } from "reactflow";
import type { TreeNodeData } from "./tree-transform";

const NODE_W = {
  root: 300,
  cluster: 210,
  track: 250,
};
const NODE_H = {
  root: 92,
  cluster: 108,
  track: 136,
};

export function layoutGraph(
  nodes: Node<TreeNodeData>[],
  edges: Edge[]
): Node<TreeNodeData>[] {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: "TB", nodesep: 24, ranksep: 70, marginx: 16, marginy: 16 });
  g.setDefaultEdgeLabel(() => ({}));

  for (const n of nodes) {
    const t = (n.type || "default") as keyof typeof NODE_W;
    g.setNode(n.id, {
      width: NODE_W[t] ?? 200,
      height: NODE_H[t] ?? 80,
    });
  }
  // Only feed hierarchical edges into dagre; transition edges (track→track within
  // a cluster) confuse the rank assignment if included.
  for (const e of edges) {
    if (e.id.startsWith("e-tr-")) continue;
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
