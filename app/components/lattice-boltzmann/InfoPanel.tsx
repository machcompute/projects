"use client";

interface InfoPanelProps {
  iteration: number;
  maxSpeed: number;
  avgDensity: number;
  viscosity: number;
  gridLabel: string;
  reynoldsNumber: number;
  fps: number;
}

export function InfoPanel({
  iteration,
  maxSpeed,
  avgDensity,
  viscosity,
  gridLabel,
  reynoldsNumber,
  fps,
}: InfoPanelProps) {
  const tau = (3 * viscosity + 0.5).toFixed(2);

  return (
    <div className="rounded-2xl border border-mc-gray/15 bg-white p-5">
      <h3 className="text-sm font-semibold text-mc-dark uppercase tracking-wide mb-4">
        Statistics
      </h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <span className="text-xs text-mc-gray">FPS</span>
          <p className="text-lg font-mono font-bold text-mc-dark">{fps}</p>
        </div>
        <div>
          <span className="text-xs text-mc-gray">Iteration</span>
          <p className="text-lg font-mono font-bold text-mc-dark">{iteration}</p>
        </div>
        <div>
          <span className="text-xs text-mc-gray">Max Speed</span>
          <p className="text-lg font-mono font-bold text-mc-dark">
            {maxSpeed.toFixed(4)}
          </p>
        </div>
        <div>
          <span className="text-xs text-mc-gray">Avg Density</span>
          <p className="text-lg font-mono font-bold text-mc-dark">
            {avgDensity.toFixed(4)}
          </p>
        </div>
        <div>
          <span className="text-xs text-mc-gray">&tau;</span>
          <p className="text-lg font-mono font-bold text-mc-dark">{tau}</p>
        </div>
        <div>
          <span className="text-xs text-mc-gray">Grid</span>
          <p className="text-sm font-mono font-bold text-mc-dark">{gridLabel}</p>
        </div>
        <div>
          <span className="text-xs text-mc-gray">Re</span>
          <p className="text-lg font-mono font-bold text-mc-dark">
            {reynoldsNumber < 10000 ? reynoldsNumber.toFixed(0) : "9999+"}
          </p>
        </div>
      </div>
    </div>
  );
}
