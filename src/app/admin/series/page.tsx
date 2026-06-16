import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { AdminBackLink } from "@/components/admin/AdminBackLink";
import { listAllSeries } from "@/db/series-admin";
import { listAllPosts } from "@/db/admin-posts";
import {
  createSeriesAction,
  updateSeriesAction,
  deleteSeriesAction,
  assignPostToSeriesAction,
} from "./actions";

export const metadata: Metadata = {
  title: "专题合集",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminSeriesPage() {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  const [series, allPosts] = await Promise.all([
    listAllSeries(),
    listAllPosts(),
  ]);

  const assignedSlugs = new Set(
    series.flatMap((s) => s.posts.map((p) => p.slug)),
  );
  const unassigned = allPosts.filter(
    (p) => !assignedSlugs.has(p.slug) && p.status === "published",
  );

  return (
    <div className="flex flex-col gap-6">
      <header className="hv-panel-sci p-4 sm:p-6 relative overflow-hidden">
        {/* Corner accents */}
        <div className="absolute left-0 top-0 h-10 w-10 border-l-2 border-t-2 border-accent/60 pointer-events-none" />
        <div className="absolute right-0 bottom-0 h-10 w-10 border-r-2 border-b-2 border-accent/60 pointer-events-none" />

        <AdminBackLink href="/admin" label="后台" />
        <p className="hv-kicker mt-4 uppercase">SERIES_REGISTRY</p>
        <h1 className="hv-title mt-1 font-mono text-2xl font-semibold tracking-wider uppercase">专题合集</h1>
        <p className="mt-2 font-mono text-sm text-muted uppercase">{series.length} SERIES</p>
      </header>

      <p className="text-sm text-muted">
        系列名会同步到文章的 frontmatter 字段。
      </p>

      {/* Create new series */}
      <section className="hv-panel-sci p-5">
        <h2 className="font-mono text-sm font-semibold tracking-wider text-foreground uppercase">CREATE_NEW_SERIES</h2>
        <form action={createSeriesAction} className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="font-mono text-xs text-muted uppercase">SERIES_NAME *</span>
            <input
              type="text"
              name="name"
              required
              placeholder="如：Next.js 实战"
              className="hv-input min-h-11 px-3 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-mono text-xs text-muted uppercase">URL_SLUG *</span>
            <input
              type="text"
              name="slug"
              required
              pattern="[a-z0-9][a-z0-9-]*"
              placeholder="如：nextjs-practice"
              className="hv-input min-h-11 px-3 font-mono text-sm"
            />
          </label>
          <label className="flex flex-col gap-1 sm:col-span-2">
            <span className="font-mono text-xs text-muted uppercase">DESCRIPTION</span>
            <input
              type="text"
              name="description"
              placeholder="一句话描述这个系列"
              className="hv-input min-h-11 px-3 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1 sm:col-span-2">
            <span className="font-mono text-xs text-muted uppercase">COVER_URL</span>
            <input
              type="text"
              name="cover"
              placeholder="/images/series-cover.jpg 或外部 URL"
              className="hv-input min-h-11 px-3 text-sm"
            />
          </label>
          <div className="sm:col-span-2">
            <button
              type="submit"
              className="hv-action px-5 text-sm font-medium font-mono uppercase  hover:shadow-[0_0_20px_var(--accent-glow)]"
            >
              CREATE
            </button>
          </div>
        </form>
      </section>

      {/* Series list */}
      {series.length === 0 ? (
        <p className="hv-panel-sci border-dashed p-8 text-center text-sm text-muted">
          还没有任何系列。使用上方表单创建第一个。
        </p>
      ) : (
        <div className="flex flex-col gap-5">
          {series.map((s) => (
            <SeriesCard key={s.slug} series={s} unassignedPosts={unassigned} />
          ))}
        </div>
      )}
    </div>
  );
}

function SeriesCard({
  series: s,
  unassignedPosts,
}: {
  series: Awaited<ReturnType<typeof listAllSeries>>[number];
  unassignedPosts: Awaited<ReturnType<typeof listAllPosts>>;
}) {
  return (
    <div className="hv-panel-sci p-5">
      {/* Header with edit form */}
      <details className="group">
        <summary className="flex cursor-pointer items-center justify-between gap-3">
          <div className="flex items-baseline gap-2">
            <h2 className="font-mono text-base font-semibold tracking-wider text-foreground uppercase">{s.name}</h2>
            <span className="font-mono text-xs text-muted">/{s.slug}</span>
            <span className="hv-chip-sci">{s.count} 篇</span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/series/${encodeURIComponent(s.name)}`}
              className="hv-action min-h-0 px-2.5 py-1 text-[11px] font-mono uppercase"
            >
              VIEW
            </Link>
            <span className="font-mono text-[11px] text-muted group-open:hidden uppercase">EXPAND</span>
            <span className="hidden font-mono text-[11px] text-muted group-open:inline uppercase">COLLAPSE</span>
          </div>
        </summary>

        <form action={updateSeriesAction} className="mt-4 grid gap-3 sm:grid-cols-2">
          <input type="hidden" name="oldSlug" value={s.slug} />
          <label className="flex flex-col gap-1">
            <span className="font-mono text-xs text-muted uppercase">SERIES_NAME</span>
            <input
              type="text"
              name="name"
              defaultValue={s.name}
              required
              className="hv-input min-h-11 px-3 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-mono text-xs text-muted uppercase">URL_SLUG</span>
            <input
              type="text"
              name="slug"
              defaultValue={s.slug}
              required
              pattern="[a-z0-9][a-z0-9-]*"
              className="hv-input min-h-11 px-3 font-mono text-sm"
            />
          </label>
          <label className="flex flex-col gap-1 sm:col-span-2">
            <span className="font-mono text-xs text-muted uppercase">DESCRIPTION</span>
            <input
              type="text"
              name="description"
              defaultValue={s.description ?? ""}
              placeholder="一句话描述"
              className="hv-input min-h-11 px-3 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1 sm:col-span-2">
            <span className="font-mono text-xs text-muted uppercase">COVER_URL</span>
            <input
              type="text"
              name="cover"
              defaultValue={s.cover ?? ""}
              placeholder="/images/cover.jpg"
              className="hv-input min-h-11 px-3 text-sm"
            />
          </label>
          <div className="flex gap-2 sm:col-span-2">
            <button
              type="submit"
              className="hv-action px-4 text-sm font-medium font-mono uppercase hover:shadow-[0_0_16px_var(--accent-glow)]"
            >
              SAVE
            </button>
            <form
              action={async () => {
                "use server";
                await deleteSeriesAction(s.slug);
              }}
            >
              <button
                type="submit"
                className="border border-red-400/35 bg-red-500/10 px-4 py-2 text-sm text-red-200 transition hover:border-red-300 hover:bg-red-500/15 font-mono uppercase"
              >
                DELETE
              </button>
            </form>
          </div>
        </form>
      </details>

      {/* Posts in this series */}
      <div className="mt-4">
        <h3 className="font-mono text-xs font-medium text-muted uppercase">POSTS_IN_SERIES</h3>
        {s.posts.length === 0 ? (
          <p className="mt-2 text-xs text-muted">暂无文章。在下方添加。</p>
        ) : (
          <ul className="mt-2 space-y-1">
            {s.posts.map((p, i) => (
              <li
                key={p.slug}
                className="flex items-center gap-2 border border-transparent px-2 py-1.5 text-sm transition hover:border-accent/20 hover:bg-accent/5"
              >
                <span className="grid h-5 w-5 shrink-0 place-items-center border border-accent/30 bg-accent/10 font-mono text-[10px] text-foreground">
                  {p.seriesOrder ?? i + 1}
                </span>
                <Link
                  href={`/admin/posts/${p.slug}/edit`}
                  className="min-w-0 flex-1 truncate text-foreground hover:text-foreground"
                >
                  {p.title}
                </Link>
                <form action={async () => {
                  "use server";
                  await assignPostToSeriesAction(p.slug, null);
                }}>
                  <button
                    type="submit"
                    className="shrink-0 border border-red-400/25 bg-red-500/5 px-1.5 py-0.5 font-mono text-[10px] text-red-200 transition hover:border-red-300 uppercase"
                    title="从系列中移除"
                  >
                    REMOVE
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}

        {/* Add post to series */}
        {unassignedPosts.length > 0 && (
          <form
            action={async (fd: FormData) => {
              "use server";
              const postSlug = String(fd.get("postSlug") ?? "");
              if (postSlug) await assignPostToSeriesAction(postSlug, s.name);
            }}
            className="mt-3 flex gap-2"
          >
            <select
              name="postSlug"
              required
              defaultValue=""
              className="hv-input flex-1 px-3 py-1.5 text-sm"
            >
              <option value="" disabled>
                添加文章到此系列…
              </option>
              {unassignedPosts.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.title}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="hv-action min-h-0 px-3 py-1.5 text-sm font-mono uppercase"
            >
              ADD
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
