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
    <div className="flex flex-col gap-4 sm:gap-6">
      <header className="hv-panel-sci relative overflow-hidden px-3 py-4 sm:px-6 sm:py-6">
        {/* Corner accents */}
        <div className="absolute left-0 top-0 h-10 w-10 border-l-2 border-t-2 border-accent/60 pointer-events-none" />
        <div className="absolute right-0 bottom-0 h-10 w-10 border-r-2 border-b-2 border-accent/60 pointer-events-none" />

        <AdminBackLink href="/admin" label="后台" />
        <p className="hv-kicker mt-3 uppercase sm:mt-4 text-[10px] sm:text-xs">RESOURCE_DIRECTORY</p>
        <h1 className="hv-title mt-1 font-mono text-lg font-semibold tracking-wider uppercase sm:text-2xl">资源库管理</h1>
        <p className="mt-1.5 text-xs text-muted sm:mt-2 sm:text-sm">共 {list.length} 条 · {grouped.size} 类。按分类分组展示，按排序升序。</p>
      </header>

      <p className="px-0.5 text-xs text-muted sm:text-sm">
        分享收藏的链接、软件、工具。<code>/resources</code> 按 <code>分类</code> 分组展示，按 <code>排序</code> 升序。
      </p>

      <section className="hv-panel-sci px-3 py-4 sm:px-5 sm:py-5">
        <div className="flex items-center gap-2"><Plus className="h-4 w-4 text-muted" aria-hidden="true" /><h2 className="font-mono text-xs font-semibold tracking-wider uppercase text-foreground sm:text-sm">NEW_RESOURCE</h2></div>
        <form
          action={createAction}
          className="mt-3 grid gap-2.5 sm:gap-3 sm:grid-cols-[1.4fr_2fr_1fr_0.6fr_0.6fr_auto] sm:items-end"
        >
          <label className="flex flex-col gap-1">
            <span className="font-mono text-[10px] uppercase text-muted sm:text-xs">TITLE</span>
            <input
              type="text"
              name="title"
              required
              placeholder="Figma"
              className="hv-input min-h-10 px-2.5 text-sm sm:min-h-11 sm:px-3"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-mono text-[10px] uppercase text-muted sm:text-xs">URL</span>
            <input
              type="url"
              name="url"
              required
              placeholder="https://..."
              className="hv-input min-h-10 px-2.5 text-sm sm:min-h-11 sm:px-3"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-mono text-[10px] uppercase text-muted sm:text-xs">CATEGORY</span>
            <input
              type="text"
              name="category"
              placeholder="设计 / 开发 / 软件"
              className="hv-input min-h-10 px-2.5 text-sm sm:min-h-11 sm:px-3"
            />
          </label>
          <div className="grid grid-cols-2 gap-2.5 sm:contents">
            <label className="flex flex-col gap-1">
              <span className="font-mono text-[10px] uppercase text-muted sm:text-xs">ICON</span>
              <input
                type="text"
                name="icon"
                placeholder="🎨"
                className="hv-input min-h-10 px-2.5 text-sm sm:min-h-11 sm:px-3"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-mono text-[10px] uppercase text-muted sm:text-xs">SORT</span>
              <input
                type="number"
                name="sortOrder"
                defaultValue={0}
                className="hv-input min-h-10 w-full px-2.5 text-sm sm:min-h-11 sm:px-3"
              />
            </label>
          </div>
          <button
            type="submit"
            className="hv-action min-h-10 px-4 text-xs font-medium font-mono uppercase sm:min-h-11 sm:text-sm hover:shadow-[0_0_16px_var(--accent-glow)]"
          >
            创建
          </button>
          <label className="flex flex-col gap-1 sm:col-span-full">
            <span className="font-mono text-[10px] uppercase text-muted sm:text-xs">DESCRIPTION（可选）</span>
            <input
              type="text"
              name="description"
              placeholder="一句话说说这是什么"
              className="hv-input min-h-10 px-2.5 text-sm sm:min-h-11 sm:px-3"
            />
          </label>
        </form>
      </section>

      {list.length === 0 ? (
        <p className="hv-panel-sci border-dashed px-4 py-8 text-center text-xs text-muted sm:px-8 sm:py-12 sm:text-sm">
          还没有资源。
        </p>
      ) : (
        <div className="flex flex-col gap-4 sm:gap-5">
          {[...grouped.entries()].map(([category, items]) => (
            <section
              key={category}
              className="hv-panel-sci px-3 py-4 sm:px-5 sm:py-5"
            >
              <h3 className="mb-2.5 font-mono text-xs font-semibold tracking-wider uppercase text-foreground sm:mb-3 sm:text-sm">
                {category}{" "}
                <span className="ml-1 text-[10px] text-muted sm:text-xs">{items.length}</span>
              </h3>
              <div className="flex flex-col gap-1.5 sm:gap-2">
                {items.map((r) => (
                  <details
                    key={r.id}
                    className="group border border-accent/15 bg-black/20"
                  >
                    <summary className="flex cursor-pointer list-none items-center gap-2 px-2.5 py-2 text-sm sm:gap-3 sm:px-3">
                      <span className="grid h-7 w-7 shrink-0 place-items-center border border-accent/25 bg-accent/10 text-xs leading-none sm:h-8 sm:w-8 sm:text-sm">
                        {r.icon || <Link2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />}
                      </span>
                      <span className="min-w-0 flex-1 truncate">
                        <span className="text-[13px] font-medium sm:text-sm">{r.title}</span>
                        {r.description ? (
                          <span className="ml-1.5 hidden text-xs text-muted sm:inline">
                            · {r.description}
                          </span>
                        ) : null}
                      </span>
                      {r.hidden ? (
                        <span className="hidden border border-amber-300/35 bg-accent/10 px-2 py-0.5 font-mono text-[10px] uppercase text-amber-100 sm:inline">
                          HIDDEN
                        </span>
                      ) : null}
                      <span className="shrink-0 font-mono text-[9px] text-muted sm:text-[10px]">
                        #{r.sortOrder}
                      </span>
                      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted transition group-open:rotate-90 sm:h-4 sm:w-4" aria-hidden="true" />
                    </summary>
                    <form
                      action={updateAction}
                      className="grid gap-2 border-t border-accent/15 px-2.5 py-3 text-sm sm:grid-cols-[1.4fr_2fr_1fr_0.6fr_0.6fr] sm:px-3"
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
                      <div className="grid grid-cols-2 gap-2 sm:contents">
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
                      </div>
                      <input
                        type="text"
                        name="description"
                        defaultValue={r.description ?? ""}
                        placeholder="描述（可选）"
                        className="hv-input px-2 py-1.5 text-xs sm:col-span-full"
                      />
                      <div className="flex items-center justify-between gap-3 sm:col-span-full">
                        <label className="flex items-center gap-1.5 text-[11px] text-muted sm:text-xs">
                          <input
                            type="checkbox"
                            name="hidden"
                            defaultChecked={r.hidden}
                            className="accent-accent-soft"
                          />
                          隐藏
                        </label>
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            className="hv-action min-h-0 px-3 py-1 text-[11px] font-medium font-mono uppercase sm:text-xs"
                          >
                            <Save className="h-3 w-3 sm:h-3.5 sm:w-3.5" aria-hidden="true" />保存
                          </button>
                        </div>
                      </div>
                    </form>
                    <form
                      action={async () => {
                        "use server";
                        await deleteAction(r.id);
                      }}
                      className="border-t border-accent/15 px-2.5 py-2 text-right sm:px-3"
                    >
                      <button
                        type="submit"
                        className="inline-flex items-center gap-1 border border-red-400/35 bg-red-500/10 px-2.5 py-1 text-[10px] text-red-200 transition hover:border-red-300 hover:bg-red-500/15 font-mono uppercase sm:px-3 sm:text-[11px]"
                      >
                        <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" aria-hidden="true" />删除
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
