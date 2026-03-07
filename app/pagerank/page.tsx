import type { Metadata } from "next";
import Image from "next/image";
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
              className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
            >
              <Image src="/logo.png" alt="Mach Computing" width={36} height={36} />
              <Image
                src="/text_logo.png"
                alt="MACHCOMPUTING"
                width={160}
                height={20}
                className="hidden sm:block"
              />
            </Link>
            <span className="text-mc-gray/20">|</span>
            <span className="text-lg font-bold tracking-tight text-mc-dark">
              PageRank Simulator
            </span>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <PageRankSimulation />
      </main>
    </div>
  );
}
