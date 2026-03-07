export interface Project {
  name: string;
  slug: string;
  description: string;
  url: string;
  tags: string[];
  year: number;
}

export const projects: Project[] = [
  {
    name: "PageRank Simulation",
    slug: "pagerank",
    description:
      "Explore Google's PageRank algorithm through an interactive directed-graph simulation. Add nodes, create links, and watch rank propagate in real time.",
    url: "/projects/pagerank",
    tags: ["TypeScript", "Next.js", "Canvas API", "Graph Algorithms"],
    year: 2026,
  },
  {
    name: "Cellular Automata",
    slug: "cellular-automata",
    description:
      "Simulate 2D cellular automata including Conway's Game of Life. Draw patterns, switch rule sets, and watch emergent behavior unfold on a toroidal grid.",
    url: "/projects/cellular-automata",
    tags: ["TypeScript", "Next.js", "Canvas API", "Cellular Automata"],
    year: 2026,
  },
];
