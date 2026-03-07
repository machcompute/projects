import Link from "next/link";
import type { Project } from "@/app/lib/projects";

export function ProjectCard({ project }: { project: Project }) {
  return (
    <Link
      href={project.url}
      className="group block p-6 rounded-2xl border border-mc-gray/15 bg-white hover:border-mc-mint/40 transition-colors"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-mc-dark">
              {project.name}
            </h3>
            <span className="shrink-0 text-xs font-mono text-mc-gray/50">
              {project.year}
            </span>
          </div>
          <p className="mt-2 text-sm text-mc-gray leading-relaxed">
            {project.description}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {project.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs font-medium px-2.5 py-1 rounded-full bg-mc-lavender/15 text-mc-dark/70 border border-mc-lavender/20"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
        <svg
          className="shrink-0 w-5 h-5 text-mc-gray/40 group-hover:text-mc-mint transition-colors mt-1"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 5l7 7-7 7"
          />
        </svg>
      </div>
    </Link>
  );
}
