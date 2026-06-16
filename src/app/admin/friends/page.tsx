import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { listFriends, listPendingApplications } from "@/db/friends";
import { AdminBackLink } from "@/components/admin/AdminBackLink";
import { PendingApplications } from "@/components/admin/PendingApplications";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "友链管理",
  robots: { index: false, follow: false },
};

export default async function AdminFriendsList() {
  const [friends, pending] = await Promise.all([
    listFriends(),
    listPendingApplications().catch(() => []),
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
            <p className="hv-kicker uppercase">LINK_CONSTELLATION</p>
            <h1 className="hv-title mt-1 font-mono text-2xl font-semibold tracking-wider uppercase">友链管理</h1>
            <p className="mt-2 font-mono text-sm text-muted uppercase">{friends.length} NODES · {pending.length} PENDING</p>
          </div>
        </div>
        <Link href="/admin/friends/new" className="hv-action px-4 text-sm font-mono uppercase hover:shadow-[0_0_20px_var(--accent-glow)]">
          <Plus className="h-4 w-4" aria-hidden="true" />
          ADD_LINK
        </Link>
      </header>

      {pending.length > 0 && <PendingApplications applications={pending} />}

      {friends.length === 0 ? (
        <p className="hv-panel-sci border-dashed p-8 text-center text-sm text-muted">
          还没有友链。
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {friends.map((f) => (
            <Link
              key={f.id}
              href={"/admin/friends/" + f.id + "/edit"}
              className="hv-panel-sci group flex gap-3 p-4"
            >
              {f.avatar ? (
                <Image
                  src={f.avatar}
                  alt=""
                  width={96}
                  height={96}
                  sizes="48px"
                  loading="lazy"
                  unoptimized
                  className="h-12 w-12 shrink-0 border border-accent/30 object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 shrink-0 items-center justify-center border border-accent/30 bg-accent/10 font-mono text-sm font-medium text-foreground">
                  {f.name.slice(0, 1).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-mono font-semibold uppercase tracking-wide text-foreground group-hover:text-foreground">
                  {f.name}
                </p>
                <p className="truncate font-mono text-xs text-muted">{f.url}</p>
                {f.description ? (
                  <p className="mt-1 line-clamp-1 text-xs text-muted">
                    {f.description}
                  </p>
                ) : null}
              </div>
              <span className="hv-chip-sci shrink-0">#{f.sortOrder}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
