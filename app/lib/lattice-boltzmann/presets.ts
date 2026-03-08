import type { LBMGrid } from "./types";
import { createGridWithFlow, setBarrier } from "./lbm";

export interface LBMPreset {
  name: string;
  description: string;
  inletSpeed: number;
  viscosity: number;
  build: (rows: number, cols: number) => LBMGrid;
}

function placeCircle(grid: LBMGrid, centerR: number, centerC: number, radius: number) {
  for (let r = 0; r < grid.rows; r++) {
    for (let c = 0; c < grid.cols; c++) {
      const dx = c - centerC;
      const dy = r - centerR;
      if (dx * dx + dy * dy <= radius * radius) {
        setBarrier(grid, r, c, true);
      }
    }
  }
}

export const presets: LBMPreset[] = [
  {
    name: "Empty Channel",
    description: "Laminar flow through an empty channel",
    inletSpeed: 0.08,
    viscosity: 0.1,
    build(rows, cols) {
      return createGridWithFlow(rows, cols, 0.08);
    },
  },
  {
    name: "Cylinder",
    description: "Single cylinder in crossflow — vortex shedding",
    inletSpeed: 0.1,
    viscosity: 0.02,
    build(rows, cols) {
      const grid = createGridWithFlow(rows, cols, 0.1);
      const cx = Math.floor(cols / 4);
      const cy = Math.floor(rows / 2);
      const radius = Math.floor(Math.min(rows, cols) / 10);
      placeCircle(grid, cy, cx, radius);
      return grid;
    },
  },
  {
    name: "Backward Step",
    description: "Flow over a backward-facing step — recirculation zone",
    inletSpeed: 0.08,
    viscosity: 0.05,
    build(rows, cols) {
      const grid = createGridWithFlow(rows, cols, 0.08);
      const stepX = Math.floor(cols * 0.15);
      const stepHeight = Math.floor(rows * 0.4);
      // Step: a block from the bottom wall up to stepHeight, at x = stepX
      for (let r = rows - 1 - stepHeight; r < rows; r++) {
        for (let c = stepX; c < stepX + 3; c++) {
          setBarrier(grid, r, c, true);
        }
      }
      return grid;
    },
  },
  {
    name: "Twin Cylinders",
    description: "Two cylinders — wake interaction",
    inletSpeed: 0.1,
    viscosity: 0.02,
    build(rows, cols) {
      const grid = createGridWithFlow(rows, cols, 0.1);
      const radius = Math.floor(Math.min(rows, cols) / 12);
      placeCircle(grid, Math.floor(rows * 0.35), Math.floor(cols * 0.25), radius);
      placeCircle(grid, Math.floor(rows * 0.65), Math.floor(cols * 0.25), radius);
      return grid;
    },
  },
  {
    name: "Empty",
    description: "Blank canvas — draw your own obstacles",
    inletSpeed: 0.08,
    viscosity: 0.1,
    build(rows, cols) {
      return createGridWithFlow(rows, cols, 0.08);
    },
  },
];
