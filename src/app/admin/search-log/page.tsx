import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Trash2 } from "lucide-react";
import { auth } from "@/auth";
import { AdminBackLink } from "@/components/admin/AdminBackLink";
import { countSearchLog, listTopQueries } from "@/db/search-log";
import { formatDateTimeCN } from "@/lib/datetime";
import { clearSearchLogAction } from "./actions";

export const metadata: Metadata = {
  title: "搜索分析",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const DEFAULT_WINDOW = 30;

export default async function AdminSearchLogPage(props: {
  searchParams: Promise<{ days?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  const sp = await props.searchParams;
  const days = Math.max(1, Math.min(365, Number(sp.days) || DEFAULT_WINDOW));

  const [counters, top, zero] = await Promise.all([
    countSearchLog(days),
    listTopQueries({ sinceDays: days, limit: 30 }),
    listTopQueries({ sinceDays: days, limit: 30, zeroOnly: true }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <header className="hv-panel-sci relative overflow-hidden flex flex-col gap-4 p-4 sm:p-6 sm:flex-row sm:items-end sm:justify-between">
        {/* Corner accents */}
        <div className="absolute left-0 top-0 h-10 w-10 border-l-2 border-t-2 border-accent/60 pointer-events-none" />
        <div className="absolute right-0 bottom-0 h-10 w-10 border-r-2 border-b-2 border-accent/60 pointer-events-none" />

        <div className="space-y-3">
          <AdminBackLink href="/admin" label="后台" />
          <div>
            <p className="hv-kicker uppercase">SEARCH_TELEMETRY</p>
            <h1 className="hv-title mt-1 font-mono text-2xl font-semibold tracking-wider uppercase">搜索分析</h1>
            <p className="mt-2 text-sm text-muted">最近 {days} 天的站内搜索意图和零结果缺口。</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          {[7, 30, 90, 365].map((d) => (
            <Link key={d} href={"/admin/search-log?days=" + d} className={d === days ? "hv-chip-strong px-3" : "hv-chip-sci px-3 transition hover:border-accent/40 hover:text-foreground"}>
              {d} 天
            </Link>
          ))}
        </div>
      </header>

      <section className="hv-panel-sci flex flex-wrap items-center gap-5 p-5">
        <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-3">
          <Stat label="总查询数" value={counters.total} />
          <Stat label="不同查询" value={counters.distinctQueries} />
          <Stat label="零结果" value={counters.zero} tone={counters.zero > 0 ? "warn" : undefined} />
        </div>
        <form action={clearSearchLogAction}>
          <button type="submit" className="inline-flex min-h-11 items-center gap-2 border border-red-400/35 bg-red-500/10 px-3 text-xs text-red-100 transition hover:border-red-300 hover:bg-red-500/15 font-mono uppercase">
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            清空日志
          </button>
        </form>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <QueryTable title="热门查询" rows={top} emptyHint="还没有任何搜索记录。" />
        <QueryTable title="零结果查询" rows={zero} emptyHint="没有零结果查询。" highlight />
      </section>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: "warn" }) {
  return (
    <div>
      <p className="hv-kicker uppercase">{label}</p>
      <p className={"mt-1 font-mono text-2xl font-semibold leading-tight " + (tone === "warn" ? "text-amber-200" : "text-foreground")}>
        {value.toLocaleString("en-US")}
      </p>
    </div>
  );
}

function QueryTable({
  title,
  rows,
  emptyHint,
  highlight,
}: {
  title: string;
  rows: {
    query: string;
    hits: number;
    uniqueIps: number;
    zeroResultHits: number;
    lastSeen: Date;
  }[];
  emptyHint: string;
  highlight?: boolean;
}) {
  return (
    <div className="hv-panel-sci overflow-hidden p-0">
      <h2 className="border-b border-accent/20 bg-accent/[0.06] px-4 py-3 font-mono text-sm font-semibold tracking-wider uppercase text-foreground">
        {title}
      </h2>
      {rows.length === 0 ? (
        <p className="p-6 text-center text-xs text-muted">{emptyHint}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[320px] text-sm">
            <thead className="text-left font-mono text-xs uppercase text-muted">
              <tr>
                <th className="px-3 py-2 font-medium">QUERY</th>
                <th className="px-2 py-2 font-medium">HITS</th>
                <th className="hidden sm:table-cell px-2 py-2 font-medium">UNIQUE_IP</th>
                <th className="hidden sm:table-cell px-2 py-2 font-medium">LAST</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.query} className={"border-t border-accent/15 transition hover:bg-accent/[0.05] " + (highlight ? "bg-amber-500/[0.03]" : "")}>
                  <td className="px-4 py-2">
                    <Link href={"/search?q=" + encodeURIComponent(r.query)} className="break-all text-foreground hover:text-foreground">
                      {r.query}
                    </Link>
                  </td>
                  <td className="px-2 py-2 font-mono text-xs text-foreground">{r.hits}</td>
                  <td className="hidden sm:table-cell px-2 py-2 font-mono text-xs text-muted">{r.uniqueIps}</td>
                  <td className="hidden sm:table-cell px-2 py-2 font-mono text-[11px] text-muted">{formatDateTimeCN(r.lastSeen)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
