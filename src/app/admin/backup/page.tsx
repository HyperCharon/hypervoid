import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Download, Plus, Trash2 } from "lucide-react";
import { auth } from "@/auth";
import { AdminBackLink } from "@/components/admin/AdminBackLink";
import { countBackups, listBackups } from "@/lib/db-backup";
import { isBlobConfigured } from "@/lib/blob";
import { formatDateTimeCN } from "@/lib/datetime";
import { createBackupAction, deleteBackupAction } from "./actions";

export const metadata: Metadata = {
  title: "数据备份",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

function formatBytes(n: number): string {
  if (n < 1024) return n + " B";
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + " KB";
  return (n / 1024 / 1024).toFixed(2) + " MB";
}

export default async function AdminBackupPage() {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  const blobReady = isBlobConfigured();
  const [list, totals] = await Promise.all([
    blobReady ? listBackups() : Promise.resolve([]),
    blobReady ? countBackups() : Promise.resolve({ count: 0, bytes: 0 }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <header className="hv-panel-sci relative overflow-hidden flex flex-col gap-4 p-5 sm:flex-row sm:items-end sm:justify-between">
        {/* Corner accents */}
        <div className="absolute left-0 top-0 h-10 w-10 border-l-2 border-t-2 border-accent/60 pointer-events-none" />
        <div className="absolute right-0 bottom-0 h-10 w-10 border-r-2 border-b-2 border-accent/60 pointer-events-none" />

        <div className="space-y-3">
          <AdminBackLink href="/admin" label="后台" />
          <div>
            <p className="hv-kicker uppercase">DATABASE_SNAPSHOT</p>
            <h1 className="hv-title mt-1 font-mono text-2xl font-semibold tracking-wider uppercase">数据备份</h1>
            <p className="mt-2 text-sm text-muted">{totals.count} 个快照，共 {formatBytes(totals.bytes)}。</p>
          </div>
        </div>
        {blobReady ? (
          <form action={createBackupAction}>
            <button type="submit" className="hv-action px-4 text-sm font-mono uppercase clip-path-[polygon(0_0,calc(100%-8px)_0,100%_8px,100%_100%,0_100%)] hover:shadow-[0_0_16px_var(--accent-glow)]">
              <Plus className="h-4 w-4" aria-hidden="true" />
              创建快照
            </button>
          </form>
        ) : null}
      </header>

      {!blobReady ? (
        <div className="hv-panel-sci border-amber-300/35 p-4 text-sm">
          <p className="font-mono font-medium uppercase text-amber-100">Vercel Blob 未配置</p>
          <p className="mt-1 text-xs text-muted">
            缺少 <code>BLOB_READ_WRITE_TOKEN</code>。在 Vercel 项目存储里创建 Blob store，再把 token 写入 env vars。
          </p>
        </div>
      ) : (
        <section className="hv-panel-sci p-5 text-sm leading-6 text-muted">
          点击「创建快照」立刻把整库导出为 JSON 上传到 Vercel Blob。包含文章、反应、审计、AI 用量、链接巡检、搜索日志等数据表。URL 含 UUID，不被搜索引擎索引；可下载或删除。
        </section>
      )}

      {list.length === 0 ? (
        <p className="hv-panel-sci border-dashed p-8 text-center text-sm text-muted">
          {blobReady ? "还没有快照。" : ""}
        </p>
      ) : (
        <div className="hv-panel-sci overflow-x-auto p-0">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="border-b border-accent/20 bg-accent/[0.06] text-left font-mono text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">TIME</th>
                <th className="px-4 py-3 font-medium">SIZE</th>
                <th className="px-4 py-3 font-medium">ROWS</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {list.map((b) => {
                const tableEntries = Object.entries(b.tableCounts ?? {});
                const totalRows = tableEntries.reduce((sum, [, n]) => sum + (n > 0 ? n : 0), 0);
                return (
                  <tr key={b.id} className="border-t border-accent/15 transition hover:bg-accent/[0.05]">
                    <td className="px-4 py-3 font-mono text-xs text-foreground">{formatDateTimeCN(b.createdAt)}</td>
                    <td className="px-4 py-3 font-mono text-xs text-foreground">{formatBytes(b.sizeBytes)}</td>
                    <td className="px-4 py-3 text-xs text-muted">
                      {tableEntries.length} 张表 · <span className="font-mono">{totalRows.toLocaleString("en-US")}</span> 行
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <a href={b.url} target="_blank" rel="noreferrer" download className="hv-action min-h-0 px-3 py-1 text-[11px] font-mono uppercase clip-path-[polygon(0_0,calc(100%-6px)_0,100%_6px,100%_100%,0_100%)]">
                          <Download className="h-3.5 w-3.5" aria-hidden="true" />
                          下载
                        </a>
                        <form
                          action={async () => {
                            "use server";
                            await deleteBackupAction(b.id);
                          }}
                        >
                          <button type="submit" className="inline-flex items-center gap-1 border border-red-400/35 bg-red-500/10 px-3 py-1 text-[11px] text-red-200 transition hover:border-red-300 hover:bg-red-500/15 font-mono uppercase clip-path-[polygon(0_0,calc(100%-6px)_0,100%_6px,100%_100%,0_100%)]">
                            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                            删除
                          </button>
                        </form>
                      </div>
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
