import type { GraphNode, GraphEdge } from "./graph-types";

export function performIteration(
  nodes: GraphNode[],
  edges: GraphEdge[],
  dampingFactor: number
): { updatedNodes: GraphNode[]; maxDelta: number } {
  const N = nodes.length;
  if (N === 0) return { updatedNodes: [], maxDelta: 0 };

  const outDegree = new Map<string, number>();
  for (const node of nodes) outDegree.set(node.id, 0);
  for (const edge of edges)
    outDegree.set(edge.source, (outDegree.get(edge.source) ?? 0) + 1);

  const incoming = new Map<string, string[]>();
  for (const node of nodes) incoming.set(node.id, []);
  for (const edge of edges) incoming.get(edge.target)!.push(edge.source);

  const rankMap = new Map(nodes.map((n) => [n.id, n.rank]));

  let danglingSum = 0;
  for (const node of nodes) {
    if ((outDegree.get(node.id) ?? 0) === 0) danglingSum += node.rank;
  }

  let maxDelta = 0;
  const updatedNodes = nodes.map((node) => {
    let inSum = 0;
    for (const srcId of incoming.get(node.id) ?? []) {
      const srcRank = rankMap.get(srcId) ?? 0;
      const srcOut = outDegree.get(srcId) ?? 1;
      inSum += srcRank / srcOut;
    }

    const newRank =
      (1 - dampingFactor) / N +
      dampingFactor * (inSum + danglingSum / N);

    const delta = Math.abs(newRank - node.rank);
    if (delta > maxDelta) maxDelta = delta;

    return { ...node, prevRank: node.rank, rank: newRank };
  });

  return { updatedNodes, maxDelta };
}

export function initializeRanks(nodes: GraphNode[]): GraphNode[] {
  const N = nodes.length;
  if (N === 0) return [];
  const r = 1 / N;
  return nodes.map((node) => ({ ...node, rank: r, prevRank: r }));
}
