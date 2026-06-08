import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Link2, Plus, Trash2 } from "lucide-react";
import { auth } from "@/auth";
import { AdminBackLink } from "@/components/admin/AdminBackLink";
import { AdminTable } from "@/components/admin/AdminTable";
import { listRedirects } from "@/db/redirects";
import { formatDateTimeCN } from "@/lib/datetime";
import { siteConfig } from "@/lib/site-config";
import { createAction, deleteAction } from "./actions";

export const metadata: Metadata = {
  title: "短链管理",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminRedirectsPage() {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  const list = await listRedirects();

  return (
    <div className="flex flex-col gap-6">
      <header className="hv-panel-sci relative overflow-hidden flex flex-col gap-4 p-5 sm:flex-row sm:items-end sm:justify-between">
        {/* Corner accents */}
        <div className="absolute left-0 top-0 h-10 w-10 border-l-2 border-t-2 border-accent/60 pointer-events-none" />
        <div className="absolute right-0 bottom-0 h-10 w-10 border-r-2 border-b-2 border-accent/60 pointer-events-none" />

        <div className="space-y-3">
          <AdminBackLink href="/admin" label="后台" />
          <div>
            <p className="hv-kicker uppercase">REDIRECT_ROUTER</p>
            <h1 className="hv-title mt-1 font-mono text-2xl font-semibold tracking-wider uppercase">短链管理</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted">
              访问 <code>{siteConfig.url}/r/&lt;短码&gt;</code> 会 307 跳转到目标地址并累计命中。
            </p>
          </div>
        </div>
        <span className="hv-chip-sci">{list.length} LINKS</span>
      </header>

      <section className="hv-panel-sci p-5">
        <div className="flex items-center gap-2">
          <Link2 className="h-4 w-4 text-muted" aria-hidden="true" />
          <h2 className="font-mono text-sm font-semibold tracking-wider uppercase text-foreground">NEW_REDIRECT</h2>
        </div>
        <form action={createAction} className="mt-4 grid gap-3 lg:grid-cols-[1.1fr_2fr_1.2fr_auto] lg:items-end">
          <label className="flex flex-col gap-1">
            <span className="font-mono text-xs uppercase text-muted">CODE</span>
            <div className="flex items-center gap-1">
              <span className="font-mono text-xs text-muted">/r/</span>
              <input type="text" name="code" required pattern="[\w-]+" placeholder="welcome" className="hv-input min-h-11 flex-1 px-3 font-mono text-sm clip-path-[polygon(0_0,calc(100%-6px)_0,100%_6px,100%_100%,0_100%)]" />
            </div>
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-mono text-xs uppercase text-muted">TARGET_URL</span>
            <input type="url" name="toUrl" required placeholder="https://..." className="hv-input min-h-11 px-3 text-sm clip-path-[polygon(0_0,calc(100%-6px)_0,100%_6px,100%_100%,0_100%)]" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-mono text-xs uppercase text-muted">NOTE</span>
            <input type="text" name="note" placeholder="为什么造这条短链" className="hv-input min-h-11 px-3 text-sm clip-path-[polygon(0_0,calc(100%-6px)_0,100%_6px,100%_100%,0_100%)]" />
          </label>
          <button type="submit" className="hv-action px-4 text-sm font-mono uppercase clip-path-[polygon(0_0,calc(100%-8px)_0,100%_8px,100%_100%,0_100%)] hover:shadow-[0_0_16px_var(--accent-glow)]">
            <Plus className="h-4 w-4" aria-hidden="true" />
            创建
          </button>
        </form>
      </section>

      <div className="hv-panel-sci p-0 sm:p-0">
        <AdminTable
          columns={[
            { key: "link", label: "LINK", primary: true },
            { key: "target", label: "TARGET" },
            { key: "hits", label: "HITS", align: "right" },
            { key: "meta", label: "NOTE / CREATED", hideMobile: true },
            { key: "actions", label: "", align: "right" },
          ]}
          rows={list.map((r) => ({
            key: r.id,
            cells: {
              link: (
                <a href={"/r/" + r.code} target="_blank" rel="noreferrer" className="font-mono text-xs text-foreground hover:text-foreground">
                  /r/{r.code}
                </a>
              ),
              target: (
                <a href={r.toUrl} target="_blank" rel="noreferrer" className="break-all text-xs text-foreground hover:text-foreground">
                  {r.toUrl}
                </a>
              ),
              hits: <span className="font-mono text-xs text-foreground">{r.hits.toLocaleString("en-US")}</span>,
              meta: (
                <span className="text-xs text-muted">
                  {r.note ? <span>{r.note}</span> : null}
                  {r.note ? <span className="mx-1.5">·</span> : null}
                  {formatDateTimeCN(r.createdAt)}
                </span>
              ),
              actions: (
                <form
                  action={async () => {
                    "use server";
                    await deleteAction(r.id);
                  }}
                >
                  <button type="submit" className="inline-flex items-center gap-1 border border-red-400/35 bg-red-500/10 px-3 py-1 text-[11px] text-red-200 transition hover:border-red-300 hover:bg-red-500/15 font-mono uppercase clip-path-[polygon(0_0,calc(100%-6px)_0,100%_6px,100%_100%,0_100%)]">
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    删除
                  </button>
                </form>
              ),
            },
          }))}
          empty="还没有短链。"
        />
      </div>
    </div>
  );
}
