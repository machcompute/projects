"use client";

import { useRef } from "react";
import type { VisualMode, ComputeMode, GridSize } from "@/app/lib/lattice-boltzmann/types";

interface ControlPanelProps {
  isRunning: boolean;
  stepsPerFrame: number;
  viscosity: number;
  inletSpeed: number;
  visualMode: VisualMode;
  computeMode: ComputeMode;
  gpuAvailable: boolean;
  gridSizes: GridSize[];
  activeGridSizeIndex: number;
  onPlay: () => void;
  onPause: () => void;
  onStep: () => void;
  onClearBarriers: () => void;
  onResetFlow: () => void;
  onStepsPerFrameChange: (value: number) => void;
  onViscosityChange: (value: number) => void;
  onInletSpeedChange: (value: number) => void;
  onVisualModeChange: (mode: VisualMode) => void;
  onComputeModeChange: (mode: ComputeMode) => void;
  onGridSizeChange: (index: number) => void;
  onExportBarriers: () => void;
  onImportBarriers: (file: File) => void;
}

const visualModes: { value: VisualMode; label: string }[] = [
  { value: "speed", label: "Speed" },
  { value: "curl", label: "Curl" },
  { value: "density", label: "Density" },
];

export function ControlPanel({
  isRunning,
  stepsPerFrame,
  viscosity,
  inletSpeed,
  visualMode,
  computeMode,
  gpuAvailable,
  gridSizes,
  activeGridSizeIndex,
  onPlay,
  onPause,
  onStep,
  onClearBarriers,
  onResetFlow,
  onStepsPerFrameChange,
  onViscosityChange,
  onInletSpeedChange,
  onVisualModeChange,
  onComputeModeChange,
  onGridSizeChange,
  onExportBarriers,
  onImportBarriers,
}: ControlPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="rounded-2xl border border-mc-gray/15 bg-white p-5 space-y-5">
      <h3 className="text-sm font-semibold text-mc-dark uppercase tracking-wide">
        Controls
      </h3>

      {/* Playback */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={isRunning ? onPause : onPlay}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-mc-dark text-white font-medium text-sm hover:bg-mc-dark/85 transition-colors cursor-pointer"
        >
          {isRunning ? (
            <>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
              Pause
            </>
          ) : (
            <>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
              Play
            </>
          )}
        </button>
        <button
          onClick={onStep}
          disabled={isRunning}
          className="px-4 py-2 rounded-full border border-mc-gray/15 text-sm font-medium text-mc-dark hover:bg-mc-dark/[0.03] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          Step
        </button>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onClearBarriers}
          className="flex-1 px-4 py-2 rounded-full border border-mc-gray/15 text-sm font-medium text-mc-dark hover:bg-mc-dark/[0.03] transition-colors cursor-pointer"
        >
          Clear Barriers
        </button>
        <button
          onClick={onResetFlow}
          className="flex-1 px-4 py-2 rounded-full border border-mc-gray/15 text-sm font-medium text-mc-dark hover:bg-mc-dark/[0.03] transition-colors cursor-pointer"
        >
          Reset Flow
        </button>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onExportBarriers}
          className="flex-1 px-4 py-2 rounded-full border border-mc-gray/15 text-sm font-medium text-mc-dark hover:bg-mc-dark/[0.03] transition-colors cursor-pointer"
        >
          Export Map
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 px-4 py-2 rounded-full border border-mc-gray/15 text-sm font-medium text-mc-dark hover:bg-mc-dark/[0.03] transition-colors cursor-pointer"
        >
          Import Map
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onImportBarriers(file);
            e.target.value = "";
          }}
        />
      </div>

      {/* Visualization mode */}
      <div>
        <label className="text-xs text-mc-gray mb-1.5 block">
          Visualization
        </label>
        <div className="flex flex-wrap gap-1.5">
          {visualModes.map((m) => (
            <button
              key={m.value}
              onClick={() => onVisualModeChange(m.value)}
              className={`rounded-full text-xs font-medium px-3 py-1 transition-colors cursor-pointer ${
                visualMode === m.value
                  ? "bg-mc-dark text-white"
                  : "bg-mc-lavender/15 text-mc-dark/70 hover:bg-mc-lavender/25"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Compute mode */}
      <div>
        <label className="text-xs text-mc-gray mb-1.5 block">Compute</label>
        <div className="flex flex-wrap gap-1.5">
          {(["cpu", "gpu"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => onComputeModeChange(mode)}
              disabled={mode === "gpu" && !gpuAvailable}
              className={`rounded-full text-xs font-medium px-3 py-1 transition-colors ${
                computeMode === mode
                  ? "bg-mc-dark text-white"
                  : "bg-mc-lavender/15 text-mc-dark/70 hover:bg-mc-lavender/25"
              } ${mode === "gpu" && !gpuAvailable ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
              title={
                mode === "gpu" && !gpuAvailable
                  ? "WebGL2 with float textures not available"
                  : undefined
              }
            >
              {mode.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Steps per frame */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs text-mc-gray">Steps / Frame</label>
          <span className="text-xs font-mono text-mc-dark">{stepsPerFrame}</span>
        </div>
        <input
          type="range"
          min={1}
          max={20}
          step={1}
          value={stepsPerFrame}
          onChange={(e) => onStepsPerFrameChange(Number(e.target.value))}
          className="w-full accent-mc-mint"
        />
        <div className="flex justify-between text-[10px] text-mc-gray/60 mt-0.5">
          <span>Slow</span>
          <span>Fast</span>
        </div>
      </div>

      {/* Viscosity */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs text-mc-gray">Viscosity</label>
          <span className="text-xs font-mono text-mc-dark">
            {viscosity.toFixed(3)}
          </span>
        </div>
        <input
          type="range"
          min={0.005}
          max={0.3}
          step={0.005}
          value={viscosity}
          onChange={(e) => onViscosityChange(Number(e.target.value))}
          className="w-full accent-mc-mint"
        />
        <div className="flex justify-between text-[10px] text-mc-gray/60 mt-0.5">
          <span>Turbulent</span>
          <span>Laminar</span>
        </div>
      </div>

      {/* Inlet speed */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs text-mc-gray">Inlet Speed</label>
          <span className="text-xs font-mono text-mc-dark">
            {inletSpeed.toFixed(3)}
          </span>
        </div>
        <input
          type="range"
          min={0.01}
          max={0.15}
          step={0.005}
          value={inletSpeed}
          onChange={(e) => onInletSpeedChange(Number(e.target.value))}
          className="w-full accent-mc-mint"
        />
        <div className="flex justify-between text-[10px] text-mc-gray/60 mt-0.5">
          <span>Slow</span>
          <span>Fast</span>
        </div>
      </div>

      {/* Grid size */}
      <div>
        <label className="text-xs text-mc-gray mb-1.5 block">Grid Size</label>
        <div className="flex flex-wrap gap-1.5">
          {gridSizes.map((size, i) => (
            <button
              key={size.label}
              onClick={() => onGridSizeChange(i)}
              className={`rounded-full text-xs font-medium px-3 py-1 transition-colors cursor-pointer ${
                i === activeGridSizeIndex
                  ? "bg-mc-dark text-white"
                  : "bg-mc-lavender/15 text-mc-dark/70 hover:bg-mc-lavender/25"
              }`}
            >
              {size.cols}&times;{size.rows}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
