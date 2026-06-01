import type { Metadata } from "next";


export const metadata: Metadata = { title: "项目" };

const SAMPLE = [
  {
    name: "Hypervoid",
    description: "你正在浏览的这个博客本身——Next.js 16 + MDX 全栈博客。",
    link: "https://github.com/HyperCharon/hypervoid",
    tags: ["Next.js", "TypeScript", "MDX"],
  },
];

export default function ProjectsPage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="hv-panel relative overflow-hidden p-5 sm:p-7">
        <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent" />
        <div aria-hidden className="absolute left-0 top-0 h-8 w-8 border-l border-t border-accent/40" />
        <div aria-hidden className="absolute right-0 top-0 h-2 w-2 rounded-full bg-accent animate-pulse" />
        <p className="hv-kicker">Projects / Code_Repository</p>
        <h1 className="hv-title mt-2 text-3xl font-black uppercase tracking-tight sm:text-4xl">
          项目
        </h1>
        <p className="mt-3 text-sm text-muted">
          公开发布的开源项目、个人作品与正在进行中的实验。
        </p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2">
        {SAMPLE.map((project) => (
          <a
            key={project.name}
            href={project.link}
            target="_blank"
            rel="noreferrer noopener"
            className="group hv-card flex flex-col gap-2 p-5 transition-all duration-300"
          >
            <h3 className="text-lg font-semibold text-foreground group-hover:text-foreground transition">
              {project.name}
            </h3>
            <p className="text-sm text-muted">{project.description}</p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {project.tags.map((tag) => (
                <span
                  key={tag}
                  className="hv-chip-sci text-[11px]"
                >
                  {tag}
                </span>
              ))}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
