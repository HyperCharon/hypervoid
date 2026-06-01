import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Play, Trash2 } from "lucide-react";
import { auth } from "@/auth";
import { AdminBackLink } from "@/components/admin/AdminBackLink";
import { listLinkChecks } from "@/db/link-checks";
import { formatDateTimeCN } from "@/lib/datetime";
import {
  clearAllAction,
  deleteLinkAction,
  runScanAction,
} from "./actions";

export const metadata: Metadata = {
  title: "失效链接巡检",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

function statusBadge(status: number | null, errorMessage: string | null) {
  if (status === null) {
    return { label: "ERR", cls: "border-red-300/35 bg-red-500/10 text-red-100", hint: errorMessage ?? "请求失败" };
  }
  if (status >= 200 && status < 300) return { label: String(status), cls: "border-emerald-300/35 bg-accent/10 text-emerald-100", hint: "OK" };
  if (status >= 300 && status < 400) return { label: String(status), cls: "border-amber-300/35 bg-accent/10 text-amber-100", hint: "重定向" };
  return { label: String(status), cls: "border-red-300/35 bg-red-500/10 text-red-100", hint: status === 404 ? "未找到" : status === 410 ? "已下线" : "错误" };
}

export default async function AdminLinkCheckPage() {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  const list = await listLinkChecks();
  const broken = list.filter((r) => r.status === null || r.status >= 400 || r.status === 0);
  const lastRun = list.length > 0 ? list.reduce((max, r) => (r.lastCheckedAt > max ? r.lastCheckedAt : max), list[0].lastCheckedAt) : null;

  return (
    <div className="flex flex-col gap-6">
      <header className="hv-panel-sci relative overflow-hidden flex flex-col gap-4 p-5 sm:flex-row sm:items-end sm:justify-between">
        {/* Corner accents */}
        <div className="absolute left-0 top-0 h-10 w-10 border-l-2 border-t-2 border-accent/60 pointer-events-none" />
        <div className="absolute right-0 bottom-0 h-10 w-10 border-r-2 border-b-2 border-accent/60 pointer-events-none" />

        <div className="space-y-3">
          <AdminBackLink href="/admin" label="后台" />
          <div>
            <p className="hv-kicker uppercase">OUTBOUND_LINK_SCAN</p>
            <h1 className="hv-title mt-1 font-mono text-2xl font-semibold tracking-wider uppercase">失效链接巡检</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted">
              扫描所有已发布公开文章里的外链，并发 6 路，HEAD 失败回退 GET。
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="hv-chip-sci">LINKS {list.length}</span>
          <span className={broken.length > 0 ? "border border-red-300/35 bg-red-500/10 px-2 py-0.5 font-mono text-xs uppercase text-red-100 clip-path-[polygon(0_0,calc(100%-4px)_0,100%_4px,100%_100%,0_100%)]" : "hv-chip-sci"}>BROKEN {broken.length}</span>
        </div>
      </header>

      <section className="hv-panel-sci flex flex-wrap items-center gap-3 p-5">
        <div className="flex-1 text-sm leading-6 text-muted">
          {lastRun ? <span>上次扫描：<span className="font-mono text-foreground">{formatDateTimeCN(lastRun)}</span></span> : <span>还没有扫描记录。</span>}
        </div>
        <form action={runScanAction}>
          <button type="submit" className="hv-action px-4 text-sm font-mono uppercase clip-path-[polygon(0_0,calc(100%-8px)_0,100%_8px,100%_100%,0_100%)] hover:shadow-[0_0_16px_var(--accent-glow)]">
            <Play className="h-4 w-4" aria-hidden="true" />
            立即扫描
          </button>
        </form>
        {list.length > 0 ? (
          <form action={clearAllAction}>
            <button type="submit" className="inline-flex min-h-11 items-center gap-2 border border-red-400/35 bg-red-500/10 px-3 text-sm text-red-100 transition hover:border-red-300 hover:bg-red-500/15 font-mono uppercase clip-path-[polygon(0_0,calc(100%-8px)_0,100%_8px,100%_100%,0_100%)]">
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              清空历史
            </button>
          </form>
        ) : null}
      </section>

      {list.length === 0 ? (
        <p className="hv-panel-sci border-dashed p-8 text-center text-sm text-muted">还没有扫描记录。点上面「立即扫描」开始。</p>
      ) : (
        <div className="hv-panel-sci overflow-x-auto p-0">
          <table className="w-full min-w-[680px] text-sm">
            <thead className="border-b border-accent/20 bg-accent/[0.06] text-left font-mono text-xs uppercase text-muted">
              <tr>
                <th className="w-20 px-3 py-3 font-medium">STATUS</th>
                <th className="px-3 py-3 font-medium">URL / ERROR</th>
                <th className="px-3 py-3 font-medium">USED_IN</th>
                <th className="px-3 py-3 font-medium">LAST_CHECK</th>
                <th className="px-3 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {list.map((r) => {
                const badge = statusBadge(r.status, r.errorMessage);
                return (
                  <tr key={r.url} className="border-t border-accent/15 transition hover:bg-accent/[0.05]">
                    <td className="px-3 py-3">
                      <span className={"inline-flex items-center border px-2 py-0.5 font-mono text-[11px] clip-path-[polygon(0_0,calc(100%-4px)_0,100%_4px,100%_100%,0_100%)] " + badge.cls} title={badge.hint}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-xs">
                      <a href={r.url} target="_blank" rel="noreferrer" className="break-all text-foreground hover:text-foreground">
                        {r.url}
                      </a>
                      {r.errorMessage ? <p className="mt-1 text-[11px] text-muted">{r.errorMessage}</p> : null}
                    </td>
                    <td className="px-3 py-3 text-xs text-muted">
                      {(r.postSlugs ?? []).slice(0, 3).map((s, i) => (
                        <span key={s}>
                          <Link href={"/admin/posts/" + s + "/edit"} className="hover:text-foreground">{s}</Link>
                          {i < Math.min(2, (r.postSlugs ?? []).length - 1) ? "，" : ""}
                        </span>
                      ))}
                      {(r.postSlugs ?? []).length > 3 ? <span> 等 {(r.postSlugs ?? []).length} 篇</span> : null}
                    </td>
                    <td className="px-3 py-3 font-mono text-xs text-muted">{formatDateTimeCN(r.lastCheckedAt)}</td>
                    <td className="px-3 py-3 text-right">
                      <form
                        action={async () => {
                          "use server";
                          await deleteLinkAction(r.url);
                        }}
                      >
                        <button type="submit" className="border border-red-400/35 bg-red-500/10 px-3 py-1 text-[11px] text-red-200 transition hover:border-red-300 hover:bg-red-500/15 font-mono uppercase clip-path-[polygon(0_0,calc(100%-6px)_0,100%_6px,100%_100%,0_100%)]">
                          删除
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
