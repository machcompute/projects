"use client";

import { useReducer, useState, useCallback, useEffect, useRef } from "react";
import { Canvas } from "./Canvas";
import { ControlPanel } from "./ControlPanel";
import { InfoPanel } from "./InfoPanel";
import { PresetSelector } from "./PresetSelector";
import { RuleSelector } from "./RuleSelector";
import { Explainer } from "./Explainer";
import {
  rules,
  createEmptyGrid,
  cloneGrid,
  stepGrid,
  countPopulation,
  randomFillGrid,
} from "@/app/lib/ca-rules";
import { presets } from "@/app/lib/ca-presets";
import type { CAGrid, CASimulationState, CellCoord, GridSize } from "@/app/lib/ca-types";

// --- Grid sizes ---

const gridSizes: GridSize[] = [
  { label: "Small", cols: 40, rows: 30 },
  { label: "Medium", cols: 60, rows: 45 },
  { label: "Large", cols: 80, rows: 60 },
  { label: "XL", cols: 100, rows: 75 },
];

// --- Grid reducer ---

type GridAction =
  | { type: "LOAD"; grid: CAGrid }
  | { type: "SET_GRID"; grid: CAGrid }
  | { type: "SET_CELL"; row: number; col: number; value: 0 | 1 }
  | { type: "CLEAR" }
  | { type: "RESIZE"; rows: number; cols: number };

function gridReducer(state: CAGrid, action: GridAction): CAGrid {
  switch (action.type) {
    case "LOAD":
    case "SET_GRID":
      return action.grid;
    case "SET_CELL": {
      const out = cloneGrid(state);
      out.cells[action.row * state.cols + action.col] = action.value;
      return out;
    }
    case "CLEAR":
      return createEmptyGrid(state.rows, state.cols);
    case "RESIZE":
      return createEmptyGrid(action.rows, action.cols);
    default:
      return state;
  }
}

// --- Default state ---

const DEFAULT_SIZE_INDEX = 1; // Medium 60x45

const DEFAULT_SIM: CASimulationState = {
  generation: 0,
  isRunning: false,
  speed: 150,
  population: 0,
  wrapMode: true,
  activeRuleIndex: 0,
  activeGridSizeIndex: DEFAULT_SIZE_INDEX,
};

// --- Main component ---

export function Simulation() {
  const [grid, dispatch] = useReducer(
    gridReducer,
    null,
    () => createEmptyGrid(gridSizes[DEFAULT_SIZE_INDEX].rows, gridSizes[DEFAULT_SIZE_INDEX].cols)
  );
  const [sim, setSim] = useState<CASimulationState>(DEFAULT_SIM);
  const [hoverCell, setHoverCell] = useState<CellCoord | null>(null);

  // Stable refs
  const gridRef = useRef(grid);
  gridRef.current = grid;
  const simRef = useRef(sim);
  simRef.current = sim;

  // Simulation loop
  useEffect(() => {
    if (!sim.isRunning) return;

    const interval = setInterval(() => {
      const g = gridRef.current;
      const s = simRef.current;
      const rule = rules[s.activeRuleIndex];
      const nextGrid = stepGrid(g, rule, s.wrapMode);
      const pop = countPopulation(nextGrid);

      dispatch({ type: "SET_GRID", grid: nextGrid });
      setSim((prev) => ({
        ...prev,
        generation: prev.generation + 1,
        population: pop,
      }));
    }, sim.speed);

    return () => clearInterval(interval);
  }, [sim.isRunning, sim.speed]);

  // --- Callbacks ---

  const handleLoadPreset = useCallback((index: number) => {
    const s = simRef.current;
    const { rows, cols } = gridSizes[s.activeGridSizeIndex];
    const g = presets[index].build(rows, cols);
    dispatch({ type: "LOAD", grid: g });
    setSim((prev) => ({
      ...prev,
      generation: 0,
      population: countPopulation(g),
    }));
  }, []);

  const handlePlay = useCallback(() => {
    setSim((prev) => ({ ...prev, isRunning: true }));
  }, []);

  const handlePause = useCallback(() => {
    setSim((prev) => ({ ...prev, isRunning: false }));
  }, []);

  const handleStep = useCallback(() => {
    const g = gridRef.current;
    const s = simRef.current;
    const rule = rules[s.activeRuleIndex];
    const nextGrid = stepGrid(g, rule, s.wrapMode);
    const pop = countPopulation(nextGrid);
    dispatch({ type: "SET_GRID", grid: nextGrid });
    setSim((prev) => ({
      ...prev,
      generation: prev.generation + 1,
      population: pop,
    }));
  }, []);

  const handleClear = useCallback(() => {
    dispatch({ type: "CLEAR" });
    setSim((prev) => ({ ...prev, generation: 0, population: 0, isRunning: false }));
  }, []);

  const handleRandomFill = useCallback(() => {
    const s = simRef.current;
    const { rows, cols } = gridSizes[s.activeGridSizeIndex];
    const g = randomFillGrid(rows, cols, 0.3);
    dispatch({ type: "LOAD", grid: g });
    setSim((prev) => ({
      ...prev,
      generation: 0,
      population: countPopulation(g),
    }));
  }, []);

  const handleCellPaint = useCallback((row: number, col: number, value: 0 | 1) => {
    dispatch({ type: "SET_CELL", row, col, value });
    setSim((prev) => ({
      ...prev,
      population: prev.population + (value === 1 ? 1 : -1),
    }));
  }, []);

  const handleRuleChange = useCallback((index: number) => {
    setSim((prev) => ({ ...prev, activeRuleIndex: index }));
  }, []);

  const handleGridSizeChange = useCallback((index: number) => {
    const { rows, cols } = gridSizes[index];
    dispatch({ type: "RESIZE", rows, cols });
    setSim((prev) => ({
      ...prev,
      activeGridSizeIndex: index,
      generation: 0,
      population: 0,
      isRunning: false,
    }));
  }, []);

  const handleWrapToggle = useCallback(() => {
    setSim((prev) => ({ ...prev, wrapMode: !prev.wrapMode }));
  }, []);

  const activeRule = rules[sim.activeRuleIndex];

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Canvas area */}
      <div className="flex-1 min-w-0">
        <div className="rounded-2xl border border-mc-gray/15 bg-white overflow-hidden">
          <Canvas
            grid={grid}
            hoverCell={hoverCell}
            onCellPaint={handleCellPaint}
            onHoverChange={setHoverCell}
          />
        </div>
        <p className="mt-2 text-xs text-mc-gray">
          {hoverCell
            ? `Cell (${hoverCell.row}, ${hoverCell.col})`
            : "Click to toggle cells. Drag to paint. Right-click to erase."}
        </p>
        <div className="mt-4">
          <Explainer />
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-full lg:w-80 xl:w-96 flex flex-col gap-4 shrink-0">
        <PresetSelector onLoadPreset={handleLoadPreset} />
        <RuleSelector
          activeRuleIndex={sim.activeRuleIndex}
          onRuleChange={handleRuleChange}
        />
        <ControlPanel
          isRunning={sim.isRunning}
          speed={sim.speed}
          wrapMode={sim.wrapMode}
          gridSizes={gridSizes}
          activeGridSizeIndex={sim.activeGridSizeIndex}
          onPlay={handlePlay}
          onPause={handlePause}
          onStep={handleStep}
          onClear={handleClear}
          onRandomFill={handleRandomFill}
          onSpeedChange={(speed) => setSim((prev) => ({ ...prev, speed }))}
          onWrapToggle={handleWrapToggle}
          onGridSizeChange={handleGridSizeChange}
        />
        <InfoPanel
          generation={sim.generation}
          population={sim.population}
          totalCells={grid.rows * grid.cols}
          ruleName={activeRule.name}
          ruleNotation={activeRule.notation}
        />
      </div>
    </div>
  );
}
