import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { AdminBackLink } from "@/components/admin/AdminBackLink";
import { AdminTable } from "@/components/admin/AdminTable";
import { getSubscriberStats, listAllSubscribers } from "@/db/subscribers";
import { formatDateTimeCN } from "@/lib/datetime";
import {
  deleteAction,
  restoreAction,
  unsubscribeAction,
} from "./actions";

export const metadata: Metadata = {
  title: "订阅者管理",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

function statusOf(sub: {
  verified: boolean;
  unsubscribedAt: Date | null;
}): {
  label: string;
  cls: string;
} {
  if (sub.unsubscribedAt) {
    return {
      label: "已退订",
      cls: "border-zinc-400/30 bg-zinc-400/10 text-zinc-200",
    };
  }
  if (sub.verified) {
    return {
      label: "已确认",
      cls: "border-accent/35 bg-accent/10 text-emerald-200",
    };
  }
  return {
    label: "待确认",
    cls: "border-accent/35 bg-accent/10 text-amber-200",
  };
}

export default async function AdminSubscribersPage() {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  const [subs, stats] = await Promise.all([
    listAllSubscribers(),
    getSubscriberStats(),
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
            <p className="hv-kicker uppercase">SUBSCRIBER_RELAY</p>
            <h1 className="hv-title mt-1 font-mono text-2xl font-semibold tracking-wider uppercase">订阅者管理</h1>
          </div>
        </div>
        <p className="max-w-xl text-sm text-muted">
          维护邮件订阅状态。退订可恢复，删除会从数据库移除，但用户后续仍可重新订阅。
        </p>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="总数" value={stats.total} />
        <StatTile label="已确认" value={stats.verified} accent="emerald" />
        <StatTile label="待确认" value={stats.pending} accent="amber" />
        <StatTile label="已退订" value={stats.unsubscribed} />
      </section>

      <div className="hv-panel-sci p-0">
        <AdminTable
          empty="还没有订阅者。"
          columns={[
            { key: "email", label: "EMAIL", primary: true },
            { key: "status", label: "STATUS" },
            { key: "subscribed", label: "SUBSCRIBED" },
            { key: "confirmed", label: "CONFIRMED", hideMobile: true },
            { key: "actions", label: "", align: "right" },
          ]}
          rows={subs.map((sub) => {
            const s = statusOf(sub);
            return {
              key: sub.id,
              cells: {
                email: (
                  <span className="font-mono text-xs">{sub.email}</span>
                ),
                status: (
                  <span className={"inline-flex border px-2 py-0.5 font-mono text-[11px] uppercase " + s.cls}>
                    {s.label}
                  </span>
                ),
                subscribed: (
                  <span className="font-mono text-xs text-muted uppercase">
                    {formatDateTimeCN(sub.createdAt)}
                  </span>
                ),
                confirmed: (
                  <span className="font-mono text-xs text-muted uppercase">
                    {sub.verifiedAt ? formatDateTimeCN(sub.verifiedAt) : "—"}
                  </span>
                ),
                actions: (
                  <div className="flex justify-end gap-2">
                    {sub.unsubscribedAt ? (
                      <form
                        action={async () => {
                          "use server";
                          await restoreAction(sub.id);
                        }}
                      >
                        <button type="submit" className="hv-action min-h-0 px-3 py-1 text-[11px] font-mono uppercase">
                          恢复
                        </button>
                      </form>
                    ) : (
                      <form
                        action={async () => {
                          "use server";
                          await unsubscribeAction(sub.id);
                        }}
                      >
                        <button type="submit" className="hv-action min-h-0 px-3 py-1 text-[11px] font-mono uppercase hover:border-amber-300/60 hover:text-amber-100">
                          退订
                        </button>
                      </form>
                    )}
                    <form
                      action={async () => {
                        "use server";
                        await deleteAction(sub.id);
                      }}
                    >
                      <button type="submit" className="min-h-0 border border-red-400/35 bg-red-500/10 px-3 py-1 text-[11px] text-red-200 transition hover:border-red-300 hover:bg-red-500/15 font-mono uppercase">
                        删除
                      </button>
                    </form>
                  </div>
                ),
              },
            };
          })}
        />
      </div>
    </div>
  );
}

function StatTile({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: "emerald" | "amber";
}) {
  const accentClass =
    accent === "emerald"
      ? "text-emerald-200"
      : accent === "amber"
        ? "text-amber-200"
        : "text-foreground";
  return (
    <div className="hv-panel-sci relative overflow-hidden p-4">
      {/* Corner accent */}
      <div className="absolute right-0 top-0 h-8 w-8 border-r border-t border-accent/40 pointer-events-none" />
      <p className="hv-kicker uppercase">{label}</p>
      <p className={"mt-2 font-mono text-2xl font-semibold leading-tight sm:text-3xl " + accentClass}>
        {value.toLocaleString("en-US")}
      </p>
    </div>
  );
}
