import type { Metadata } from "next";
import Link from "next/link";
import { PageRankSimulation } from "@/app/components/PageRankSimulation";

export const metadata: Metadata = {
  title: "PageRank Simulation — Interactive Graph Algorithm Visualizer",
  description:
    "Explore Google's PageRank algorithm through an interactive directed-graph simulation.",
};

export default function PageRankPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-mc-gray/15">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-sm font-medium text-mc-gray/60 hover:text-mc-dark transition-colors flex items-center gap-1.5"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Home
            </Link>
            <span className="text-mc-gray/20">|</span>
            <span className="text-lg font-bold tracking-tight text-mc-dark">
              PageRank Simulator
            </span>
          </div>
          <span className="rounded-full bg-mc-lavender/15 text-mc-dark/70 text-xs font-medium px-3 py-1">
            mcompute
          </span>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <PageRankSimulation />
      </main>
    </div>
  );
}
