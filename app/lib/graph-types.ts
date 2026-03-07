export interface GraphNode {
  id: string;
  label: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rank: number;
  prevRank: number;
  pinned: boolean;
}

export interface GraphEdge {
  source: string;
  target: string;
}

export interface Graph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface SimulationState {
  iteration: number;
  isRunning: boolean;
  speed: number;
  dampingFactor: number;
  convergenceThreshold: number;
  convergenceDelta: number;
  hasConverged: boolean;
}

export type InteractionMode = "select" | "add-node" | "add-edge";

export interface EdgeDraft {
  sourceId: string;
  currentX: number;
  currentY: number;
}
