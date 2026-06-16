import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { GitMerge, Pencil, Trash2 } from "lucide-react";
import { auth } from "@/auth";
import { AdminBackLink } from "@/components/admin/AdminBackLink";
import { AdminTable } from "@/components/admin/AdminTable";
import { listTagsWithUsage } from "@/db/tag-admin";
import { deleteTagAction, mergeTagsAction, renameTagAction } from "./actions";

export const metadata: Metadata = {
  title: "标签管理",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminTagsPage() {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  const tags = await listTagsWithUsage();

  return (
    <div className="flex flex-col gap-6">
      <header className="hv-panel-sci relative overflow-hidden p-4 sm:p-6">
        {/* Corner accents */}
        <div className="absolute left-0 top-0 h-10 w-10 border-l-2 border-t-2 border-accent/60 pointer-events-none" />
        <div className="absolute right-0 bottom-0 h-10 w-10 border-r-2 border-b-2 border-accent/60 pointer-events-none" />

        <AdminBackLink href="/admin" label="后台" />
        <p className="hv-kicker mt-4 uppercase">TAG_OPERATIONS</p>
        <h1 className="hv-title mt-1 font-mono text-2xl font-semibold tracking-wider uppercase">标签管理</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          改一处生效全站：重命名、合并、删除都会扫过所有文章并写入 audit。操作不可逆，建议先在 <Link href="/admin/backup" className="text-foreground hover:text-foreground">/admin/backup</Link> 做一次快照。
        </p>
      </header>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="hv-panel-sci p-5">
          <div className="flex items-center gap-2">
            <Pencil className="h-4 w-4 text-muted" aria-hidden="true" />
            <h2 className="font-mono text-sm font-semibold tracking-wider uppercase text-foreground">RENAME</h2>
          </div>
          <form action={renameTagAction} className="mt-3 flex flex-col gap-3">
            <label className="flex flex-col gap-1">
              <span className="font-mono text-xs uppercase text-muted">OLD_TAG</span>
              <select name="oldName" required defaultValue="" className="hv-input min-h-11 px-3 text-sm">
                <option value="" disabled>选一个标签…</option>
                {tags.map((t) => <option key={t.name} value={t.name}>{t.name} ({t.count})</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-mono text-xs uppercase text-muted">NEW_NAME</span>
              <input type="text" name="newName" required placeholder="新名字" className="hv-input min-h-11 px-3 text-sm" />
            </label>
            <button type="submit" className="hv-action self-start px-4 text-sm font-mono uppercase hover:shadow-[0_0_16px_var(--accent-glow)]">重命名</button>
          </form>
        </div>

        <div className="hv-panel-sci p-5">
          <div className="flex items-center gap-2">
            <GitMerge className="h-4 w-4 text-muted" aria-hidden="true" />
            <h2 className="font-mono text-sm font-semibold tracking-wider uppercase text-foreground">MERGE_INTO</h2>
          </div>
          <p className="mt-2 text-xs text-muted">勾选下方一个或多个标签，全部并入目标标签，重复会去重。</p>
          <form action={mergeTagsAction} className="mt-3 flex flex-col gap-3" id="merge-form">
            <label className="flex flex-col gap-1">
              <span className="font-mono text-xs uppercase text-muted">TARGET_TAG</span>
              <input type="text" name="target" required placeholder="如：JavaScript" className="hv-input min-h-11 px-3 text-sm" />
            </label>
            <button type="submit" className="hv-action self-start px-4 text-sm font-mono uppercase hover:shadow-[0_0_16px_var(--accent-glow)]">合并所选</button>
          </form>
        </div>
      </section>

      <div className="hv-panel-sci overflow-x-auto p-0">
        <AdminTable
          empty="还没有标签。"
          columns={[
            { key: "check", label: "", width: "2.5rem" },
            { key: "tag", label: "TAG", primary: true },
            { key: "posts", label: "POSTS" },
            { key: "usedIn", label: "USED_IN", hideMobile: true },
            { key: "actions", label: "", align: "right" },
          ]}
          rows={tags.map((t) => ({
            key: t.name,
            cells: {
              check: (
                <input type="checkbox" name="sources" value={t.name} form="merge-form" className="h-4 w-4 accent-accent-soft" />
              ),
              tag: <span className="font-mono">#{t.name}</span>,
              posts: <span className="font-mono text-xs">{t.count}</span>,
              usedIn: (
                <span className="text-xs text-muted">
                  {t.slugs.slice(0, 3).map((s, i) => (
                    <span key={s}>
                      <Link href={"/admin/posts/" + s + "/edit"} className="hover:text-foreground">{s}</Link>
                      {i < Math.min(2, t.slugs.length - 1) ? "，" : ""}
                    </span>
                  ))}
                  {t.slugs.length > 3 ? <span> 等 {t.slugs.length} 篇</span> : null}
                </span>
              ),
              actions: (
                <form action={async () => { "use server"; await deleteTagAction(t.name); }}>
                  <button type="submit" className="inline-flex items-center gap-1 border border-red-400/35 bg-red-500/10 px-3 py-1 text-[11px] text-red-200 transition hover:border-red-300 hover:bg-red-500/15 font-mono uppercase">
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />删除
                  </button>
                </form>
              ),
            },
          }))}
        />
      </div>
    </div>
  );
}
