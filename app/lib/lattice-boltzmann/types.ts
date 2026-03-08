export interface LBMGrid {
  f: Float64Array[];      // 9 distribution functions, each rows*cols
  fTemp: Float64Array[];  // double-buffer for streaming
  density: Float64Array;  // macroscopic density
  ux: Float64Array;       // x-velocity
  uy: Float64Array;       // y-velocity
  barriers: Uint8Array;   // 1 = solid, 0 = fluid
  rows: number;
  cols: number;
}

export type VisualMode = "speed" | "curl" | "density";
export type ComputeMode = "cpu" | "gpu";

export interface LBMSimulationState {
  iteration: number;
  isRunning: boolean;
  stepsPerFrame: number;
  viscosity: number;
  inletSpeed: number;
  visualMode: VisualMode;
  computeMode: ComputeMode;
  activeGridSizeIndex: number;
  maxSpeed: number;
  avgDensity: number;
  maxCurl: number;
  densityScale: number;
  fps: number;
}

export interface GridSize {
  label: string;
  cols: number;
  rows: number;
}

export interface CellCoord {
  row: number;
  col: number;
}
