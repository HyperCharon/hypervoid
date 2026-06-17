import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Link2, Plus, Save, Trash2 } from "lucide-react";
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
    <div className="flex flex-col gap-4 sm:gap-6 overflow-x-hidden">
      <header className="hv-panel-sci relative overflow-hidden px-3 py-4 sm:px-6 sm:py-6">
        <div className="absolute left-0 top-0 h-10 w-10 border-l-2 border-t-2 border-accent/60 pointer-events-none" />
        <div className="absolute right-0 bottom-0 h-10 w-10 border-r-2 border-b-2 border-accent/60 pointer-events-none" />
        <AdminBackLink href="/admin" label="后台" />
        <p className="hv-kicker mt-3 uppercase sm:mt-4 text-[10px] sm:text-xs">RESOURCE_DIRECTORY</p>
        <h1 className="hv-title mt-1 font-mono text-lg font-semibold tracking-wider uppercase sm:text-2xl">资源库管理</h1>
        <p className="mt-1.5 text-xs text-muted sm:mt-2 sm:text-sm">共 {list.length} 条 · {grouped.size} 类</p>
      </header>

      {/* ── Create form ────────────────────────────────── */}
      <section className="hv-panel-sci overflow-hidden px-3 py-4 sm:px-5 sm:py-5">
        <div className="flex items-center gap-2">
          <Plus className="h-4 w-4 text-muted" aria-hidden="true" />
          <h2 className="font-mono text-xs font-semibold tracking-wider uppercase text-foreground sm:text-sm">NEW_RESOURCE</h2>
        </div>
        <form action={createAction} className="mt-3 space-y-2 sm:space-y-0 sm:grid sm:gap-3 sm:grid-cols-[1.4fr_2fr_1fr_0.6fr_0.6fr_auto] sm:items-end">
          <Field label="TITLE" input={<input type="text" name="title" required placeholder="Figma" className="hv-input-field" />} />
          <Field label="URL" input={<input type="url" name="url" required placeholder="https://..." className="hv-input-field" />} />
          <Field label="CATEGORY" input={<input type="text" name="category" placeholder="设计 / 开发" className="hv-input-field" />} />
          <div className="grid grid-cols-2 gap-2 sm:contents">
            <Field label="ICON" input={<input type="text" name="icon" placeholder="🎨" className="hv-input-field" />} />
            <Field label="SORT" input={<input type="number" name="sortOrder" defaultValue={0} className="hv-input-field" />} />
          </div>
          <button type="submit" className="hv-action w-full min-h-10 px-4 text-xs font-medium font-mono uppercase sm:w-auto sm:min-h-11 sm:text-sm">创建</button>
          <div className="sm:col-span-full">
            <Field label="DESCRIPTION" input={<input type="text" name="description" placeholder="一句话说说这是什么" className="hv-input-field" />} />
          </div>
        </form>
      </section>

      {/* ── Resource list ──────────────────────────────── */}
      {list.length === 0 ? (
        <p className="hv-panel-sci border-dashed px-4 py-8 text-center text-xs text-muted sm:px-8 sm:py-12 sm:text-sm">还没有资源。</p>
      ) : (
        <div className="space-y-4 sm:space-y-5">
          {[...grouped.entries()].map(([category, items]) => (
            <section key={category} className="hv-panel-sci overflow-hidden px-3 py-4 sm:px-5 sm:py-5">
              <h3 className="mb-2.5 font-mono text-xs font-semibold tracking-wider uppercase text-foreground sm:mb-3 sm:text-sm">
                {category} <span className="ml-1 text-[10px] text-muted sm:text-xs">{items.length}</span>
              </h3>
              <div className="space-y-1.5 sm:space-y-2">
                {items.map((r) => (
                  <details key={r.id} className="group border border-accent/15 bg-black/20 overflow-hidden">
                    <summary className="flex cursor-pointer list-none items-center gap-2 px-2.5 py-2 sm:gap-3 sm:px-3">
                      <span className="grid h-7 w-7 shrink-0 place-items-center border border-accent/25 bg-accent/10 text-xs leading-none sm:h-8 sm:w-8">
                        {r.icon || <Link2 className="h-3.5 w-3.5" aria-hidden="true" />}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[13px] font-medium sm:text-sm">{r.title}</span>
                      {r.hidden ? <span className="shrink-0 text-[10px] text-amber-400">HIDDEN</span> : null}
                      <span className="shrink-0 font-mono text-[9px] text-muted sm:text-[10px]">#{r.sortOrder}</span>
                    </summary>

                    <form action={updateAction} className="border-t border-accent/15 px-2.5 py-3 space-y-2 sm:px-3 sm:grid sm:grid-cols-[1.4fr_2fr_1fr_0.6fr_0.6fr] sm:space-y-0 sm:gap-2">
                      <input type="hidden" name="id" value={r.id} />
                      <EditField label="TITLE" name="title" defaultValue={r.title} required />
                      <EditField label="URL" name="url" defaultValue={r.url} type="url" required />
                      <EditField label="CATEGORY" name="category" defaultValue={r.category} />
                      <EditField label="ICON" name="icon" defaultValue={r.icon ?? ""} />
                      <EditField label="SORT" name="sortOrder" defaultValue={String(r.sortOrder)} type="number" />
                      <div className="sm:col-span-full">
                        <EditField label="DESCRIPTION" name="description" defaultValue={r.description ?? ""} />
                      </div>
                      <div className="flex items-center justify-between gap-3 sm:col-span-full">
                        <label className="flex items-center gap-1.5 text-xs text-muted">
                          <input type="checkbox" name="hidden" defaultChecked={r.hidden} className="accent-accent-soft" />
                          隐藏
                        </label>
                        <button type="submit" className="hv-action min-h-0 px-3 py-1 text-xs font-mono uppercase">
                          <Save className="h-3 w-3" aria-hidden="true" />保存
                        </button>
                      </div>
                    </form>

                    <form action={async () => { "use server"; await deleteAction(r.id); }} className="border-t border-accent/15 px-2.5 py-2 text-right sm:px-3">
                      <button type="submit" className="inline-flex items-center gap-1 border border-red-400/35 bg-red-500/10 px-2.5 py-1 text-[10px] text-red-200 transition hover:border-red-300 hover:bg-red-500/15 font-mono uppercase sm:text-[11px]">
                        <Trash2 className="h-3 w-3" aria-hidden="true" />删除
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

/* ── Helper: field wrapper ──────────────────────────────────── */
function Field({ label, input }: { label: string; input: React.ReactNode }) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] uppercase text-muted sm:text-xs">{label}</span>
      <div className="mt-1">{input}</div>
    </label>
  );
}

function EditField({ label, name, defaultValue, type = "text", required }: {
  label: string; name: string; defaultValue: string; type?: string; required?: boolean;
}) {
  return (
    <div>
      <span className="font-mono text-[9px] uppercase text-muted">{label}</span>
      <input
        type={type}
        name={name}
        defaultValue={defaultValue}
        required={required}
        className="hv-input-field mt-0.5"
      />
    </div>
  );
}
