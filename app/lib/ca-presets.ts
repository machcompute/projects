import type { CAGrid } from "./ca-types";
import { createEmptyGrid, placePattern, randomFillGrid } from "./ca-rules";

export interface CAPreset {
  name: string;
  description: string;
  build: (rows: number, cols: number) => CAGrid;
}

const GLIDER: [number, number][] = [
  [0, 1], [1, 2], [2, 0], [2, 1], [2, 2],
];

const LWSS: [number, number][] = [
  [0, 1], [0, 4],
  [1, 0],
  [2, 0], [2, 4],
  [3, 0], [3, 1], [3, 2], [3, 3],
];

const GOSPER_GLIDER_GUN: [number, number][] = [
  [0, 24],
  [1, 22], [1, 24],
  [2, 12], [2, 13], [2, 20], [2, 21], [2, 34], [2, 35],
  [3, 11], [3, 15], [3, 20], [3, 21], [3, 34], [3, 35],
  [4, 0], [4, 1], [4, 10], [4, 16], [4, 20], [4, 21],
  [5, 0], [5, 1], [5, 10], [5, 14], [5, 16], [5, 17], [5, 22], [5, 24],
  [6, 10], [6, 16], [6, 24],
  [7, 11], [7, 15],
  [8, 12], [8, 13],
];

const PULSAR: [number, number][] = [
  [0, 2], [0, 3], [0, 4], [0, 8], [0, 9], [0, 10],
  [2, 0], [2, 5], [2, 7], [2, 12],
  [3, 0], [3, 5], [3, 7], [3, 12],
  [4, 0], [4, 5], [4, 7], [4, 12],
  [5, 2], [5, 3], [5, 4], [5, 8], [5, 9], [5, 10],
  [7, 2], [7, 3], [7, 4], [7, 8], [7, 9], [7, 10],
  [8, 0], [8, 5], [8, 7], [8, 12],
  [9, 0], [9, 5], [9, 7], [9, 12],
  [10, 0], [10, 5], [10, 7], [10, 12],
  [12, 2], [12, 3], [12, 4], [12, 8], [12, 9], [12, 10],
];

const R_PENTOMINO: [number, number][] = [
  [0, 1], [0, 2],
  [1, 0], [1, 1],
  [2, 1],
];

const ACORN: [number, number][] = [
  [0, 1],
  [1, 3],
  [2, 0], [2, 1], [2, 4], [2, 5], [2, 6],
];

export const presets: CAPreset[] = [
  {
    name: "Glider",
    description: "Smallest spaceship — translates diagonally",
    build(rows, cols) {
      const g = createEmptyGrid(rows, cols);
      return placePattern(g, GLIDER, Math.floor(rows / 4), Math.floor(cols / 4));
    },
  },
  {
    name: "LWSS",
    description: "Lightweight spaceship — moves horizontally",
    build(rows, cols) {
      const g = createEmptyGrid(rows, cols);
      return placePattern(g, LWSS, Math.floor(rows / 2) - 2, Math.floor(cols / 4));
    },
  },
  {
    name: "Gosper Gun",
    description: "First known gun — emits gliders forever",
    build(rows, cols) {
      const g = createEmptyGrid(rows, cols);
      return placePattern(g, GOSPER_GLIDER_GUN, Math.floor(rows / 2) - 4, Math.max(1, Math.floor(cols / 2) - 18));
    },
  },
  {
    name: "Pulsar",
    description: "Period-3 oscillator — largest common oscillator",
    build(rows, cols) {
      const g = createEmptyGrid(rows, cols);
      return placePattern(g, PULSAR, Math.floor(rows / 2) - 6, Math.floor(cols / 2) - 6);
    },
  },
  {
    name: "R-pentomino",
    description: "Tiny pattern that evolves for 1103 generations",
    build(rows, cols) {
      const g = createEmptyGrid(rows, cols);
      return placePattern(g, R_PENTOMINO, Math.floor(rows / 2) - 1, Math.floor(cols / 2) - 1);
    },
  },
  {
    name: "Acorn",
    description: "7 cells that take 5206 generations to stabilize",
    build(rows, cols) {
      const g = createEmptyGrid(rows, cols);
      return placePattern(g, ACORN, Math.floor(rows / 2) - 1, Math.floor(cols / 2) - 3);
    },
  },
  {
    name: "Random",
    description: "Random fill at ~30% density",
    build(rows, cols) {
      return randomFillGrid(rows, cols, 0.3);
    },
  },
];
