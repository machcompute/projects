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
    url: "/pagerank",
    tags: ["TypeScript", "Next.js", "Canvas API", "Graph Algorithms"],
    year: 2026,
  },
];
