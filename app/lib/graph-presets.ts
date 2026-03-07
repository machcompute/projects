import type { Graph, GraphNode, GraphEdge } from "./graph-types";

function node(id: string, label: string, x: number, y: number): GraphNode {
  return { id, label, x, y, vx: 0, vy: 0, rank: 0, prevRank: 0, pinned: false };
}

export interface GraphPreset {
  name: string;
  description: string;
  build: (w: number, h: number) => Graph;
}

export const presets: GraphPreset[] = [
  {
    name: "Simple Chain",
    description: "A linear chain — rank flows one direction",
    build(w, h) {
      const cx = w / 2, cy = h / 2, s = 140;
      return {
        nodes: [
          node("A", "A", cx - s * 1.5, cy),
          node("B", "B", cx - s * 0.5, cy),
          node("C", "C", cx + s * 0.5, cy),
          node("D", "D", cx + s * 1.5, cy),
        ],
        edges: [
          { source: "A", target: "B" },
          { source: "B", target: "C" },
          { source: "C", target: "D" },
        ],
      };
    },
  },
  {
    name: "Star Network",
    description: "All outer nodes point to a central hub",
    build(w, h) {
      const cx = w / 2, cy = h / 2, r = 180, n = 6;
      const outer: GraphNode[] = [];
      const edges: GraphEdge[] = [];
      for (let i = 0; i < n; i++) {
        const a = (2 * Math.PI * i) / n - Math.PI / 2;
        const id = String.fromCharCode(65 + i);
        outer.push(node(id, id, cx + r * Math.cos(a), cy + r * Math.sin(a)));
        edges.push({ source: id, target: "Hub" });
      }
      return { nodes: [node("Hub", "Hub", cx, cy), ...outer], edges };
    },
  },
  {
    name: "Web Ring",
    description: "Circular chain — each page links to the next",
    build(w, h) {
      const cx = w / 2, cy = h / 2, r = 180, count = 6;
      const nodes: GraphNode[] = [];
      const edges: GraphEdge[] = [];
      for (let i = 0; i < count; i++) {
        const a = (2 * Math.PI * i) / count - Math.PI / 2;
        const id = String.fromCharCode(65 + i);
        nodes.push(node(id, id, cx + r * Math.cos(a), cy + r * Math.sin(a)));
        edges.push({ source: id, target: String.fromCharCode(65 + ((i + 1) % count)) });
      }
      return { nodes, edges };
    },
  },
  {
    name: "Wikipedia",
    description: "Classic asymmetric PageRank example",
    build(w, h) {
      const cx = w / 2, cy = h / 2;
      return {
        nodes: [
          node("A", "A", cx, cy - 160),
          node("B", "B", cx - 180, cy - 40),
          node("C", "C", cx + 180, cy - 40),
          node("D", "D", cx - 120, cy + 120),
          node("E", "E", cx + 120, cy + 120),
        ],
        edges: [
          { source: "B", target: "A" },
          { source: "C", target: "A" },
          { source: "D", target: "A" },
          { source: "D", target: "B" },
          { source: "E", target: "A" },
          { source: "E", target: "C" },
          { source: "A", target: "C" },
          { source: "B", target: "D" },
        ],
      };
    },
  },
  {
    name: "Random",
    description: "8 randomly connected nodes",
    build(w, h) {
      const count = 8, pad = 100;
      const nodes: GraphNode[] = [];
      for (let i = 0; i < count; i++) {
        const id = String.fromCharCode(65 + i);
        nodes.push(
          node(id, id, pad + Math.random() * (w - 2 * pad), pad + Math.random() * (h - 2 * pad))
        );
      }
      const edges: GraphEdge[] = [];
      for (const n of nodes) {
        const targets = nodes
          .filter((t) => t.id !== n.id)
          .sort(() => Math.random() - 0.5)
          .slice(0, 1 + Math.floor(Math.random() * 3));
        for (const t of targets) edges.push({ source: n.id, target: t.id });
      }
      return { nodes, edges };
    },
  },
];
