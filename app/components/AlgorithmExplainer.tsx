"use client";

export function AlgorithmExplainer() {
  return (
    <details className="rounded-2xl border border-mc-gray/15 bg-white p-5 group">
      <summary className="text-sm font-semibold text-mc-dark uppercase tracking-wide cursor-pointer select-none list-none flex items-center justify-between">
        How PageRank Works
        <svg
          className="w-4 h-4 text-mc-gray transition-transform group-open:rotate-180"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </summary>
      <div className="mt-4 space-y-3 text-sm text-mc-gray leading-relaxed">
        <p>
          PageRank, developed by Larry Page and Sergey Brin at Stanford, ranks
          web pages by the structure of incoming links. A page is important if
          important pages link to it.
        </p>
        <div className="rounded-lg bg-mc-dark/[0.03] px-4 py-3 font-mono text-xs text-mc-dark leading-relaxed">
          PR(i) = (1 - d) / N + d &times; &Sigma; PR(j) / L(j)
        </div>
        <ul className="space-y-1.5 pl-4">
          <li className="flex gap-2">
            <span className="font-mono text-mc-dark font-semibold shrink-0">d</span>
            <span>Damping factor (default 0.85) — probability of following a link vs. jumping randomly.</span>
          </li>
          <li className="flex gap-2">
            <span className="font-mono text-mc-dark font-semibold shrink-0">N</span>
            <span>Total number of pages (nodes) in the graph.</span>
          </li>
          <li className="flex gap-2">
            <span className="font-mono text-mc-dark font-semibold shrink-0">L(j)</span>
            <span>Number of outgoing links from page j.</span>
          </li>
        </ul>
        <p>
          The algorithm iterates until scores converge (change less than
          0.0001 per iteration). Node size in the visualization reflects each
          page&apos;s current rank.
        </p>
      </div>
    </details>
  );
}
