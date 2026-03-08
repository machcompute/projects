import type { Metadata } from "next";
import { Simulation } from "@/app/components/cellular-automata/Simulation";

export const metadata: Metadata = {
  title: "Cellular Automata — Interactive Grid Simulation",
  description:
    "Explore 2D cellular automata including Conway's Game of Life through an interactive grid simulation.",
};

export default function CellularAutomataPage() {
  return <Simulation />;
}
