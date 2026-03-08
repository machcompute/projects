import type { Metadata } from "next";
import { Simulation } from "@/app/components/lattice-boltzmann/Simulation";

export const metadata: Metadata = {
  title: "Lattice Boltzmann Fluid Simulation — Interactive CFD",
  description:
    "Simulate fluid dynamics using the Lattice Boltzmann Method. Draw obstacles, adjust viscosity, and watch vortex shedding emerge in real time.",
};

export default function LatticeBoltzmannPage() {
  return <Simulation />;
}
