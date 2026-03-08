import type { LBMGrid } from "./types";

// D2Q9 lattice constants
// Directions: 0=rest, 1=E, 2=N, 3=W, 4=S, 5=NE, 6=NW, 7=SW, 8=SE
// Using screen coordinates: +x = right, +y = down
const cx = [0, 1, 0, -1, 0, 1, -1, -1, 1];
const cy = [0, 0, -1, 0, 1, -1, -1, 1, 1];
const weights = [4 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 36, 1 / 36, 1 / 36, 1 / 36];
const opposite = [0, 3, 4, 1, 2, 7, 8, 5, 6];

// --- Grid creation ---

export function createGrid(rows: number, cols: number): LBMGrid {
  const n = rows * cols;
  const f: Float64Array[] = [];
  const fTemp: Float64Array[] = [];
  for (let i = 0; i < 9; i++) {
    f.push(new Float64Array(n));
    fTemp.push(new Float64Array(n));
  }
  const grid: LBMGrid = {
    f,
    fTemp,
    density: new Float64Array(n),
    ux: new Float64Array(n),
    uy: new Float64Array(n),
    barriers: new Uint8Array(n),
    rows,
    cols,
  };
  // Initialize to equilibrium at rest (density=1, velocity=0)
  for (let idx = 0; idx < n; idx++) {
    grid.density[idx] = 1;
    for (let i = 0; i < 9; i++) {
      grid.f[i][idx] = weights[i];
    }
  }
  return grid;
}

export function createGridWithFlow(rows: number, cols: number, inletSpeed: number): LBMGrid {
  const grid = createGrid(rows, cols);
  const n = rows * cols;
  // Initialize with uniform horizontal flow
  for (let idx = 0; idx < n; idx++) {
    grid.ux[idx] = inletSpeed;
    grid.uy[idx] = 0;
    grid.density[idx] = 1;
    for (let i = 0; i < 9; i++) {
      grid.f[i][idx] = feq(1, inletSpeed, 0, i);
    }
  }
  return grid;
}

// --- Equilibrium distribution ---

function feq(rho: number, ux: number, uy: number, i: number): number {
  const eu = cx[i] * ux + cy[i] * uy;
  const uSq = ux * ux + uy * uy;
  return weights[i] * rho * (1 + 3 * eu + 4.5 * eu * eu - 1.5 * uSq);
}

// --- Stability limits ---

const MAX_VELOCITY = 0.3; // Mach number limit for LBM stability
const MIN_DENSITY = 0.5;
const MAX_DENSITY = 2.0;

// --- Macroscopic quantities ---

export function computeMacroscopic(grid: LBMGrid): void {
  const { f, density, ux, uy, barriers, rows, cols } = grid;
  const n = rows * cols;
  for (let idx = 0; idx < n; idx++) {
    if (barriers[idx]) {
      density[idx] = 0;
      ux[idx] = 0;
      uy[idx] = 0;
      continue;
    }
    let rho = 0;
    let mx = 0;
    let my = 0;
    for (let i = 0; i < 9; i++) {
      const fi = f[i][idx];
      rho += fi;
      mx += cx[i] * fi;
      my += cy[i] * fi;
    }

    // Clamp density — if out of range, reset cell to equilibrium
    if (rho < MIN_DENSITY || rho > MAX_DENSITY || !isFinite(rho)) {
      rho = 1;
      for (let i = 0; i < 9; i++) {
        f[i][idx] = weights[i];
      }
      density[idx] = 1;
      ux[idx] = 0;
      uy[idx] = 0;
      continue;
    }

    density[idx] = rho;
    let vx = mx / rho;
    let vy = my / rho;

    // Clamp velocity magnitude
    const spd = Math.sqrt(vx * vx + vy * vy);
    if (spd > MAX_VELOCITY) {
      const scale = MAX_VELOCITY / spd;
      vx *= scale;
      vy *= scale;
      // Rewrite distributions to clamped equilibrium
      for (let i = 0; i < 9; i++) {
        f[i][idx] = feq(rho, vx, vy, i);
      }
    }

    ux[idx] = vx;
    uy[idx] = vy;
  }
}

// --- Collision (BGK) ---

function collide(grid: LBMGrid, omega: number): void {
  const { f, density, ux, uy, barriers } = grid;
  const n = grid.rows * grid.cols;
  for (let idx = 0; idx < n; idx++) {
    if (barriers[idx]) continue;
    const rho = density[idx];
    const u = ux[idx];
    const v = uy[idx];
    for (let i = 0; i < 9; i++) {
      f[i][idx] += omega * (feq(rho, u, v, i) - f[i][idx]);
    }
  }
}

// --- Streaming (double-buffered) ---

function stream(grid: LBMGrid): void {
  const { f, fTemp, rows, cols } = grid;
  const n = rows * cols;

  // Clear temp
  for (let i = 0; i < 9; i++) {
    fTemp[i].fill(0);
  }

  // Stream each distribution to its neighbor
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      for (let i = 0; i < 9; i++) {
        const nr = r + cy[i];
        const nc = c + cx[i];
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
          fTemp[i][nr * cols + nc] = f[i][idx];
        }
      }
    }
  }

  // Swap f and fTemp
  for (let i = 0; i < 9; i++) {
    const tmp = grid.f[i];
    grid.f[i] = grid.fTemp[i];
    grid.fTemp[i] = tmp;
  }
}

// --- Bounce-back for barriers ---
// After streaming, barrier cells contain incoming distributions from fluid neighbors.
// Swap opposite direction pairs so they stream back out in the next step.

function bounceBack(grid: LBMGrid): void {
  const { f, barriers, rows, cols } = grid;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      if (!barriers[idx]) continue;
      let tmp: number;
      tmp = f[1][idx]; f[1][idx] = f[3][idx]; f[3][idx] = tmp; // E <-> W
      tmp = f[2][idx]; f[2][idx] = f[4][idx]; f[4][idx] = tmp; // N <-> S
      tmp = f[5][idx]; f[5][idx] = f[7][idx]; f[7][idx] = tmp; // NE <-> SW
      tmp = f[6][idx]; f[6][idx] = f[8][idx]; f[8][idx] = tmp; // NW <-> SE
    }
  }
}

// --- Boundary conditions ---

function applyBoundaryConditions(grid: LBMGrid, inletSpeed: number): void {
  const { f, rows, cols } = grid;

  // Left wall (c=0): Zou-He velocity inlet (ux=inletSpeed, uy=0)
  for (let r = 1; r < rows - 1; r++) {
    const idx = r * cols;
    if (grid.barriers[idx]) continue;
    // Skip inlet if the adjacent cell is a barrier (flow has nowhere to go)
    if (grid.barriers[idx + 1]) continue;
    const u0 = inletSpeed;
    const rho = (f[0][idx] + f[2][idx] + f[4][idx] + 2 * (f[3][idx] + f[6][idx] + f[7][idx])) / (1 - u0);
    f[1][idx] = f[3][idx] + (2 / 3) * rho * u0;
    f[5][idx] = f[7][idx] + (1 / 6) * rho * u0 - 0.5 * (f[2][idx] - f[4][idx]);
    f[8][idx] = f[6][idx] + (1 / 6) * rho * u0 + 0.5 * (f[2][idx] - f[4][idx]);
    grid.density[idx] = rho;
    grid.ux[idx] = u0;
    grid.uy[idx] = 0;
  }

  // Right wall (c=cols-1): zero-gradient outlet (copy from c=cols-2)
  for (let r = 0; r < rows; r++) {
    const dst = r * cols + (cols - 1);
    const src = r * cols + (cols - 2);
    for (let i = 0; i < 9; i++) {
      f[i][dst] = f[i][src];
    }
  }

  // Top wall (r=0): bounce-back
  for (let c = 0; c < cols; c++) {
    const idx = c; // r=0
    f[4][idx] = f[2][idx];   // S <- N
    f[7][idx] = f[5][idx];   // SW <- NE
    f[8][idx] = f[6][idx];   // SE <- NW
  }

  // Bottom wall (r=rows-1): bounce-back
  for (let c = 0; c < cols; c++) {
    const idx = (rows - 1) * cols + c;
    f[2][idx] = f[4][idx];   // N <- S
    f[5][idx] = f[7][idx];   // NE <- SW
    f[6][idx] = f[8][idx];   // NW <- SE
  }
}

// --- Combined step ---

export function stepLBM(grid: LBMGrid, viscosity: number, inletSpeed: number): void {
  const omega = 1 / (3 * viscosity + 0.5);
  collide(grid, omega);
  stream(grid);
  bounceBack(grid);
  applyBoundaryConditions(grid, inletSpeed);
  computeMacroscopic(grid);
}

// --- Barrier manipulation ---

export function setBarrier(grid: LBMGrid, row: number, col: number, solid: boolean): void {
  // Don't allow barriers on inlet/outlet columns
  if (col === 0 || col === grid.cols - 1) return;
  // Don't allow barriers on top/bottom walls
  if (row === 0 || row === grid.rows - 1) return;
  const idx = row * grid.cols + col;
  grid.barriers[idx] = solid ? 1 : 0;
  if (solid) {
    // Zero out distributions
    for (let i = 0; i < 9; i++) {
      grid.f[i][idx] = 0;
    }
    grid.density[idx] = 0;
    grid.ux[idx] = 0;
    grid.uy[idx] = 0;
  }
}

export function clearBarriers(grid: LBMGrid): void {
  grid.barriers.fill(0);
}

export function resetFlow(grid: LBMGrid, inletSpeed: number): void {
  const { rows, cols, barriers } = grid;
  const n = rows * cols;
  for (let idx = 0; idx < n; idx++) {
    if (barriers[idx]) {
      for (let i = 0; i < 9; i++) grid.f[i][idx] = 0;
      grid.density[idx] = 0;
      grid.ux[idx] = 0;
      grid.uy[idx] = 0;
    } else {
      grid.density[idx] = 1;
      grid.ux[idx] = inletSpeed;
      grid.uy[idx] = 0;
      for (let i = 0; i < 9; i++) {
        grid.f[i][idx] = feq(1, inletSpeed, 0, i);
      }
    }
  }
}

// --- Statistics ---

export function computeMaxSpeed(grid: LBMGrid): number {
  const { ux, uy, barriers } = grid;
  const n = grid.rows * grid.cols;
  let max = 0;
  for (let idx = 0; idx < n; idx++) {
    if (barriers[idx]) continue;
    const spd = Math.sqrt(ux[idx] * ux[idx] + uy[idx] * uy[idx]);
    if (spd > max) max = spd;
  }
  return max;
}

export function computeAvgDensity(grid: LBMGrid): number {
  const { density, barriers } = grid;
  const n = grid.rows * grid.cols;
  let sum = 0;
  let count = 0;
  for (let idx = 0; idx < n; idx++) {
    if (barriers[idx]) continue;
    sum += density[idx];
    count++;
  }
  return count > 0 ? sum / count : 0;
}

export function computeMaxDensityDev(grid: LBMGrid): number {
  const { density, barriers } = grid;
  const n = grid.rows * grid.cols;
  let maxDev = 0;
  for (let idx = 0; idx < n; idx++) {
    if (barriers[idx]) continue;
    const dev = Math.abs(density[idx] - 1.0);
    if (dev > maxDev) maxDev = dev;
  }
  return Math.max(maxDev * 1.2, 0.01); // pad by 20%, min 0.01
}

export function computeCurl(grid: LBMGrid): Float64Array {
  const { ux, uy, rows, cols } = grid;
  const curl = new Float64Array(rows * cols);
  for (let r = 1; r < rows - 1; r++) {
    for (let c = 1; c < cols - 1; c++) {
      const idx = r * cols + c;
      // duy/dx - dux/dy (central differences)
      const duy_dx = (uy[idx + 1] - uy[idx - 1]) * 0.5;
      const dux_dy = (ux[(r + 1) * cols + c] - ux[(r - 1) * cols + c]) * 0.5;
      curl[idx] = duy_dx - dux_dy;
    }
  }
  return curl;
}
