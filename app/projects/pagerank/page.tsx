import type { Metadata } from "next";
import { PageRankSimulation } from "@/app/components/PageRankSimulation";

export const metadata: Metadata = {
  title: "PageRank Simulation — Interactive Graph Algorithm Visualizer",
  description:
    "Explore Google's PageRank algorithm through an interactive directed-graph simulation.",
};

export default function PageRankPage() {
  return <PageRankSimulation />;
}
