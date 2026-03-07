import type { GraphNode } from "./graph-types";

const MIN_R = 12;
const MAX_R = 32;

export function getNodeRadius(node: GraphNode, allNodes: GraphNode[]): number {
  if (allNodes.length === 0) return MIN_R;
  const maxRank = Math.max(...allNodes.map((n) => n.rank), 0.001);
  return MIN_R + (node.rank / maxRank) * (MAX_R - MIN_R);
}

export function findNodeAt(
  x: number,
  y: number,
  nodes: GraphNode[]
): GraphNode | null {
  for (let i = nodes.length - 1; i >= 0; i--) {
    const n = nodes[i];
    const r = getNodeRadius(n, nodes);
    const dx = x - n.x, dy = y - n.y;
    if (dx * dx + dy * dy <= (r + 4) * (r + 4)) return n;
  }
  return null;
}
