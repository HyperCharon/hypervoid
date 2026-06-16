import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { AdminBackLink } from "@/components/admin/AdminBackLink";
import { listAllPostReactions } from "@/lib/reactions";
import { REACTION_EMOJIS } from "@/lib/reactions-shared";

export const metadata: Metadata = {
  title: "反应数据",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminReactionsPage() {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  const rows = await listAllPostReactions();

  const totals = REACTION_EMOJIS.reduce<Record<string, number>>((acc, e) => {
    acc[e.key] = 0;
    return acc;
  }, {});
  for (const r of rows) {
    for (const e of REACTION_EMOJIS) {
      totals[e.key] += r.counts[e.key] ?? 0;
    }
  }
  const grandTotal = Object.values(totals).reduce((a, b) => a + b, 0);

  return (
    <div className="flex flex-col gap-6">
      <header className="hv-panel-sci relative overflow-hidden flex flex-col gap-4 p-4 sm:p-6 sm:flex-row sm:items-end sm:justify-between">
        {/* Corner accents */}
        <div className="absolute left-0 top-0 h-10 w-10 border-l-2 border-t-2 border-accent/60 pointer-events-none" />
        <div className="absolute right-0 bottom-0 h-10 w-10 border-r-2 border-b-2 border-accent/60 pointer-events-none" />

        <div className="space-y-3">
          <AdminBackLink href="/admin" label="后台" />
          <div>
            <p className="hv-kicker uppercase">REACTION_TELEMETRY</p>
            <h1 className="hv-title mt-1 font-mono text-2xl font-semibold tracking-wider uppercase">反应数据</h1>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="hv-chip-sci">REACTIONS {grandTotal}</span>
          <span className="hv-chip-sci">POSTS {rows.length}</span>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {REACTION_EMOJIS.map((e) => (
          <div key={e.key} className="hv-panel-sci relative overflow-hidden p-4 text-center">
            <div className="absolute right-0 top-0 h-6 w-6 border-r border-t border-accent/40 pointer-events-none" />
            <p className="text-2xl leading-none">{e.glyph}</p>
            <p className="mt-2 font-mono text-xl font-semibold leading-tight text-foreground">
              {totals[e.key].toLocaleString("en-US")}
            </p>
            <p className="text-[11px] text-muted">{e.label}</p>
          </div>
        ))}
      </section>

      {rows.length === 0 ? (
        <p className="hv-panel-sci border-dashed p-8 text-center text-sm text-muted">
          还没有反应数据。
        </p>
      ) : (
        <div className="hv-panel-sci overflow-x-auto p-0">
          <table className="w-full min-w-[320px] text-sm">
            <thead className="border-b border-accent/20 bg-accent/[0.06] text-left font-mono text-xs uppercase text-muted">
              <tr>
                <th className="px-3 py-3 font-medium">POST</th>
                {REACTION_EMOJIS.map((e) => (
                  <th key={e.key} className="hidden sm:table-cell px-2 py-3 text-center font-medium" title={e.label}>
                    {e.glyph}
                  </th>
                ))}
                <th className="px-3 py-3 text-right font-medium">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.slug} className="border-t border-accent/15 transition hover:bg-accent/[0.05]">
                  <td className="max-w-[16rem] truncate px-3 py-2">
                    <Link href={"/posts/" + r.slug} className="font-medium text-foreground hover:text-foreground" title={r.title}>
                      {r.title}
                    </Link>
                  </td>
                  {REACTION_EMOJIS.map((e) => (
                    <td key={e.key} className="hidden sm:table-cell px-2 py-2 text-center font-mono text-xs text-muted">
                      {r.counts[e.key] || ""}
                    </td>
                  ))}
                  <td className="px-3 py-2 text-right font-mono text-sm font-medium text-foreground">
                    {r.total}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
