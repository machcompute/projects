"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Canvas } from "./Canvas";
import { WebGLCanvas, type WebGLCanvasHandle } from "./WebGLCanvas";
import { ControlPanel } from "./ControlPanel";
import { InfoPanel } from "./InfoPanel";
import { PresetSelector } from "./PresetSelector";
import { Explainer } from "./Explainer";
import {
  createGridWithFlow,
  stepLBM,
  setBarrier,
  clearBarriers,
  resetFlow,
  computeMaxSpeed,
  computeAvgDensity,
  computeMaxDensityDev,
  computeCurl,
} from "@/app/lib/lattice-boltzmann/lbm";
import { presets } from "@/app/lib/lattice-boltzmann/presets";
import {
  GpuLbmEngine,
  checkWebGL2Support,
} from "@/app/lib/lattice-boltzmann/gpu/engine";
import type {
  LBMGrid,
  LBMSimulationState,
  VisualMode,
  ComputeMode,
  GridSize,
} from "@/app/lib/lattice-boltzmann/types";

const gridSizes: GridSize[] = [
  { label: "Small", cols: 200, rows: 80 },
  { label: "Medium", cols: 300, rows: 120 },
  { label: "Large", cols: 400, rows: 160 },
];

const DEFAULT_SIZE_INDEX = 1;

const DEFAULT_SIM: LBMSimulationState = {
  iteration: 0,
  isRunning: false,
  stepsPerFrame: 10,
  viscosity: 0.1,
  inletSpeed: 0.08,
  visualMode: "speed",
  computeMode: "cpu",
  activeGridSizeIndex: DEFAULT_SIZE_INDEX,
  maxSpeed: 0,
  avgDensity: 1,
  maxCurl: 0.01,
  densityScale: 0.01,
  fps: 0,
};

const FPS_WINDOW = 60;
const STATS_READBACK_INTERVAL = 30; // frames between GPU stats readback

function createInitialGrid() {
  return createGridWithFlow(
    gridSizes[DEFAULT_SIZE_INDEX].rows,
    gridSizes[DEFAULT_SIZE_INDEX].cols,
    DEFAULT_SIM.inletSpeed,
  );
}

export function Simulation() {
  const gridRef = useRef<LBMGrid>(createInitialGrid());
  const [sim, setSim] = useState<LBMSimulationState>(() => ({
    ...DEFAULT_SIM,
    maxSpeed: computeMaxSpeed(gridRef.current),
    avgDensity: computeAvgDensity(gridRef.current),
  }));
  const [, setRenderTick] = useState(0);

  const simRef = useRef(sim);
  simRef.current = sim;

  // GPU engine
  const engineRef = useRef<GpuLbmEngine | null>(null);
  const webglCanvasRef = useRef<WebGLCanvasHandle>(null);
  const [gpuAvailable, setGpuAvailable] = useState(false);

  // FPS tracking
  const fpsTimestamps = useRef<number[]>([]);
  const lastFpsUpdate = useRef(0);

  // GPU stats readback counter
  const framesSinceReadback = useRef(0);

  // Check WebGL2 support on mount
  useEffect(() => {
    const result = checkWebGL2Support();
    setGpuAvailable(result.supported);
  }, []);

  // Create/destroy GPU engine when compute mode or grid size changes
  useEffect(() => {
    if (sim.computeMode !== "gpu") {
      // Clean up engine if switching away from GPU
      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
      }
      return;
    }

    // Wait for the WebGL canvas to mount and give us its canvas element
    const handle = webglCanvasRef.current;
    if (!handle?.canvas) return;

    const canvas = handle.canvas;
    const gl = canvas.getContext("webgl2", {
      antialias: false,
      preserveDrawingBuffer: false,
    });
    if (!gl) {
      setSim((prev) => ({ ...prev, computeMode: "cpu" }));
      return;
    }

    const ext = gl.getExtension("EXT_color_buffer_float");
    if (!ext) {
      setSim((prev) => ({ ...prev, computeMode: "cpu" }));
      return;
    }

    const g = gridRef.current;
    const engine = new GpuLbmEngine(gl, g.rows, g.cols);
    engine.uploadGrid(g);
    engineRef.current = engine;
    framesSinceReadback.current = 0;

    return () => {
      engine.destroy();
      if (engineRef.current === engine) {
        engineRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sim.computeMode, sim.activeGridSizeIndex]);

  // FPS measurement
  const measureFps = useCallback(() => {
    const now = performance.now();
    const ts = fpsTimestamps.current;
    ts.push(now);
    if (ts.length > FPS_WINDOW) ts.shift();

    if (now - lastFpsUpdate.current > 500 && ts.length > 1) {
      const elapsed = ts[ts.length - 1] - ts[0];
      const fps = Math.round(((ts.length - 1) / elapsed) * 1000);
      lastFpsUpdate.current = now;
      setSim((prev) => ({ ...prev, fps }));
    }
  }, []);

  // Unified rAF simulation loop
  useEffect(() => {
    if (!sim.isRunning) return;
    let frameId: number;
    const loop = () => {
      const g = gridRef.current;
      const s = simRef.current;

      if (s.computeMode === "gpu" && engineRef.current) {
        const engine = engineRef.current;
        engine.step(s.stepsPerFrame, s.viscosity, s.inletSpeed);
        framesSinceReadback.current += 1;

        // Periodic stats readback
        if (framesSinceReadback.current >= STATS_READBACK_INTERVAL) {
          engine.downloadGrid(g);
          const maxSpd = computeMaxSpeed(g);
          const avgDen = computeAvgDensity(g);
          const denScale = computeMaxDensityDev(g);
          const curl = computeCurl(g);
          let maxC = 0.001;
          for (let i = 0; i < curl.length; i++) {
            const a = Math.abs(curl[i]);
            if (a > maxC) maxC = a;
          }
          setSim((prev) => ({
            ...prev,
            iteration:
              prev.iteration +
              STATS_READBACK_INTERVAL * prev.stepsPerFrame,
            maxSpeed: maxSpd,
            avgDensity: avgDen,
            maxCurl: maxC,
            densityScale: denScale,
          }));
          framesSinceReadback.current = 0;
        }
      } else {
        // CPU path
        for (let i = 0; i < s.stepsPerFrame; i++) {
          stepLBM(g, s.viscosity, s.inletSpeed);
        }
        const maxSpd = computeMaxSpeed(g);
        const avgDen = computeAvgDensity(g);
        setSim((prev) => ({
          ...prev,
          iteration: prev.iteration + prev.stepsPerFrame,
          maxSpeed: maxSpd,
          avgDensity: avgDen,
        }));
        setRenderTick((t) => t + 1);
      }

      measureFps();
      frameId = requestAnimationFrame(loop);
    };
    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [sim.isRunning, sim.computeMode, measureFps]);

  // --- Callbacks ---

  const handleLoadPreset = useCallback((index: number) => {
    const preset = presets[index];
    const s = simRef.current;
    const { rows, cols } = gridSizes[s.activeGridSizeIndex];
    const g = preset.build(rows, cols);
    gridRef.current = g;

    if (engineRef.current) {
      engineRef.current.uploadGrid(g);
      framesSinceReadback.current = 0;
    }

    setSim((prev) => ({
      ...prev,
      iteration: 0,
      viscosity: preset.viscosity,
      inletSpeed: preset.inletSpeed,
      maxSpeed: computeMaxSpeed(g),
      avgDensity: computeAvgDensity(g),
    }));
    setRenderTick((t) => t + 1);
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

    if (s.computeMode === "gpu" && engineRef.current) {
      engineRef.current.step(s.stepsPerFrame, s.viscosity, s.inletSpeed);
      engineRef.current.downloadGrid(g);
    } else {
      for (let i = 0; i < s.stepsPerFrame; i++) {
        stepLBM(g, s.viscosity, s.inletSpeed);
      }
    }

    const maxSpd = computeMaxSpeed(g);
    const avgDen = computeAvgDensity(g);
    setSim((prev) => ({
      ...prev,
      iteration: prev.iteration + prev.stepsPerFrame,
      maxSpeed: maxSpd,
      avgDensity: avgDen,
    }));
    setRenderTick((t) => t + 1);
  }, []);

  const handleClearBarriers = useCallback(() => {
    clearBarriers(gridRef.current);
    if (engineRef.current) {
      engineRef.current.updateBarriers(gridRef.current.barriers);
    }
    setRenderTick((t) => t + 1);
  }, []);

  const handleResetFlow = useCallback(() => {
    const s = simRef.current;
    const g = gridRef.current;
    resetFlow(g, s.inletSpeed);

    if (engineRef.current) {
      engineRef.current.uploadGrid(g);
      framesSinceReadback.current = 0;
    }

    setSim((prev) => ({
      ...prev,
      iteration: 0,
      maxSpeed: computeMaxSpeed(g),
      avgDensity: computeAvgDensity(g),
    }));
    setRenderTick((t) => t + 1);
  }, []);

  const handleBarrierPaint = useCallback(
    (row: number, col: number, solid: boolean) => {
      setBarrier(gridRef.current, row, col, solid);
      if (engineRef.current) {
        engineRef.current.updateBarriers(gridRef.current.barriers);
      }
      setRenderTick((t) => t + 1);
    },
    [],
  );

  const handleViscosityChange = useCallback((value: number) => {
    setSim((prev) => ({ ...prev, viscosity: value }));
  }, []);

  const handleInletSpeedChange = useCallback((value: number) => {
    setSim((prev) => ({ ...prev, inletSpeed: value }));
  }, []);

  const handleVisualModeChange = useCallback((mode: VisualMode) => {
    setSim((prev) => ({ ...prev, visualMode: mode }));
  }, []);

  const handleStepsPerFrameChange = useCallback((value: number) => {
    setSim((prev) => ({ ...prev, stepsPerFrame: value }));
  }, []);

  const handleComputeModeChange = useCallback((mode: ComputeMode) => {
    const g = gridRef.current;
    const engine = engineRef.current;

    if (mode === "cpu" && engine) {
      // GPU → CPU: download state
      engine.downloadGrid(g);
    }
    // CPU → GPU: upload happens in the engine creation effect

    setSim((prev) => ({ ...prev, computeMode: mode }));
  }, []);

  const handleGridSizeChange = useCallback((index: number) => {
    const { rows, cols } = gridSizes[index];
    const s = simRef.current;
    const g = createGridWithFlow(rows, cols, s.inletSpeed);
    gridRef.current = g;

    // Engine will be recreated by the effect (activeGridSizeIndex dep)

    setSim((prev) => ({
      ...prev,
      activeGridSizeIndex: index,
      iteration: 0,
      isRunning: false,
      maxSpeed: computeMaxSpeed(g),
      avgDensity: computeAvgDensity(g),
    }));
    setRenderTick((t) => t + 1);
  }, []);

  const activeGridSize = gridSizes[sim.activeGridSizeIndex];
  const re = (sim.inletSpeed * activeGridSize.cols) / sim.viscosity;

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Canvas area */}
      <div className="flex-1 min-w-0">
        <div className="rounded-2xl border border-mc-gray/15 bg-white overflow-hidden relative">
          {sim.computeMode === "gpu" ? (
            <WebGLCanvas
              ref={webglCanvasRef}
              engine={engineRef.current}
              grid={gridRef.current}
              visualMode={sim.visualMode}
              maxSpeed={sim.maxSpeed}
              maxCurl={sim.maxCurl}
              densityScale={sim.densityScale}
              onBarrierPaint={handleBarrierPaint}
            />
          ) : (
            <Canvas
              grid={gridRef.current}
              visualMode={sim.visualMode}
              maxSpeed={sim.maxSpeed}
              onBarrierPaint={handleBarrierPaint}
            />
          )}
          {/* FPS overlay */}
          <div className="absolute top-2 right-2 bg-black/60 text-white text-xs font-mono px-2 py-1 rounded pointer-events-none">
            {sim.fps} FPS
          </div>
        </div>
        <p className="mt-2 text-xs text-mc-gray">
          Click and drag to draw barriers. Right-click to erase.
        </p>
        <div className="mt-4">
          <Explainer />
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-full lg:w-80 xl:w-96 flex flex-col gap-4 shrink-0">
        <PresetSelector onLoadPreset={handleLoadPreset} />
        <ControlPanel
          isRunning={sim.isRunning}
          stepsPerFrame={sim.stepsPerFrame}
          viscosity={sim.viscosity}
          inletSpeed={sim.inletSpeed}
          visualMode={sim.visualMode}
          computeMode={sim.computeMode}
          gpuAvailable={gpuAvailable}
          gridSizes={gridSizes}
          activeGridSizeIndex={sim.activeGridSizeIndex}
          onPlay={handlePlay}
          onPause={handlePause}
          onStep={handleStep}
          onClearBarriers={handleClearBarriers}
          onResetFlow={handleResetFlow}
          onStepsPerFrameChange={handleStepsPerFrameChange}
          onViscosityChange={handleViscosityChange}
          onInletSpeedChange={handleInletSpeedChange}
          onVisualModeChange={handleVisualModeChange}
          onComputeModeChange={handleComputeModeChange}
          onGridSizeChange={handleGridSizeChange}
        />
        <InfoPanel
          iteration={sim.iteration}
          maxSpeed={sim.maxSpeed}
          avgDensity={sim.avgDensity}
          viscosity={sim.viscosity}
          gridLabel={`${activeGridSize.cols}\u00D7${activeGridSize.rows}`}
          reynoldsNumber={re}
          fps={sim.fps}
        />
      </div>
    </div>
  );
}
