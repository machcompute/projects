import type { CAGrid, CARule } from "./types";

export const rules: CARule[] = [
  {
    name: "Game of Life",
    description: "Conway's classic — stable structures, gliders, and oscillators",
    birth: [3],
    survival: [2, 3],
    notation: "B3/S23",
  },
  {
    name: "Highlife",
    description: "Like Life but with a self-replicating pattern",
    birth: [3, 6],
    survival: [2, 3],
    notation: "B36/S23",
  },
  {
    name: "Seeds",
    description: "Every cell dies each generation — explosive growth",
    birth: [2],
    survival: [],
    notation: "B2/S",
  },
  {
    name: "Day & Night",
    description: "Symmetric rule — alive and dead are interchangeable",
    birth: [3, 6, 7, 8],
    survival: [3, 4, 6, 7, 8],
    notation: "B3678/S34678",
  },
  {
    name: "Diamoeba",
    description: "Forms large diamond-shaped amoeba blobs",
    birth: [3, 5, 6, 7, 8],
    survival: [5, 6, 7, 8],
    notation: "B35678/S5678",
  },
];

export function createEmptyGrid(rows: number, cols: number): CAGrid {
  return { cells: new Uint8Array(rows * cols), rows, cols };
}

export function cloneGrid(grid: CAGrid): CAGrid {
  return { cells: new Uint8Array(grid.cells), rows: grid.rows, cols: grid.cols };
}

function countNeighbors(
  cells: Uint8Array,
  rows: number,
  cols: number,
  r: number,
  c: number,
  wrap: boolean
): number {
  let count = 0;
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      let nr = r + dr;
      let nc = c + dc;
      if (wrap) {
        nr = (nr + rows) % rows;
        nc = (nc + cols) % cols;
      } else {
        if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
      }
      count += cells[nr * cols + nc];
    }
  }
  return count;
}

export function stepGrid(grid: CAGrid, rule: CARule, wrap: boolean): CAGrid {
  const { cells, rows, cols } = grid;
  const next = new Uint8Array(rows * cols);
  const birthSet = new Set(rule.birth);
  const survivalSet = new Set(rule.survival);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const n = countNeighbors(cells, rows, cols, r, c, wrap);
      const idx = r * cols + c;
      if (cells[idx] === 1) {
        next[idx] = survivalSet.has(n) ? 1 : 0;
      } else {
        next[idx] = birthSet.has(n) ? 1 : 0;
      }
    }
  }

  return { cells: next, rows, cols };
}

export function countPopulation(grid: CAGrid): number {
  let count = 0;
  for (let i = 0; i < grid.cells.length; i++) count += grid.cells[i];
  return count;
}

export function randomFillGrid(rows: number, cols: number, density = 0.3): CAGrid {
  const cells = new Uint8Array(rows * cols);
  for (let i = 0; i < cells.length; i++) {
    cells[i] = Math.random() < density ? 1 : 0;
  }
  return { cells, rows, cols };
}

export function placePattern(
  grid: CAGrid,
  pattern: [number, number][],
  originRow: number,
  originCol: number
): CAGrid {
  const out = cloneGrid(grid);
  for (const [dr, dc] of pattern) {
    const r = originRow + dr;
    const c = originCol + dc;
    if (r >= 0 && r < grid.rows && c >= 0 && c < grid.cols) {
      out.cells[r * grid.cols + c] = 1;
    }
  }
  return out;
}
