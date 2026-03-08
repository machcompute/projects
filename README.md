# Mach Computing -- Projects

Interactive algorithm simulations built with Next.js, React and the Canvas API. Each project is a self-contained visualization that runs entirely in the browser.

**Live at** [projects.machcomputing.com](https://projects.machcomputing.com)

## Projects

### PageRank Simulation

Interactive directed-graph visualization of Google's PageRank algorithm. Add nodes, draw edges, and watch rank propagate in real time.

`/projects/pagerank`

### Cellular Automata

2D cellular automata simulator supporting multiple rule sets (Conway's Game of Life, HighLife, Seeds, and more). Draw patterns, toggle toroidal wrapping, and observe emergent behavior.

`/projects/cellular-automata`

### Lattice Boltzmann Fluid Simulation

Interactive D2Q9 Lattice Boltzmann fluid simulator. Draw obstacles in a flow channel, adjust viscosity and inlet speed, and visualize velocity, vorticity, and density fields in real time.

`/projects/lattice-boltzmann`

## Stack

- **Next.js 16** with App Router
- **React 19**
- **TypeScript**
- **Tailwind CSS 4**
- **Canvas API** for all rendering

## Getting Started

```bash
npm install
npm run dev
```

Open [localhost:3000](http://localhost:3000).

## Project Structure

```
app/
  components/
    pagerank/            # PageRank UI components
    cellular-automata/   # Cellular Automata UI components
    lattice-boltzmann/   # Lattice Boltzmann UI components
    ProjectCard.tsx      # Shared card component
  lib/
    pagerank/            # Graph types, renderer, force layout, presets
    cellular-automata/   # Grid types, renderer, rules, presets
    lattice-boltzmann/   # LBM algorithm, renderer, presets
    projects.ts          # Project metadata
  projects/
    layout.tsx           # Shared layout (header + main wrapper)
    pagerank/page.tsx
    cellular-automata/page.tsx
    lattice-boltzmann/page.tsx
  page.tsx             # Landing page
```
