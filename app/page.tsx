import Image from "next/image";
import { projects } from "@/app/lib/projects";
import { ProjectCard } from "@/app/components/ProjectCard";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-mc-gray/15">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center gap-3">
          <a href="https://machcomputing.com" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <Image src="/logo.png" alt="Mach Computing" width={36} height={36} />
            <Image
              src="/text_logo.png"
              alt="MACHCOMPUTING"
              width={160}
              height={20}
              className="hidden sm:block"
            />
          </a>
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
      <section id="projects" className="py-20 lg:py-28 bg-mc-dark/[0.02]">
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
              <div className="flex items-center gap-3">
                <Image
                  src="/logo.png"
                  alt="MACH COMPUTING"
                  width={32}
                  height={32}
                />
                <span className="font-bold text-lg tracking-tight">
                  MACH COMPUTING
                </span>
              </div>
              <p className="mt-3 text-white/50 text-sm max-w-xs">
                Engineering high-performance computing solutions.
              </p>
            </div>
            <div className="flex gap-12">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-4">
                  Navigation
                </h4>
                <div className="flex flex-col gap-2">
                  <a
                    href="/#projects"
                    className="text-sm text-white/60 hover:text-white transition-colors"
                  >
                    Projects
                  </a>
                  <a
                    href="https://machcomputing.com"
                    className="text-sm text-white/60 hover:text-white transition-colors"
                  >
                    Main Site
                  </a>
                </div>
              </div>
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-4">
                  Connect
                </h4>
                <div className="flex flex-col gap-2">
                  <a
                    href="https://github.com/LukasAfonso"
                    className="text-sm text-white/60 hover:text-white transition-colors"
                  >
                    GitHub
                  </a>
                  <a
                    href="https://www.linkedin.com/in/lu%C3%ADs-carlos-casanova-afonso-8415521b2"
                    className="text-sm text-white/60 hover:text-white transition-colors"
                  >
                    LinkedIn
                  </a>
                  <a
                    href="https://scholar.google.com/citations?user=BgSpSB0AAAAJ"
                    className="text-sm text-white/60 hover:text-white transition-colors"
                  >
                    Google Scholar
                  </a>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-12 pt-6 border-t border-white/10 text-xs text-white/30">
            &copy; {new Date().getFullYear()} MACH COMPUTING. All rights
            reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
