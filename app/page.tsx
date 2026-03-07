import { projects } from "@/app/lib/projects";
import { ProjectCard } from "@/app/components/ProjectCard";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-mc-gray/15">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center">
          <span className="text-lg font-bold tracking-tight text-mc-dark">
            Mach Computing
          </span>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-20 pb-16 lg:pt-32 lg:pb-28">
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight text-mc-dark">
            Interactive{" "}
            <span className="text-mc-lavender">Algorithm</span>{" "}
            <span className="text-mc-mint">Simulations</span>
          </h1>
          <p className="mt-6 text-lg text-mc-gray leading-relaxed max-w-lg">
            Explore classic computer science algorithms through hands-on,
            visual experiments. Click, drag, and discover how they work.
          </p>
        </div>
      </section>

      {/* Projects */}
      <section className="py-20 lg:py-28 bg-mc-dark/[0.02]">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl sm:text-4xl font-bold text-mc-dark tracking-tight">
            Projects
          </h2>
          <p className="mt-3 text-lg text-mc-gray leading-relaxed max-w-2xl">
            Each project is a self-contained interactive visualization you can
            explore right in your browser.
          </p>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <ProjectCard key={project.slug} project={project} />
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-mc-dark text-white py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between gap-10">
            <div>
              <span className="font-bold text-lg tracking-tight">
                Mach Computing
              </span>
              <p className="mt-2 text-sm text-white/50">
                Algorithm simulations at mach speed.
              </p>
            </div>
            <div className="flex gap-12">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-4">
                  Navigation
                </h4>
                <ul className="space-y-2">
                  {projects.map((p) => (
                    <li key={p.slug}>
                      <a
                        href={p.url}
                        className="text-sm text-white/60 hover:text-white transition-colors"
                      >
                        {p.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-4">
                  API
                </h4>
                <ul className="space-y-2">
                  <li>
                    <a
                      href="/api/projects"
                      className="text-sm text-white/60 hover:text-white transition-colors"
                    >
                      /api/projects
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="mt-12 pt-6 border-t border-white/10 text-xs text-white/30">
            Mach Computing
          </div>
        </div>
      </footer>
    </div>
  );
}
