"use client";

interface InfoPanelProps {
  nodes: { id: string; label: string; rank: number }[];
  iteration: number;
  convergenceDelta: number;
  hasConverged: boolean;
}

export function InfoPanel({
  nodes,
  iteration,
  convergenceDelta,
  hasConverged,
}: InfoPanelProps) {
  const sorted = [...nodes].sort((a, b) => b.rank - a.rank);
  const maxRank = sorted.length > 0 ? sorted[0].rank : 1;

  return (
    <div className="rounded-2xl border border-mc-gray/15 bg-white p-5">
      <h3 className="text-sm font-semibold text-mc-dark uppercase tracking-wide mb-4">
        Rankings
      </h3>

      <div className="flex gap-6 mb-4">
        <div>
          <span className="text-xs text-mc-gray">Iteration</span>
          <p className="text-lg font-mono font-bold text-mc-dark">{iteration}</p>
        </div>
        <div>
          <span className="text-xs text-mc-gray">Max &Delta;</span>
          <p
            className={`text-lg font-mono font-bold ${
              hasConverged ? "text-mc-mint" : "text-mc-dark"
            }`}
          >
            {convergenceDelta.toFixed(6)}
          </p>
        </div>
        {hasConverged && (
          <span className="self-end text-xs font-medium px-2.5 py-0.5 rounded-full bg-mc-mint/20 text-mc-dark/70 mb-1">
            Converged
          </span>
        )}
      </div>

      {sorted.length === 0 ? (
        <p className="text-sm text-mc-gray">Add nodes to see rankings.</p>
      ) : (
        <div className="space-y-2">
          {sorted.map((node) => (
            <div key={node.id} className="flex items-center gap-3">
              <span className="w-6 text-right font-mono text-xs text-mc-gray shrink-0">
                {node.label}
              </span>
              <div className="flex-1 h-5 rounded-full bg-mc-lime/30 overflow-hidden">
                <div
                  className="h-full rounded-full bg-mc-mint"
                  style={{
                    width: `${maxRank > 0 ? (node.rank / maxRank) * 100 : 0}%`,
                    transition: "width 300ms ease",
                  }}
                />
              </div>
              <span className="font-mono text-xs text-mc-dark w-14 text-right shrink-0">
                {node.rank.toFixed(4)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
