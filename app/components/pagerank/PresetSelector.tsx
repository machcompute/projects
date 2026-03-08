"use client";

import { presets } from "@/app/lib/graph-presets";

interface PresetSelectorProps {
  onLoadPreset: (index: number) => void;
}

export function PresetSelector({ onLoadPreset }: PresetSelectorProps) {
  return (
    <div className="rounded-2xl border border-mc-gray/15 bg-white p-5">
      <h3 className="text-sm font-semibold text-mc-dark uppercase tracking-wide mb-3">
        Example Graphs
      </h3>
      <div className="flex flex-wrap gap-2">
        {presets.map((preset, i) => (
          <button
            key={preset.name}
            onClick={() => onLoadPreset(i)}
            className="rounded-full bg-mc-lavender/15 text-mc-dark/70 text-sm font-medium px-4 py-1.5 hover:bg-mc-lavender/25 transition-colors cursor-pointer"
            title={preset.description}
          >
            {preset.name}
          </button>
        ))}
      </div>
    </div>
  );
}
