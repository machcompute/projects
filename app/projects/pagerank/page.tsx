import type { Metadata } from "next";
import { Simulation } from "@/app/components/pagerank/Simulation";

export const metadata: Metadata = {
  title: "PageRank Simulation — Interactive Graph Algorithm Visualizer",
  description:
    "Explore Google's PageRank algorithm through an interactive directed-graph simulation.",
};

export default function PageRankPage() {
  return <Simulation />;
}
