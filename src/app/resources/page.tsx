import Link from "next/link";
import type { Metadata } from "next";
import { BookOpen, ExternalLink, LibraryBig, Link2 } from "lucide-react";
import { groupByCategory, listResources } from "@/db/resources";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "资源库",
  description: "收藏的链接、软件、工具。",
};

export default async function ResourcesPage() {
  const items = await listResources();
  const grouped = groupByCategory(items);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-5 px-4 py-5 sm:gap-8 sm:px-6 sm:py-10">
      <header className="relative overflow-hidden rounded-xl border border-border bg-card px-4 py-5 text-center sm:px-7 sm:py-7">
        <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        <p className="hv-kicker justify-center text-[10px] sm:text-xs">Resource vault / external tools</p>
        <h1 className="hv-title mt-1.5 flex items-center justify-center gap-2 text-2xl font-black leading-tight sm:mt-2 sm:gap-3 sm:text-5xl">
          <LibraryBig className="h-6 w-6 text-muted sm:h-10 sm:w-10" aria-hidden />
          资源库
        </h1>
        <p className="mt-2 text-xs text-muted sm:mt-4 sm:text-sm">
          一些好用的链接、软件、工具 / 共 {items.length} 条
        </p>
      </header>

      {/* Online Reader */}
      <Link
        href="/resources/reader"
        className="group flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-3 transition-colors hover:border-accent/30 sm:gap-4 sm:px-5 sm:py-4"
      >
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-border bg-card transition group-hover:border-accent/30 sm:h-12 sm:w-12 sm:rounded-xl">
          <BookOpen className="h-5 w-5 text-muted transition group-hover:text-accent sm:h-6 sm:w-6" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground sm:text-base">在线阅读器</p>
          <p className="mt-0.5 text-[11px] leading-relaxed text-muted-soft sm:text-xs">
            轻量级小说 / 文档阅读器 — 拖入 .md / .txt 文件即可开始阅读，支持目录、搜索、进度记忆
          </p>
        </div>
        <ExternalLink className="h-4 w-4 shrink-0 text-muted-soft transition group-hover:text-foreground" aria-hidden />
      </Link>

      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-card px-4 py-8 text-center text-xs text-muted sm:px-8 sm:py-12 sm:text-sm">
          还没有资源 / 站长在 <code>/admin/resources</code> 添加后会出现在这里。
        </p>
      ) : (
        <div className="flex flex-col gap-5 sm:gap-8">
          {[...grouped.entries()].map(([category, list]) => (
            <section key={category}>
              <h2 className="hv-title mb-2.5 flex items-center gap-2 text-base font-semibold tracking-normal sm:mb-3 sm:text-lg">
                <span>{category}</span>
                <span className="hv-chip text-[10px] font-normal sm:text-xs">{list.length}</span>
              </h2>
              <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
                {list.map((r) => (
                  <a
                    key={r.id}
                    href={r.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="group flex items-start gap-2.5 overflow-hidden rounded-xl border border-border bg-card px-3 py-2.5 transition-colors hover:border-accent/30 sm:gap-3 sm:px-4 sm:py-3"
                  >
                    <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-md border border-border bg-card text-muted sm:h-8 sm:w-8">
                      <Link2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1 overflow-hidden">
                      <p className="truncate text-[13px] font-semibold text-foreground transition group-hover:text-accent sm:text-sm">
                        {r.title}
                      </p>
                      {r.description ? (
                        <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-muted-soft sm:mt-1 sm:text-xs">
                          {r.description}
                        </p>
                      ) : null}
                      <p className="mt-0.5 truncate font-mono text-[9px] uppercase text-muted-soft sm:mt-1 sm:text-[10px]">
                        {hostnameOf(r.url)}
                      </p>
                    </div>
                    <ExternalLink className="mt-0.5 h-3 w-3 shrink-0 text-muted-soft transition group-hover:text-foreground sm:h-3.5 sm:w-3.5" aria-hidden />
                  </a>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function hostnameOf(rawUrl: string): string {
  try {
    return new URL(rawUrl).hostname;
  } catch {
    return rawUrl;
  }
}
