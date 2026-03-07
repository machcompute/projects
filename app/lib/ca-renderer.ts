import type { CAGrid, CellCoord } from "./ca-types";

const C = {
  mint: "#98DFAF",
  lavender: "#B8B3E9",
  gray: "#8A8D91",
};

export function drawGrid(
  ctx: CanvasRenderingContext2D,
  grid: CAGrid,
  hoverCell: CellCoord | null,
  w: number,
  h: number
) {
  const { cells, rows, cols } = grid;
  const cellW = w / cols;
  const cellH = h / rows;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);

  // Grid lines
  ctx.strokeStyle = C.gray + "15";
  ctx.lineWidth = 0.5;
  for (let r = 0; r <= rows; r++) {
    const y = r * cellH;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  for (let c = 0; c <= cols; c++) {
    const x = c * cellW;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }

  // Alive cells
  ctx.fillStyle = C.mint;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (cells[r * cols + c] === 1) {
        ctx.fillRect(c * cellW + 0.5, r * cellH + 0.5, cellW - 1, cellH - 1);
      }
    }
  }

  // Hover highlight
  if (hoverCell && hoverCell.row >= 0 && hoverCell.row < rows && hoverCell.col >= 0 && hoverCell.col < cols) {
    ctx.fillStyle = C.lavender + "40";
    ctx.fillRect(hoverCell.col * cellW, hoverCell.row * cellH, cellW, cellH);
  }
}
