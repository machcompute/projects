"use client";

import type { GridSize } from "@/app/lib/ca-types";

interface CAControlPanelProps {
  isRunning: boolean;
  speed: number;
  wrapMode: boolean;
  gridSizes: GridSize[];
  activeGridSizeIndex: number;
  onPlay: () => void;
  onPause: () => void;
  onStep: () => void;
  onClear: () => void;
  onRandomFill: () => void;
  onSpeedChange: (speed: number) => void;
  onWrapToggle: () => void;
  onGridSizeChange: (index: number) => void;
}

export function CAControlPanel({
  isRunning,
  speed,
  wrapMode,
  gridSizes,
  activeGridSizeIndex,
  onPlay,
  onPause,
  onStep,
  onClear,
  onRandomFill,
  onSpeedChange,
  onWrapToggle,
  onGridSizeChange,
}: CAControlPanelProps) {
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
          onClick={onClear}
          className="flex-1 px-4 py-2 rounded-full border border-mc-gray/15 text-sm font-medium text-mc-dark hover:bg-mc-dark/[0.03] transition-colors cursor-pointer"
        >
          Clear
        </button>
        <button
          onClick={onRandomFill}
          className="flex-1 px-4 py-2 rounded-full border border-mc-gray/15 text-sm font-medium text-mc-dark hover:bg-mc-dark/[0.03] transition-colors cursor-pointer"
        >
          Random
        </button>
      </div>

      {/* Speed */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs text-mc-gray">Speed</label>
          <span className="text-xs font-mono text-mc-dark">{speed}ms</span>
        </div>
        <input
          type="range"
          min={50}
          max={1000}
          step={50}
          value={speed}
          onChange={(e) => onSpeedChange(Number(e.target.value))}
          className="w-full accent-mc-mint"
        />
        <div className="flex justify-between text-[10px] text-mc-gray/60 mt-0.5">
          <span>Fast</span>
          <span>Slow</span>
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

      {/* Wrap toggle */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-mc-gray">Toroidal Wrap</span>
        <button
          onClick={onWrapToggle}
          className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${
            wrapMode ? "bg-mc-mint" : "bg-mc-gray/20"
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
              wrapMode ? "translate-x-5" : ""
            }`}
          />
        </button>
      </div>
    </div>
  );
}
