import type { GraphNode, GraphEdge } from "./types";

const REPULSION = 5000;
const ATTRACTION = 0.002;
const DAMPING = 0.85;
const MIN_DIST = 30;

export function forceLayoutTick(
  nodes: GraphNode[],
  edges: GraphEdge[],
  w: number,
  h: number
): GraphNode[] {
  const out = nodes.map((n) => ({ ...n }));

  for (let i = 0; i < out.length; i++) {
    for (let j = i + 1; j < out.length; j++) {
      const a = out[i], b = out[j];
      let dx = b.x - a.x, dy = b.y - a.y;
      let dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < MIN_DIST) dist = MIN_DIST;
      const f = REPULSION / (dist * dist);
      const fx = (dx / dist) * f, fy = (dy / dist) * f;
      if (!a.pinned) { a.vx -= fx; a.vy -= fy; }
      if (!b.pinned) { b.vx += fx; b.vy += fy; }
    }
  }

  const map = new Map(out.map((n) => [n.id, n]));
  for (const e of edges) {
    const a = map.get(e.source), b = map.get(e.target);
    if (!a || !b) continue;
    const dx = b.x - a.x, dy = b.y - a.y;
    const fx = dx * ATTRACTION, fy = dy * ATTRACTION;
    if (!a.pinned) { a.vx += fx; a.vy += fy; }
    if (!b.pinned) { b.vx -= fx; b.vy -= fy; }
  }

  const PAD = 40;
  for (const n of out) {
    if (n.pinned) continue;
    n.vx *= DAMPING;
    n.vy *= DAMPING;
    n.x += n.vx;
    n.y += n.vy;
    n.x = Math.max(PAD, Math.min(w - PAD, n.x));
    n.y = Math.max(PAD, Math.min(h - PAD, n.y));
  }

  return out;
}
