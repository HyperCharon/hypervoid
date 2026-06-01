import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { AdminBackLink } from "@/components/admin/AdminBackLink";
import { listAllWebmentions } from "@/lib/webmentions";
import { formatDateTimeCN } from "@/lib/datetime";
import { deleteAction, toggleHiddenAction } from "./actions";

export const metadata: Metadata = {
  title: "Webmention 审核",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

function hostnameOf(rawUrl: string): string {
  try {
    return new URL(rawUrl).hostname;
  } catch {
    return rawUrl;
  }
}

function statusBadge(status: string) {
  const base = "inline-flex border px-2 py-0.5 font-mono text-[10px] font-medium uppercase clip-path-[polygon(0_0,calc(100%-4px)_0,100%_4px,100%_100%,0_100%)]";
  switch (status) {
    case "verified":
      return <span className={base + " border-emerald-300/35 bg-accent/10 text-emerald-100"}>VERIFIED</span>;
    case "pending":
      return <span className={base + " border-amber-300/35 bg-accent/10 text-amber-100"}>PENDING</span>;
    case "rejected":
      return <span className={base + " border-red-300/35 bg-red-500/10 text-red-100"}>REJECTED</span>;
    default:
      return <span className={base + " border-border bg-accent-soft/10 text-muted"}>{status}</span>;
  }
}

export default async function AdminWebmentionsPage() {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  const list = await listAllWebmentions();

  const stats = {
    verified: list.filter((w) => w.status === "verified" && !w.hidden).length,
    hidden: list.filter((w) => w.hidden).length,
    pending: list.filter((w) => w.status === "pending").length,
    rejected: list.filter((w) => w.status === "rejected").length,
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="hv-panel-sci relative overflow-hidden flex flex-col gap-4 p-5 sm:flex-row sm:items-end sm:justify-between">
        {/* Corner accents */}
        <div className="absolute left-0 top-0 h-10 w-10 border-l-2 border-t-2 border-accent/60 pointer-events-none" />
        <div className="absolute right-0 bottom-0 h-10 w-10 border-r-2 border-b-2 border-accent/60 pointer-events-none" />

        <div className="space-y-3">
          <AdminBackLink href="/admin" label="后台" />
          <div>
            <p className="hv-kicker uppercase">WEBMENTION_GATE</p>
            <h1 className="hv-title mt-1 font-mono text-2xl font-semibold tracking-wider uppercase">Webmention 审核</h1>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="已验证可见" value={stats.verified} />
        <Stat label="隐藏" value={stats.hidden} />
        <Stat label="待验证" value={stats.pending} />
        <Stat label="已拒绝" value={stats.rejected} />
      </section>

      {list.length === 0 ? (
        <p className="hv-panel-sci border-dashed p-8 text-center text-sm text-muted">
          还没有 Webmention 进来。
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {list.map((w) => (
            <li key={w.id} className={"hv-panel-sci p-4 " + (w.hidden ? "opacity-60" : "")}>
              <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  {statusBadge(w.status)}
                  {w.hidden ? (
                    <span className="border border-zinc-300/25 bg-zinc-400/10 px-2 py-0.5 font-mono text-[10px] uppercase text-zinc-200 clip-path-[polygon(0_0,calc(100%-4px)_0,100%_4px,100%_100%,0_100%)]">
                      HIDDEN
                    </span>
                  ) : null}
                  <span className="font-mono text-[10px] text-muted uppercase">
                    {formatDateTimeCN(w.createdAt)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <form
                    action={async () => {
                      "use server";
                      await toggleHiddenAction(w.id, !w.hidden);
                    }}
                  >
                    <button type="submit" className="hv-action min-h-0 px-3 py-1 text-[11px] font-mono uppercase clip-path-[polygon(0_0,calc(100%-6px)_0,100%_6px,100%_100%,0_100%)]">
                      {w.hidden ? "显示" : "隐藏"}
                    </button>
                  </form>
                  <form
                    action={async () => {
                      "use server";
                      await deleteAction(w.id);
                    }}
                  >
                    <button type="submit" className="border border-red-400/35 bg-red-500/10 px-3 py-1 text-[11px] text-red-200 transition hover:border-red-300 hover:bg-red-500/15 font-mono uppercase clip-path-[polygon(0_0,calc(100%-6px)_0,100%_6px,100%_100%,0_100%)]">
                      删除
                    </button>
                  </form>
                </div>
              </header>

              <p className="text-sm text-foreground">
                <span className="text-muted">来源：</span>
                <a href={w.source} target="_blank" rel="noreferrer noopener nofollow" className="break-all hover:text-foreground">
                  {w.source}
                </a>{" "}
                <span className="font-mono text-[10px] text-muted">({hostnameOf(w.source)})</span>
              </p>
              <p className="mt-1 text-sm text-foreground">
                <span className="text-muted">目标：</span>
                <a href={"/posts/" + (w.targetSlug ?? "")} className="break-all hover:text-foreground">
                  /posts/{w.targetSlug ?? "?"}
                </a>
              </p>
              {w.authorName ? <p className="mt-1 text-xs text-muted">作者：{w.authorName}</p> : null}
              {w.content ? <p className="mt-3 line-clamp-3 text-xs leading-5 text-foreground">{w.content}</p> : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="hv-panel-sci relative overflow-hidden p-4">
      <div className="absolute right-0 top-0 h-6 w-6 border-r border-t border-accent/40 pointer-events-none" />
      <p className="hv-kicker uppercase">{label}</p>
      <p className="mt-2 font-mono text-2xl font-semibold leading-tight text-foreground">
        {value.toLocaleString("en-US")}
      </p>
    </div>
  );
}
