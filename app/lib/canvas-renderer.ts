import type { GraphNode, GraphEdge, EdgeDraft } from "./graph-types";
import { getNodeRadius } from "./hit-testing";

const C = {
  dark: "#2E282A",
  lime: "#DEEFB7",
  mint: "#98DFAF",
  lavender: "#B8B3E9",
  gray: "#8A8D91",
};

const ARROW = 10;

function lerp(a: string, b: string, t: number): string {
  const p = (s: string, i: number) => parseInt(s.slice(i, i + 2), 16);
  const r = Math.round(p(a, 1) + (p(b, 1) - p(a, 1)) * t);
  const g = Math.round(p(a, 3) + (p(b, 3) - p(a, 3)) * t);
  const bl = Math.round(p(a, 5) + (p(b, 5) - p(a, 5)) * t);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${bl.toString(16).padStart(2, "0")}`;
}

export function drawGraph(
  ctx: CanvasRenderingContext2D,
  nodes: GraphNode[],
  edges: GraphEdge[],
  selectedId: string | null,
  edgeDraft: EdgeDraft | null,
  w: number,
  h: number
) {
  ctx.clearRect(0, 0, w, h);
  drawDots(ctx, w, h);

  const map = new Map(nodes.map((n) => [n.id, n]));

  for (const e of edges) {
    const s = map.get(e.source), t = map.get(e.target);
    if (s && t) drawEdge(ctx, s, t, nodes);
  }

  if (edgeDraft) {
    const s = map.get(edgeDraft.sourceId);
    if (s) {
      ctx.beginPath();
      ctx.setLineDash([6, 4]);
      ctx.strokeStyle = C.lavender;
      ctx.lineWidth = 2;
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(edgeDraft.currentX, edgeDraft.currentY);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  for (const n of nodes) drawNode(ctx, n, n.id === selectedId, nodes);
}

function drawDots(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = C.gray + "18";
  for (let x = 40; x < w; x += 40)
    for (let y = 40; y < h; y += 40) {
      ctx.beginPath();
      ctx.arc(x, y, 1, 0, Math.PI * 2);
      ctx.fill();
    }
}

function drawNode(
  ctx: CanvasRenderingContext2D,
  node: GraphNode,
  selected: boolean,
  all: GraphNode[]
) {
  const r = getNodeRadius(node, all);
  const maxRank = Math.max(...all.map((n) => n.rank), 0.001);
  const t = node.rank / maxRank;

  if (selected) {
    ctx.beginPath();
    ctx.arc(node.x, node.y, r + 6, 0, Math.PI * 2);
    ctx.fillStyle = C.mint + "40";
    ctx.fill();
  }

  ctx.beginPath();
  ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
  ctx.fillStyle = selected ? C.mint : lerp(C.lime, C.mint, t);
  ctx.fill();
  ctx.strokeStyle = selected ? C.dark : C.dark + "50";
  ctx.lineWidth = selected ? 2.5 : 1.5;
  ctx.stroke();

  ctx.fillStyle = C.dark;
  ctx.font = `bold ${Math.max(12, r * 0.6)}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(node.label, node.x, node.y);

  ctx.font = "11px monospace";
  ctx.fillStyle = C.gray;
  ctx.fillText(node.rank.toFixed(3), node.x, node.y + r + 14);
}

function drawEdge(
  ctx: CanvasRenderingContext2D,
  src: GraphNode,
  tgt: GraphNode,
  all: GraphNode[]
) {
  const sr = getNodeRadius(src, all);
  const tr = getNodeRadius(tgt, all);
  const dx = tgt.x - src.x, dy = tgt.y - src.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist === 0) return;
  const nx = dx / dist, ny = dy / dist;

  const sx = src.x + nx * sr, sy = src.y + ny * sr;
  const ex = tgt.x - nx * (tr + ARROW * 0.6), ey = tgt.y - ny * (tr + ARROW * 0.6);

  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.lineTo(ex, ey);
  ctx.strokeStyle = C.gray + "60";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  const angle = Math.atan2(ey - sy, ex - sx);
  ctx.beginPath();
  ctx.moveTo(ex, ey);
  ctx.lineTo(ex - ARROW * Math.cos(angle - Math.PI / 6), ey - ARROW * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(ex - ARROW * Math.cos(angle + Math.PI / 6), ey - ARROW * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fillStyle = C.gray + "80";
  ctx.fill();
}
