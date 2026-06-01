import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { auth } from "@/auth";
import { AdminBackLink } from "@/components/admin/AdminBackLink";
import { listAllAnnouncements } from "@/db/announcements";
import { formatDateTimeCN } from "@/lib/datetime";
import { deleteAction, toggleAction } from "./actions";

export const metadata: Metadata = {
  title: "公告管理",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const SLOT_LABEL: Record<string, string> = {
  top: "顶部条带",
  sidebar: "侧边栏卡片",
  article_top: "文章顶部",
};

export default async function AdminNotesPage() {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  const list = await listAllAnnouncements();

  return (
    <div className="flex flex-col gap-6">
      <header className="hv-panel-sci relative overflow-hidden flex flex-col gap-4 p-5 sm:flex-row sm:items-end sm:justify-between">
        {/* Corner accents */}
        <div className="absolute left-0 top-0 h-10 w-10 border-l-2 border-t-2 border-accent/60 pointer-events-none" />
        <div className="absolute right-0 bottom-0 h-10 w-10 border-r-2 border-b-2 border-accent/60 pointer-events-none" />

        <div className="space-y-3">
          <AdminBackLink href="/admin" label="后台" />
          <div>
            <p className="hv-kicker uppercase">ANNOUNCEMENT_MATRIX</p>
            <h1 className="hv-title mt-1 font-mono text-2xl font-semibold tracking-wider uppercase">公告管理</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted">
              每个槽位只显示优先级最高且在时间窗内的一条。空起止时间表示永久有效。
            </p>
          </div>
        </div>
        <Link href="/admin/notes/new" className="hv-action px-4 text-sm font-mono uppercase clip-path-[polygon(0_0,calc(100%-8px)_0,100%_8px,100%_100%,0_100%)] hover:shadow-[0_0_20px_var(--accent-glow)]">
          <Plus className="h-4 w-4" aria-hidden="true" />
          NEW_NOTE
        </Link>
      </header>

      {list.length === 0 ? (
        <p className="hv-panel-sci border-dashed p-8 text-center text-sm text-muted">
          还没有公告。
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {list.map((a) => (
            <li
              key={a.id}
              className={"hv-panel-sci flex flex-col gap-3 p-4 " + (a.active ? "" : "opacity-65")}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="hv-chip-strong px-2 py-0.5 text-[11px]">
                      {SLOT_LABEL[a.slot]}
                    </span>
                    <span className="hv-chip-sci px-2 py-0.5 text-[11px]">
                      PRI {a.priority}
                    </span>
                    {!a.active ? (
                      <span className="border border-zinc-300/25 bg-zinc-400/10 px-2 py-0.5 font-mono text-[11px] uppercase text-zinc-200 clip-path-[polygon(0_0,calc(100%-4px)_0,100%_4px,100%_100%,0_100%)]">
                        OFFLINE
                      </span>
                    ) : null}
                    <span className="font-mono text-[11px] text-muted">
                      {a.startsAt || a.endsAt ? (
                        <>
                          {a.startsAt ? formatDateTimeCN(a.startsAt) : "立即"} → {a.endsAt ? formatDateTimeCN(a.endsAt) : "永久"}
                        </>
                      ) : (
                        "永久有效"
                      )}
                    </span>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-foreground">
                    {a.message}
                  </p>
                  {a.link ? (
                    <p className="mt-2 break-all font-mono text-xs text-foreground">
                      {a.linkText || "了解更多"}：
                      <a
                        href={a.link}
                        target="_blank"
                        rel="noreferrer"
                        className="ml-1 underline-offset-2 hover:text-foreground hover:underline"
                      >
                        {a.link}
                      </a>
                    </p>
                  ) : null}
                </div>
                <div className="grid shrink-0 grid-cols-3 gap-2 sm:grid-cols-1">
                  <Link href={"/admin/notes/" + a.id + "/edit"} className="hv-action min-h-0 px-3 py-1 text-center text-[11px] font-mono uppercase clip-path-[polygon(0_0,calc(100%-6px)_0,100%_6px,100%_100%,0_100%)]">
                    编辑
                  </Link>
                  <form
                    action={async () => {
                      "use server";
                      await toggleAction(a.id);
                    }}
                  >
                    <button type="submit" className="hv-action min-h-0 w-full px-3 py-1 text-[11px] font-mono uppercase clip-path-[polygon(0_0,calc(100%-6px)_0,100%_6px,100%_100%,0_100%)] hover:border-amber-300/60 hover:text-amber-100">
                      {a.active ? "停用" : "启用"}
                    </button>
                  </form>
                  <form
                    action={async () => {
                      "use server";
                      await deleteAction(a.id);
                    }}
                  >
                    <button type="submit" className="w-full border border-red-400/35 bg-red-500/10 px-3 py-1 text-[11px] text-red-200 transition hover:border-red-300 hover:bg-red-500/15 font-mono uppercase clip-path-[polygon(0_0,calc(100%-6px)_0,100%_6px,100%_100%,0_100%)]">
                      删除
                    </button>
                  </form>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
