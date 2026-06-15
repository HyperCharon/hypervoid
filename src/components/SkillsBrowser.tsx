"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import type { Skill } from "@/lib/skills";

const CATEGORY_LABEL: Record<Skill["category"], string> = {
  frontend: "前端",
  backend: "后端",
  database: "数据库",
  tools: "工具",
  other: "其他",
};

type CategoryFilter = "all" | Skill["category"];

function iconUrl(name: string): string {
  return `https://api.iconify.design/${name.replace(/:/, "/")}.svg`;
}

function formatExp(years: number, months: number): string {
  if (years === 0 && months === 0) return "—";
  if (years === 0) return `${months} 个月`;
  if (months === 0) return `${years} 年`;
  return `${years}年${months}月`;
}

export function SkillsBrowser({ skills }: { skills: Skill[] }) {
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [sort, setSort] = useState<"experience" | "name">("experience");

  const filtered = useMemo(() => {
    let out = [...skills];
    if (category !== "all") {
      out = out.filter((s) => s.category === category);
    }
    if (sort === "experience") {
      out.sort(
        (a, b) =>
          b.experience.years * 12 + b.experience.months -
          (a.experience.years * 12 + a.experience.months),
      );
    } else {
      out.sort((a, b) => a.name.localeCompare(b.name));
    }
    return out;
  }, [skills, category, sort]);

  const categoryCounts = useMemo(() => {
    const c: Record<CategoryFilter, number> = {
      all: skills.length,
      frontend: 0,
      backend: 0,
      database: 0,
      tools: 0,
      other: 0,
    };
    for (const s of skills) c[s.category]++;
    return c;
  }, [skills]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs text-muted">分类：</span>
          {(["all", "frontend", "backend", "database", "tools", "other"] as const).map(
            (c) => {
              const active = category === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs transition ${
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-muted hover:border-primary/40 hover:text-foreground"
                  }`}
                >
                  {c === "all" ? "全部" : CATEGORY_LABEL[c]}
                  <span className="font-mono text-xs opacity-70">
                    {categoryCounts[c]}
                  </span>
                </button>
              );
            },
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs text-muted">排序：</span>
          {(["experience", "name"] as const).map((s) => {
            const active = sort === s;
            const label = s === "experience" ? "按经验" : "按名称";
            return (
              <button
                key={s}
                type="button"
                onClick={() => setSort(s)}
                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs transition ${
                  active
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-muted hover:border-primary/40 hover:text-foreground"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-muted">
        共 <span className="font-mono text-foreground">{filtered.length}</span>{" "}
        项符合筛选。
      </p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((skill) => (
          <SkillCard key={skill.id} skill={skill} />
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-8 text-center text-muted">
          没有匹配的技能。换个组合试试。
        </p>
      ) : null}
    </div>
  );
}

function SkillCard({ skill }: { skill: Skill }) {
  const accent = skill.color ?? "var(--primary)";
  return (
    <div
      className="group relative flex h-full flex-col gap-3 overflow-hidden rounded-2xl border border-border bg-card p-4 transition hover:-translate-y-0.5 hover:shadow-md"
      style={{ borderLeft: `4px solid ${accent}` }}
    >
      <div className="flex items-start gap-3">
        <div className="relative h-8 w-8 shrink-0">
          <Image
            src={iconUrl(skill.icon)}
            alt=""
            width={32}
            height={32}
            sizes="32px"
            loading="lazy"
            unoptimized
            className="h-8 w-8 shrink-0"
            onError={(e) => {
              // Hide broken image, show fallback letter
              (e.currentTarget as HTMLImageElement).style.display = "none";
              const fallback = (e.currentTarget as HTMLImageElement).nextElementSibling as HTMLElement;
              if (fallback) fallback.style.display = "flex";
            }}
          />
          <div
            className="absolute inset-0 hidden items-center justify-center rounded-lg text-sm font-bold text-white"
            style={{ background: accent }}
          >
            {skill.name.charAt(0)}
          </div>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <h3 className="text-base font-semibold leading-snug tracking-tight">
            {skill.name}
          </h3>
          <p className="text-[11px] uppercase tracking-wider text-muted">
            {CATEGORY_LABEL[skill.category]}
          </p>
        </div>
      </div>

      <p className="line-clamp-3 text-sm leading-relaxed text-muted">
        {skill.description}
      </p>

      <div className="mt-auto flex flex-wrap items-baseline gap-x-3 gap-y-1 pt-1 text-xs">
        <span className="font-mono text-muted">
          {formatExp(skill.experience.years, skill.experience.months)}
        </span>
        {skill.projects?.length ? (
          <span className="font-mono text-muted">
            · {skill.projects.length} 项目
          </span>
        ) : null}
        {skill.certifications?.length ? (
          <span className="font-mono text-muted">
            · {skill.certifications.length} 认证
          </span>
        ) : null}
      </div>
    </div>
  );
}
