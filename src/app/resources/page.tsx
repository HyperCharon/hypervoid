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
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-3 py-6 sm:gap-8 sm:px-0 sm:py-10">
      <header className="relative overflow-hidden rounded-xl border border-border bg-card p-4 text-center sm:p-7">
        <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        <p className="hv-kicker justify-center">Resource vault / external tools</p>
        <h1 className="hv-title mt-2 flex items-center justify-center gap-3 text-3xl font-black leading-tight sm:text-5xl">
          <LibraryBig className="h-8 w-8 text-muted sm:h-10 sm:w-10" aria-hidden />
          资源库
        </h1>
        <p className="mt-4 text-sm text-muted">
          一些好用的链接、软件、工具 / 共 {items.length} 条
        </p>
      </header>

      {/* Online Reader */}
      <Link
        href="/resources/reader"
        className="group flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:border-accent/30 sm:gap-4 sm:p-5"
      >
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-border bg-card transition group-hover:border-accent/30">
          <BookOpen className="h-6 w-6 text-muted transition group-hover:text-accent" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold text-foreground">在线阅读器</p>
          <p className="mt-0.5 text-xs text-muted-soft">
            轻量级小说 / 文档阅读器 — 拖入 .md / .txt 文件即可开始阅读，支持目录、搜索、进度记忆
          </p>
        </div>
        <ExternalLink className="h-4 w-4 shrink-0 text-muted-soft transition group-hover:text-foreground" aria-hidden />
      </Link>

      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted sm:p-12">
          还没有资源 / 站长在 <code>/admin/resources</code> 添加后会出现在这里。
        </p>
      ) : (
        <div className="flex flex-col gap-6 sm:gap-8">
          {[...grouped.entries()].map(([category, list]) => (
            <section key={category}>
              <h2 className="hv-title mb-3 flex items-center gap-2 text-lg font-semibold tracking-normal">
                <span>{category}</span>
                <span className="hv-chip text-xs font-normal">{list.length}</span>
              </h2>
              <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
                {list.map((r) => (
                  <a
                    key={r.id}
                    href={r.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="group flex items-start gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:border-accent/30 sm:p-4"
                  >
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-border bg-card text-muted sm:h-9 sm:w-9">
                      <Link2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground transition group-hover:text-accent sm:text-base">
                        {r.title}
                      </p>
                      {r.description ? (
                        <p className="mt-1 line-clamp-2 text-xs text-muted-soft">
                          {r.description}
                        </p>
                      ) : null}
                      <p className="mt-1 truncate font-mono text-[10px] uppercase text-muted-soft sm:mt-1.5">
                        {hostnameOf(r.url)}
                      </p>
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-soft transition group-hover:text-foreground sm:h-4 sm:w-4" aria-hidden />
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
