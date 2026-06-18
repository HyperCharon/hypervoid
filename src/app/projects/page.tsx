import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "项目" };

const PROJECTS = [
  {
    name: "Hypervoid",
    description:
      "你正在浏览的这个博客本身——从空目录搭建的 Next.js 16 + MDX 全栈博客，Postgres 存文章、Vercel Blob 存图片、GitHub Discussions 做评论。",
    link: "https://github.com/HyperCharon/hypervoid",
    tags: ["Next.js", "TypeScript", "MDX", "Postgres"],
  },
  {
    name: "MatForge",
    description:
      "面向工程计算的 MATLAB 工具箱，涵盖出图美化、工程计算器、批量仿真、数据处理、Simulink 辅助六大模块，55 个函数、约 10000 行代码。",
    link: "https://github.com/HyperCharon/matlab-toolkit",
    tags: ["MATLAB", "工程计算", "仿真", "数据处理"],
  },
  {
    name: "PID Lab",
    description:
      "PID 控制仿真与调试平台——后端 FastAPI + WebSocket 实时推送，前端 Canvas 绘制示波器波形，支持多种 PID 算法、被控对象模型和自动整定方法。",
    link: "https://github.com/HyperCharon/pid-lab",
    tags: ["Python", "FastAPI", "WebSocket", "Canvas", "控制工程"],
  },
  {
    name: "Spine 看板娘管线",
    description:
      "博客看板娘的完整修复流程：将 Spine 3.6.39 的 .skel 二进制资源转 JSON，接入官方 runtime 渲染，解决 atlas 路径归一和视口裁剪问题。",
    link: "/posts/spine36-mascot-pipeline",
    tags: ["Spine", "Next.js", "Canvas", "前端"],
  },
  {
    name: "MathFlow",
    description:
      "一站式数学建模 Python 工具库——31 个模块、105+ 算法、245 个单元测试，覆盖评价、预测、优化、图论、仿真、统计、ML、博弈论全链路，统一 API 开箱即用。",
    link: "https://github.com/HyperCharon/mathematical-modeling",
    tags: ["Python", "数学建模", "算法", "NumPy"],
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
        {PROJECTS.map((project) => {
          const isExternal = project.link.startsWith("http");
          const card = (
            <>
              <h3 className="text-lg font-semibold text-foreground group-hover:text-foreground transition">
                {project.name}
              </h3>
              <p className="text-sm text-muted">{project.description}</p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {project.tags.map((tag) => (
                  <span key={tag} className="hv-chip-sci text-[11px]">
                    {tag}
                  </span>
                ))}
              </div>
            </>
          );
          return isExternal ? (
            <a
              key={project.name}
              href={project.link}
              target="_blank"
              rel="noreferrer noopener"
              className="group hv-card flex flex-col gap-2 p-5 transition-all duration-300"
            >
              {card}
            </a>
          ) : (
            <Link
              key={project.name}
              href={project.link}
              className="group hv-card flex flex-col gap-2 p-5 transition-all duration-300"
            >
              {card}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
