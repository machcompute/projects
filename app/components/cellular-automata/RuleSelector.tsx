"use client";

import { rules } from "@/app/lib/ca-rules";

interface RuleSelectorProps {
  activeRuleIndex: number;
  onRuleChange: (index: number) => void;
}

export function RuleSelector({ activeRuleIndex, onRuleChange }: RuleSelectorProps) {
  return (
    <div className="rounded-2xl border border-mc-gray/15 bg-white p-5">
      <h3 className="text-sm font-semibold text-mc-dark uppercase tracking-wide mb-3">
        Rule Set
      </h3>
      <div className="flex flex-wrap gap-2">
        {rules.map((rule, i) => (
          <button
            key={rule.name}
            onClick={() => onRuleChange(i)}
            className={`rounded-full text-sm font-medium px-4 py-1.5 transition-colors cursor-pointer ${
              i === activeRuleIndex
                ? "bg-mc-dark text-white"
                : "bg-mc-lavender/15 text-mc-dark/70 hover:bg-mc-lavender/25"
            }`}
            title={`${rule.notation} — ${rule.description}`}
          >
            {rule.name}
          </button>
        ))}
      </div>
    </div>
  );
}
