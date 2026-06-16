import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { AdminBackLink } from "@/components/admin/AdminBackLink";
import { getAuditFacets, listAuditLog } from "@/lib/audit";
import { formatDateTimeCN } from "@/lib/datetime";

export const metadata: Metadata = {
  title: "操作审计",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const ACTION_LABEL: Record<string, string> = {
  "post.create": "新建文章",
  "post.update": "编辑文章",
  "post.delete": "删除文章",
  "announcement.create": "新建公告",
  "announcement.update": "编辑公告",
  "announcement.delete": "删除公告",
  "announcement.toggle": "切换公告",
  "redirect.create": "新建短链",
  "redirect.delete": "删除短链",
  "guestbook.hide": "隐藏留言",
  "guestbook.unhide": "恢复留言",
  "guestbook.delete": "删除留言",
  "subscriber.delete": "删除订阅",
  "subscriber.unsubscribe": "强制退订",
  "subscriber.restore": "恢复订阅",
  "theme.save": "保存自定义主题",
  "media.delete": "删除图片",
};

export default async function AdminAuditPage(props: {
  searchParams: Promise<{
    actor?: string;
    prefix?: string;
    target?: string;
  }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  const sp = await props.searchParams;
  const filters = {
    actor: sp.actor?.trim() || undefined,
    actionPrefix: sp.prefix?.trim() || undefined,
    targetType: sp.target?.trim() || undefined,
  };

  const [log, facets] = await Promise.all([
    listAuditLog(300, filters),
    getAuditFacets(),
  ]);

  const buildHref = (override: Partial<typeof sp>) => {
    const next = { ...sp, ...override };
    const params = new URLSearchParams();
    if (next.actor) params.set("actor", next.actor);
    if (next.prefix) params.set("prefix", next.prefix);
    if (next.target) params.set("target", next.target);
    const qs = params.toString();
    return qs ? "/admin/audit?" + qs : "/admin/audit";
  };
  const activeCount = (filters.actor ? 1 : 0) + (filters.actionPrefix ? 1 : 0) + (filters.targetType ? 1 : 0);

  return (
    <div className="flex flex-col gap-6">
      <header className="hv-panel-sci relative overflow-hidden flex flex-col gap-4 p-4 sm:p-6 sm:flex-row sm:items-end sm:justify-between">
        {/* Corner accents */}
        <div className="absolute left-0 top-0 h-10 w-10 border-l-2 border-t-2 border-accent/60 pointer-events-none" />
        <div className="absolute right-0 bottom-0 h-10 w-10 border-r-2 border-b-2 border-accent/60 pointer-events-none" />

        <div className="space-y-3">
          <AdminBackLink href="/admin" label="后台" />
          <div>
            <p className="hv-kicker uppercase">IMMUTABLE_AUDIT_TRAIL</p>
            <h1 className="hv-title mt-1 font-mono text-2xl font-semibold tracking-wider uppercase">操作审计</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted">所有改动数据库或外部资源的后台操作都会留痕。仅追加，不可编辑。</p>
          </div>
        </div>
        <span className="hv-chip-sci">{activeCount > 0 ? log.length + " 条过滤结果" : "最近 " + log.length + " 条"}</span>
      </header>

      <section className="hv-panel-sci flex flex-col gap-3 p-4 text-xs">
        <FilterRow label="操作人">
          <FilterChip href={buildHref({ actor: undefined })} active={!filters.actor} label="全部" />
          {facets.actors.map((a) => (
            <FilterChip key={a} href={buildHref({ actor: filters.actor === a ? undefined : a })} active={filters.actor === a} label={"@" + a} />
          ))}
        </FilterRow>
        <FilterRow label="动作类别">
          <FilterChip href={buildHref({ prefix: undefined })} active={!filters.actionPrefix} label="全部" />
          {facets.actionPrefixes.map((p) => (
            <FilterChip key={p} href={buildHref({ prefix: filters.actionPrefix === p ? undefined : p })} active={filters.actionPrefix === p} label={p} />
          ))}
        </FilterRow>
        <FilterRow label="目标类型">
          <FilterChip href={buildHref({ target: undefined })} active={!filters.targetType} label="全部" />
          {facets.targetTypes.map((t) => (
            <FilterChip key={t} href={buildHref({ target: filters.targetType === t ? undefined : t })} active={filters.targetType === t} label={t} />
          ))}
        </FilterRow>
      </section>

      {log.length === 0 ? (
        <p className="hv-panel-sci border-dashed p-8 text-center text-sm text-muted">还没有审计记录。</p>
      ) : (
        <ol className="flex flex-col gap-2">
          {log.map((row) => (
            <li key={row.id} className="hv-panel-sci flex flex-wrap items-baseline gap-x-3 gap-y-2 px-3 py-2 text-sm">
              <time className="shrink-0 font-mono text-[11px] text-muted">{formatDateTimeCN(row.createdAt)}</time>
              <span className="shrink-0 border border-accent/30 bg-accent/10 px-2 py-0.5 font-mono text-[10px] font-medium text-foreground" title={row.action}>
                {ACTION_LABEL[row.action] ?? row.action}
              </span>
              <span className="font-mono text-xs text-muted">@{row.actor}</span>
              {row.targetType ? (
                <span className="font-mono text-xs text-muted">
                  {row.targetType}{row.targetId ? " · " + row.targetId.slice(0, 32) : ""}
                </span>
              ) : null}
              {row.details ? (
                <details className="ml-auto text-[11px] text-muted">
                  <summary className="cursor-pointer hover:text-foreground">详情</summary>
                  <pre className="mt-2 max-w-[min(42rem,80vw)] overflow-x-auto border border-accent/15 bg-black/30 p-2 font-mono text-[10px] text-foreground">
                    {JSON.stringify(row.details, null, 2)}
                  </pre>
                </details>
              ) : null}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="mr-1 min-w-16 text-muted">{label}：</span>
      {children}
    </div>
  );
}

function FilterChip({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link href={href} className={(active ? "hv-chip-strong" : "hv-chip-sci hover:border-accent/40 hover:text-foreground") + " px-2.5 py-0.5 transition"}>
      {label}
    </Link>
  );
}
