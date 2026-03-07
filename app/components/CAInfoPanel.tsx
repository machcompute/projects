"use client";

interface CAInfoPanelProps {
  generation: number;
  population: number;
  totalCells: number;
  ruleName: string;
  ruleNotation: string;
}

export function CAInfoPanel({
  generation,
  population,
  totalCells,
  ruleName,
  ruleNotation,
}: CAInfoPanelProps) {
  const density = totalCells > 0 ? ((population / totalCells) * 100).toFixed(1) : "0.0";

  return (
    <div className="rounded-2xl border border-mc-gray/15 bg-white p-5">
      <h3 className="text-sm font-semibold text-mc-dark uppercase tracking-wide mb-4">
        Statistics
      </h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <span className="text-xs text-mc-gray">Generation</span>
          <p className="text-lg font-mono font-bold text-mc-dark">{generation}</p>
        </div>
        <div>
          <span className="text-xs text-mc-gray">Population</span>
          <p className="text-lg font-mono font-bold text-mc-dark">{population}</p>
        </div>
        <div>
          <span className="text-xs text-mc-gray">Density</span>
          <p className="text-lg font-mono font-bold text-mc-dark">{density}%</p>
        </div>
        <div>
          <span className="text-xs text-mc-gray">Rule</span>
          <p className="text-sm font-mono font-bold text-mc-dark">{ruleNotation}</p>
          <p className="text-xs text-mc-gray mt-0.5">{ruleName}</p>
        </div>
      </div>
    </div>
  );
}
