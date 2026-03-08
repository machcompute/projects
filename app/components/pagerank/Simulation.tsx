"use client";

import { useReducer, useState, useCallback, useEffect, useRef } from "react";
import { GraphCanvas } from "./GraphCanvas";
import { ControlPanel } from "./ControlPanel";
import { InfoPanel } from "./InfoPanel";
import { PresetSelector } from "./PresetSelector";
import { AlgorithmExplainer } from "./AlgorithmExplainer";
import { performIteration, initializeRanks } from "@/app/lib/pagerank/pagerank";
import { presets } from "@/app/lib/pagerank/presets";
import type {
  Graph,
  GraphNode,
  SimulationState,
  InteractionMode,
} from "@/app/lib/pagerank/types";

// --- Graph reducer ---

type GraphAction =
  | { type: "LOAD"; graph: Graph }
  | { type: "ADD_NODE"; node: GraphNode }
  | { type: "REMOVE_NODE"; nodeId: string }
  | { type: "ADD_EDGE"; source: string; target: string }
  | { type: "MOVE_NODE"; nodeId: string; x: number; y: number }
  | { type: "PIN_NODE"; nodeId: string; pinned: boolean }
  | { type: "SET_RANKS"; nodes: GraphNode[] }
  | { type: "SET_POSITIONS"; nodes: GraphNode[] }
  | { type: "INIT_RANKS" };

function graphReducer(state: Graph, action: GraphAction): Graph {
  switch (action.type) {
    case "LOAD": {
      const g = action.graph;
      return { nodes: initializeRanks(g.nodes), edges: g.edges };
    }
    case "ADD_NODE":
      return {
        ...state,
        nodes: initializeRanks([...state.nodes, action.node]),
      };
    case "REMOVE_NODE":
      return {
        nodes: initializeRanks(
          state.nodes.filter((n) => n.id !== action.nodeId)
        ),
        edges: state.edges.filter(
          (e) => e.source !== action.nodeId && e.target !== action.nodeId
        ),
      };
    case "ADD_EDGE": {
      const exists = state.edges.some(
        (e) => e.source === action.source && e.target === action.target
      );
      if (exists || action.source === action.target) return state;
      return {
        ...state,
        edges: [...state.edges, { source: action.source, target: action.target }],
      };
    }
    case "MOVE_NODE":
      return {
        ...state,
        nodes: state.nodes.map((n) =>
          n.id === action.nodeId ? { ...n, x: action.x, y: action.y } : n
        ),
      };
    case "PIN_NODE":
      return {
        ...state,
        nodes: state.nodes.map((n) =>
          n.id === action.nodeId ? { ...n, pinned: action.pinned } : n
        ),
      };
    case "SET_RANKS":
      return {
        ...state,
        nodes: state.nodes.map((n) => {
          const updated = action.nodes.find((u) => u.id === n.id);
          return updated ? { ...n, rank: updated.rank, prevRank: updated.prevRank } : n;
        }),
      };
    case "SET_POSITIONS":
      return {
        ...state,
        nodes: action.nodes.map((updated) => {
          const current = state.nodes.find((n) => n.id === updated.id);
          return current
            ? { ...current, x: updated.x, y: updated.y, vx: updated.vx, vy: updated.vy }
            : updated;
        }),
      };
    case "INIT_RANKS":
      return { ...state, nodes: initializeRanks(state.nodes) };
    default:
      return state;
  }
}

// --- Label generator ---

function nextLabel(nodes: GraphNode[]): string {
  const used = new Set(nodes.map((n) => n.label));
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for (let i = 0; i < 702; i++) {
    const label =
      i < 26
        ? chars[i]
        : chars[Math.floor((i - 26) / 26)] + chars[(i - 26) % 26];
    if (!used.has(label)) return label;
  }
  return `N${Date.now()}`;
}

// --- Main component ---

const DEFAULT_SIM: SimulationState = {
  iteration: 0,
  isRunning: false,
  speed: 500,
  dampingFactor: 0.85,
  convergenceThreshold: 0.0001,
  convergenceDelta: 0,
  hasConverged: false,
};

export function Simulation() {
  const [graph, dispatch] = useReducer(graphReducer, { nodes: [], edges: [] });
  const [sim, setSim] = useState<SimulationState>(DEFAULT_SIM);
  const [mode, setMode] = useState<InteractionMode>("select");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [canvasSize, setCanvasSize] = useState({ w: 800, h: 600 });

  // Track canvas size for preset building
  const canvasSizeRef = useRef(canvasSize);
  canvasSizeRef.current = canvasSize;

  // Simulation loop
  const graphRef = useRef(graph);
  graphRef.current = graph;
  const simRef = useRef(sim);
  simRef.current = sim;

  useEffect(() => {
    if (!sim.isRunning || graph.nodes.length === 0) return;

    const interval = setInterval(() => {
      const { updatedNodes, maxDelta } = performIteration(
        graphRef.current.nodes,
        graphRef.current.edges,
        simRef.current.dampingFactor
      );
      dispatch({ type: "SET_RANKS", nodes: updatedNodes });

      const converged = maxDelta < simRef.current.convergenceThreshold;
      setSim((prev) => ({
        ...prev,
        iteration: prev.iteration + 1,
        convergenceDelta: maxDelta,
        hasConverged: converged,
        isRunning: converged ? false : prev.isRunning,
      }));
    }, sim.speed);

    return () => clearInterval(interval);
  }, [sim.isRunning, sim.speed, graph.nodes.length]);

  // --- Callbacks ---

  const handleLoadPreset = useCallback(
    (index: number) => {
      const preset = presets[index];
      const g = preset.build(canvasSizeRef.current.w, canvasSizeRef.current.h);
      dispatch({ type: "LOAD", graph: g });
      setSim({ ...DEFAULT_SIM });
      setSelectedId(null);
    },
    []
  );

  const handlePlay = useCallback(() => {
    if (graph.nodes.length === 0) return;
    setSim((prev) => ({ ...prev, isRunning: true }));
  }, [graph.nodes.length]);

  const handlePause = useCallback(() => {
    setSim((prev) => ({ ...prev, isRunning: false }));
  }, []);

  const handleStep = useCallback(() => {
    if (graph.nodes.length === 0) return;
    const { updatedNodes, maxDelta } = performIteration(
      graph.nodes,
      graph.edges,
      sim.dampingFactor
    );
    dispatch({ type: "SET_RANKS", nodes: updatedNodes });
    const converged = maxDelta < sim.convergenceThreshold;
    setSim((prev) => ({
      ...prev,
      iteration: prev.iteration + 1,
      convergenceDelta: maxDelta,
      hasConverged: converged,
    }));
  }, [graph.nodes, graph.edges, sim.dampingFactor, sim.convergenceThreshold]);

  const handleReset = useCallback(() => {
    dispatch({ type: "INIT_RANKS" });
    setSim({ ...DEFAULT_SIM });
  }, []);

  const handleAddNode = useCallback(
    (x: number, y: number) => {
      const label = nextLabel(graph.nodes);
      const node: GraphNode = {
        id: label,
        label,
        x,
        y,
        vx: 0,
        vy: 0,
        rank: 0,
        prevRank: 0,
        pinned: false,
      };
      dispatch({ type: "ADD_NODE", node });
      setSim((prev) => ({ ...prev, iteration: 0, hasConverged: false, convergenceDelta: 0 }));
    },
    [graph.nodes]
  );

  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      dispatch({ type: "REMOVE_NODE", nodeId });
      if (selectedId === nodeId) setSelectedId(null);
      setSim((prev) => ({ ...prev, iteration: 0, hasConverged: false, convergenceDelta: 0 }));
    },
    [selectedId]
  );

  const handleAddEdge = useCallback(
    (sourceId: string, targetId: string) => {
      dispatch({ type: "ADD_EDGE", source: sourceId, target: targetId });
      setSim((prev) => ({ ...prev, iteration: 0, hasConverged: false, convergenceDelta: 0 }));
    },
    []
  );

  const handleNodeDrag = useCallback(
    (nodeId: string, x: number, y: number) => {
      dispatch({ type: "MOVE_NODE", nodeId, x, y });
    },
    []
  );

  const handleNodePin = useCallback(
    (nodeId: string, pinned: boolean) => {
      dispatch({ type: "PIN_NODE", nodeId, pinned });
    },
    []
  );

  const handlePositionsUpdate = useCallback((nodes: GraphNode[]) => {
    dispatch({ type: "SET_POSITIONS", nodes });
  }, []);

  // Track canvas size from GraphCanvas via ResizeObserver effect
  useEffect(() => {
    const el = document.querySelector("[data-canvas-container]");
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width } = entries[0].contentRect;
      setCanvasSize({ w: width, h: Math.min(700, Math.max(450, width * 0.6)) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Canvas area */}
      <div className="flex-1 min-w-0" data-canvas-container>
        <div className="rounded-2xl border border-mc-gray/15 bg-white overflow-hidden">
          <GraphCanvas
            nodes={graph.nodes}
            edges={graph.edges}
            selectedNodeId={selectedId}
            interactionMode={mode}
            onNodeDrag={handleNodeDrag}
            onNodeSelect={setSelectedId}
            onNodePin={handleNodePin}
            onAddNode={handleAddNode}
            onAddEdge={handleAddEdge}
            onDeleteNode={handleDeleteNode}
            onPositionsUpdate={handlePositionsUpdate}
          />
        </div>

        {/* Mode toolbar */}
        <div className="flex gap-2 mt-3">
          {(
            [
              { key: "select", label: "Select / Move", icon: "M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" },
              { key: "add-node", label: "Add Node", icon: "M12 5v14M5 12h14" },
              { key: "add-edge", label: "Add Edge", icon: "M5 12h14M14 5l7 7-7 7" },
            ] as const
          ).map((m) => (
            <button
              key={m.key}
              onClick={() => setMode(m.key)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                mode === m.key
                  ? "bg-mc-dark text-white"
                  : "bg-mc-lavender/15 text-mc-dark/70 hover:bg-mc-lavender/25"
              }`}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d={m.icon} />
              </svg>
              {m.label}
            </button>
          ))}
        </div>

        <p className="mt-2 text-xs text-mc-gray">
          {mode === "select" && "Click to select. Drag to move. Right-click to delete."}
          {mode === "add-node" && "Click on empty space to add a new node."}
          {mode === "add-edge" && "Drag from one node to another to create a directed edge."}
        </p>
        <div className="mt-4">
          <AlgorithmExplainer />
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-full lg:w-80 xl:w-96 flex flex-col gap-4 shrink-0">
        <PresetSelector onLoadPreset={handleLoadPreset} />
        <ControlPanel
          isRunning={sim.isRunning}
          speed={sim.speed}
          dampingFactor={sim.dampingFactor}
          hasConverged={sim.hasConverged}
          selectedNodeId={selectedId}
          onPlay={handlePlay}
          onPause={handlePause}
          onStep={handleStep}
          onReset={handleReset}
          onSpeedChange={(speed) =>
            setSim((prev) => ({ ...prev, speed }))
          }
          onDampingChange={(dampingFactor) =>
            setSim((prev) => ({ ...prev, dampingFactor }))
          }
          onDeleteSelected={() => selectedId && handleDeleteNode(selectedId)}
        />
        <InfoPanel
          nodes={graph.nodes.map((n) => ({
            id: n.id,
            label: n.label,
            rank: n.rank,
          }))}
          iteration={sim.iteration}
          convergenceDelta={sim.convergenceDelta}
          hasConverged={sim.hasConverged}
        />
      </div>
    </div>
  );
}
