import type { Metadata } from "next";
import { SkillsBrowser } from "@/components/SkillsBrowser";
import { skillsData } from "@/lib/skills";

export const metadata: Metadata = {
  title: "技能",
  description: "技术栈与正在学习的方向。",
};

const CATEGORY_LABEL: Record<string, string> = {
  frontend: "前端",
  backend: "后端",
  database: "数据库",
  tools: "工具",
  other: "其他",
};

export default function SkillsPage() {
  const byCategory = new Map<string, number>();
  for (const s of skillsData) {
    byCategory.set(s.category, (byCategory.get(s.category) ?? 0) + 1);
  }
  const summary = [...byCategory.entries()].sort((a, b) => b[1] - a[1]);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8">
      <header className="hv-panel relative overflow-hidden p-5 text-center sm:p-7">
        <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent" />
        <div aria-hidden className="absolute left-0 top-0 h-8 w-8 border-l border-t border-accent/40" />
        <div aria-hidden className="absolute right-0 top-0 h-2 w-2 rounded-full bg-accent animate-pulse" />
        <p className="hv-kicker justify-center">Skills / Tech_Stack</p>
        <h1 className="hv-title mt-2 text-3xl font-black uppercase tracking-tight sm:text-4xl">
          正在学习的技术
        </h1>
        <p className="mt-3 text-sm text-muted">技艺不精，欢迎讨论交流。</p>
        <p className="mt-4 inline-flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-muted">
          <span>
            共 <span className="font-mono text-foreground">{skillsData.length}</span> 项
          </span>
          {summary.map(([cat, count]) => (
            <span key={cat}>
              · {CATEGORY_LABEL[cat] ?? cat}{" "}
              <span className="font-mono text-foreground">{count}</span>
            </span>
          ))}
        </p>
      </header>

      <SkillsBrowser skills={skillsData} />
    </div>
  );
}
