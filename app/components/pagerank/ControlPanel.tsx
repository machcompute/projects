"use client";

interface ControlPanelProps {
  isRunning: boolean;
  speed: number;
  dampingFactor: number;
  hasConverged: boolean;
  selectedNodeId: string | null;
  onPlay: () => void;
  onPause: () => void;
  onStep: () => void;
  onReset: () => void;
  onSpeedChange: (speed: number) => void;
  onDampingChange: (damping: number) => void;
  onDeleteSelected: () => void;
}

export function ControlPanel({
  isRunning,
  speed,
  dampingFactor,
  hasConverged,
  selectedNodeId,
  onPlay,
  onPause,
  onStep,
  onReset,
  onSpeedChange,
  onDampingChange,
  onDeleteSelected,
}: ControlPanelProps) {
  return (
    <div className="rounded-2xl border border-mc-gray/15 bg-white p-5 space-y-5">
      <h3 className="text-sm font-semibold text-mc-dark uppercase tracking-wide">
        Controls
      </h3>

      {/* Playback */}
      <div className="flex gap-2">
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
              {hasConverged ? "Converged" : "Play"}
            </>
          )}
        </button>
        <button
          onClick={onStep}
          disabled={isRunning || hasConverged}
          className="px-4 py-2 rounded-full border border-mc-gray/15 text-sm font-medium text-mc-dark hover:bg-mc-dark/[0.03] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          Step
        </button>
        <button
          onClick={onReset}
          className="px-4 py-2 rounded-full border border-mc-gray/15 text-sm font-medium text-mc-dark hover:bg-mc-dark/[0.03] transition-colors cursor-pointer"
        >
          Reset
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
          max={2000}
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

      {/* Damping */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs text-mc-gray">Damping Factor</label>
          <span className="text-xs font-mono text-mc-dark">
            {dampingFactor.toFixed(2)}
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={dampingFactor}
          onChange={(e) => onDampingChange(Number(e.target.value))}
          className="w-full accent-mc-lavender"
        />
      </div>

      {/* Delete selected */}
      {selectedNodeId && (
        <button
          onClick={onDeleteSelected}
          className="w-full px-4 py-2 rounded-full border border-red-200 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
        >
          Delete Node {selectedNodeId}
        </button>
      )}
    </div>
  );
}
