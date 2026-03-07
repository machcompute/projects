"use client";

export function CAExplainer() {
  return (
    <div className="rounded-2xl border border-mc-gray/15 bg-white p-5">
      <h3 className="text-sm font-semibold text-mc-dark uppercase tracking-wide mb-4">
        How Cellular Automata Work
      </h3>
      <div className="space-y-3 text-sm text-mc-gray leading-relaxed">
        <p>
          A cellular automaton is a grid of cells, each either alive or dead.
          Every generation, each cell counts its 8 neighbors (Moore
          neighborhood) and applies a rule to determine its next state.
        </p>
        <div className="rounded-lg bg-mc-dark/[0.03] px-4 py-3 font-mono text-xs text-mc-dark leading-relaxed">
          B3/S23 &rarr; Birth if 3 neighbors, Survive if 2 or 3
        </div>
        <ul className="space-y-1.5 pl-4">
          <li className="flex gap-2">
            <span className="font-mono text-mc-dark font-semibold shrink-0">B</span>
            <span>Birth — a dead cell becomes alive if it has exactly this many live neighbors.</span>
          </li>
          <li className="flex gap-2">
            <span className="font-mono text-mc-dark font-semibold shrink-0">S</span>
            <span>Survival — a live cell stays alive if it has this many live neighbors. Otherwise it dies.</span>
          </li>
        </ul>
        <p>
          Conway&apos;s Game of Life (B3/S23) is the most famous example.
          Simple rules produce gliders, oscillators, and even Turing-complete
          computation.
        </p>
      </div>
    </div>
  );
}
