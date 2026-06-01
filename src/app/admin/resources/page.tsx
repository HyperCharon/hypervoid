import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { ChevronRight, Link2, Plus, Save, Trash2 } from "lucide-react";
import { auth } from "@/auth";
import { AdminBackLink } from "@/components/admin/AdminBackLink";
import { groupByCategory, listResources } from "@/db/resources";
import { createAction, deleteAction, updateAction } from "./actions";

export const metadata: Metadata = {
  title: "资源库管理",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminResourcesPage() {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  const list = await listResources({ includeHidden: true });
  const grouped = groupByCategory(list);

  return (
    <div className="flex flex-col gap-6">
      <header className="hv-panel-sci relative overflow-hidden p-5">
        {/* Corner accents */}
        <div className="absolute left-0 top-0 h-10 w-10 border-l-2 border-t-2 border-accent/60 pointer-events-none" />
        <div className="absolute right-0 bottom-0 h-10 w-10 border-r-2 border-b-2 border-accent/60 pointer-events-none" />

        <AdminBackLink href="/admin" label="后台" />
        <p className="hv-kicker mt-4 uppercase">RESOURCE_DIRECTORY</p>
        <h1 className="hv-title mt-1 font-mono text-2xl font-semibold tracking-wider uppercase">资源库管理</h1>
        <p className="mt-2 text-sm text-muted">共 {list.length} 条 · {grouped.size} 类。按分类分组展示，按排序升序。</p>
      </header>

      <p className="text-sm text-muted">
        分享收藏的链接、软件、工具。<code>/resources</code> 按 <code>分类</code> 分组展示，按 <code>排序</code> 升序。
      </p>

      <section className="hv-panel-sci p-5">
        <div className="flex items-center gap-2"><Plus className="h-4 w-4 text-muted" aria-hidden="true" /><h2 className="font-mono text-sm font-semibold tracking-wider uppercase text-foreground">NEW_RESOURCE</h2></div>
        <form
          action={createAction}
          className="mt-3 grid gap-3 sm:grid-cols-[1.4fr_2fr_1fr_0.6fr_0.6fr_auto] sm:items-end"
        >
          <label className="flex flex-col gap-1">
            <span className="font-mono text-xs uppercase text-muted">TITLE</span>
            <input
              type="text"
              name="title"
              required
              placeholder="Figma"
              className="hv-input min-h-11 px-3 text-sm clip-path-[polygon(0_0,calc(100%-6px)_0,100%_6px,100%_100%,0_100%)]"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-mono text-xs uppercase text-muted">URL</span>
            <input
              type="url"
              name="url"
              required
              placeholder="https://..."
              className="hv-input min-h-11 px-3 text-sm clip-path-[polygon(0_0,calc(100%-6px)_0,100%_6px,100%_100%,0_100%)]"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-mono text-xs uppercase text-muted">CATEGORY</span>
            <input
              type="text"
              name="category"
              placeholder="设计 / 开发 / 软件"
              className="hv-input min-h-11 px-3 text-sm clip-path-[polygon(0_0,calc(100%-6px)_0,100%_6px,100%_100%,0_100%)]"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-mono text-xs uppercase text-muted">ICON</span>
            <input
              type="text"
              name="icon"
              placeholder="🎨"
              className="hv-input min-h-11 px-3 text-sm clip-path-[polygon(0_0,calc(100%-6px)_0,100%_6px,100%_100%,0_100%)]"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-mono text-xs uppercase text-muted">SORT</span>
            <input
              type="number"
              name="sortOrder"
              defaultValue={0}
              className="hv-input min-h-11 w-full px-3 text-sm clip-path-[polygon(0_0,calc(100%-6px)_0,100%_6px,100%_100%,0_100%)]"
            />
          </label>
          <button
            type="submit"
            className="hv-action px-4 text-sm font-medium font-mono uppercase clip-path-[polygon(0_0,calc(100%-8px)_0,100%_8px,100%_100%,0_100%)] hover:shadow-[0_0_16px_var(--accent-glow)]"
          >
            创建
          </button>
          <label className="flex flex-col gap-1 sm:col-span-full">
            <span className="font-mono text-xs uppercase text-muted">DESCRIPTION（可选）</span>
            <input
              type="text"
              name="description"
              placeholder="一句话说说这是什么"
              className="hv-input min-h-11 px-3 text-sm clip-path-[polygon(0_0,calc(100%-6px)_0,100%_6px,100%_100%,0_100%)]"
            />
          </label>
        </form>
      </section>

      {list.length === 0 ? (
        <p className="hv-panel-sci border-dashed p-8 text-center text-sm text-muted">
          还没有资源。
        </p>
      ) : (
        <div className="flex flex-col gap-5">
          {[...grouped.entries()].map(([category, items]) => (
            <section
              key={category}
              className="hv-panel-sci p-5"
            >
              <h3 className="mb-3 font-mono text-sm font-semibold tracking-wider uppercase text-foreground">
                {category}{" "}
                <span className="ml-1 text-xs text-muted">{items.length}</span>
              </h3>
              <div className="flex flex-col gap-2">
                {items.map((r) => (
                  <details
                    key={r.id}
                    className="group border border-accent/15 bg-black/20 clip-path-[polygon(0_0,calc(100%-8px)_0,100%_8px,100%_100%,0_100%)]"
                  >
                    <summary className="flex cursor-pointer list-none items-center gap-3 px-3 py-2 text-sm">
                      <span className="grid h-8 w-8 shrink-0 place-items-center border border-accent/25 bg-accent/10 text-sm leading-none clip-path-[polygon(0_0,calc(100%-4px)_0,100%_4px,100%_100%,0_100%)]">
                        {r.icon || <Link2 className="h-4 w-4" aria-hidden="true" />}
                      </span>
                      <span className="flex-1 truncate">
                        <span className="font-medium">{r.title}</span>
                        {r.description ? (
                          <span className="ml-2 text-xs text-muted">
                            · {r.description}
                          </span>
                        ) : null}
                      </span>
                      {r.hidden ? (
                        <span className="border border-amber-300/35 bg-accent/10 px-2 py-0.5 font-mono text-[10px] uppercase text-amber-100 clip-path-[polygon(0_0,calc(100%-4px)_0,100%_4px,100%_100%,0_100%)]">
                          HIDDEN
                        </span>
                      ) : null}
                      <span className="font-mono text-[10px] text-muted">
                        #{r.sortOrder}
                      </span>
                      <ChevronRight className="h-4 w-4 text-muted transition group-open:rotate-90" aria-hidden="true" />
                    </summary>
                    <form
                      action={updateAction}
                      className="grid gap-2 border-t border-accent/15 px-3 py-3 text-sm sm:grid-cols-[1.4fr_2fr_1fr_0.6fr_0.6fr]"
                    >
                      <input type="hidden" name="id" value={r.id} />
                      <input
                        type="text"
                        name="title"
                        defaultValue={r.title}
                        required
                        className="hv-input px-2 py-1.5 text-xs"
                      />
                      <input
                        type="url"
                        name="url"
                        defaultValue={r.url}
                        required
                        className="hv-input px-2 py-1.5 text-xs"
                      />
                      <input
                        type="text"
                        name="category"
                        defaultValue={r.category}
                        className="hv-input px-2 py-1.5 text-xs"
                      />
                      <input
                        type="text"
                        name="icon"
                        defaultValue={r.icon ?? ""}
                        className="hv-input px-2 py-1.5 text-xs"
                      />
                      <input
                        type="number"
                        name="sortOrder"
                        defaultValue={r.sortOrder}
                        className="hv-input px-2 py-1.5 text-xs"
                      />
                      <input
                        type="text"
                        name="description"
                        defaultValue={r.description ?? ""}
                        placeholder="描述（可选）"
                        className="hv-input px-2 py-1.5 text-xs sm:col-span-full"
                      />
                      <div className="flex items-center justify-between gap-3 sm:col-span-full">
                        <label className="flex items-center gap-1.5 text-xs text-muted">
                          <input
                            type="checkbox"
                            name="hidden"
                            defaultChecked={r.hidden}
                            className="accent-accent-soft"
                          />
                          隐藏（不在公开页面显示）
                        </label>
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            className="hv-action min-h-0 px-3 py-1 text-xs font-medium font-mono uppercase clip-path-[polygon(0_0,calc(100%-6px)_0,100%_6px,100%_100%,0_100%)]"
                          >
                            <Save className="h-3.5 w-3.5" aria-hidden="true" />保存
                          </button>
                        </div>
                      </div>
                    </form>
                    <form
                      action={async () => {
                        "use server";
                        await deleteAction(r.id);
                      }}
                      className="border-t border-accent/15 px-3 py-2 text-right"
                    >
                      <button
                        type="submit"
                        className="inline-flex items-center gap-1 border border-red-400/35 bg-red-500/10 px-3 py-1 text-[11px] text-red-200 transition hover:border-red-300 hover:bg-red-500/15 font-mono uppercase clip-path-[polygon(0_0,calc(100%-6px)_0,100%_6px,100%_100%,0_100%)]"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />删除
                      </button>
                    </form>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
