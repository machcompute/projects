export interface CAGrid {
  cells: Uint8Array;
  rows: number;
  cols: number;
}

export interface CARule {
  name: string;
  description: string;
  birth: number[];
  survival: number[];
  notation: string;
}

export interface GridSize {
  label: string;
  cols: number;
  rows: number;
}

export interface CASimulationState {
  generation: number;
  isRunning: boolean;
  speed: number;
  population: number;
  wrapMode: boolean;
  activeRuleIndex: number;
  activeGridSizeIndex: number;
}

export interface CellCoord {
  row: number;
  col: number;
}
