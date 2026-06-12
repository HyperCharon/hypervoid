import Link from "next/link";
import { Folder, PenLine } from "lucide-react";
import type { Metadata } from "next";
import { listAllPosts } from "@/db/admin-posts";
import { AdminBackLink } from "@/components/admin/AdminBackLink";
import { PostsTable, type PostRow } from "@/components/admin/PostsTable";

export const metadata: Metadata = {
  title: "文章管理",
  robots: { index: false, follow: false },
};

const UNCATEGORIZED = "__uncategorized__";

export const dynamic = "force-dynamic";

export default async function AdminPostsList(props: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category: rawCategory } = await props.searchParams;
  const activeCategory = rawCategory?.trim() || "";

  const allPosts = await listAllPosts();

  const byCategory = new Map<string, number>();
  for (const p of allPosts) {
    const key = p.category?.trim() || UNCATEGORIZED;
    byCategory.set(key, (byCategory.get(key) ?? 0) + 1);
  }
  const categories = [...byCategory.entries()].sort((a, b) => {
    if (a[0] === UNCATEGORIZED) return 1;
    if (b[0] === UNCATEGORIZED) return -1;
    return b[1] - a[1];
  });

  const posts = activeCategory
    ? allPosts.filter((p) => {
        const cat = p.category?.trim() || UNCATEGORIZED;
        return cat === activeCategory;
      })
    : allPosts;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <AdminBackLink href="/admin" label="后台" />
          <div>
            <h1 className="text-lg font-bold tracking-tight">文章管理</h1>
            <p className="text-xs text-muted">{allPosts.length} 篇 · {categories.length} 个分类</p>
          </div>
        </div>
        <Link
          href="/admin/posts/new"
          className="flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
          style={{ background: "var(--accent)", color: "#fff" }}
        >
          <PenLine className="h-4 w-4" /> 新文章
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-[180px_minmax(0,1fr)]">
        <aside className="rounded-xl border border-border bg-card p-3 text-sm">
          <p className="mb-2 flex items-center gap-1.5 px-2 text-xs text-muted">
            <Folder className="h-3.5 w-3.5" /> 分类
          </p>
          <div className="flex flex-col gap-0.5">
            <CategoryLink
              href="/admin/posts"
              label="全部"
              count={allPosts.length}
              active={!activeCategory}
            />
            {categories.map(([cat, count]) => (
              <CategoryLink
                key={cat}
                href={`/admin/posts?category=${encodeURIComponent(cat)}`}
                label={cat === UNCATEGORIZED ? "未分类" : cat}
                count={count}
                active={activeCategory === cat}
                muted={cat === UNCATEGORIZED}
              />
            ))}
          </div>
        </aside>

        <PostsTable
          posts={posts.map<PostRow>((p) => ({
            slug: p.slug,
            title: p.title,
            category: p.category ?? null,
            status: p.status,
            visibility: p.visibility,
            pinned: p.pinned,
            publishAt: p.publishAt,
            updatedAt: p.updatedAt,
          }))}
          activeCategoryEmpty={Boolean(activeCategory)}
        />
      </div>
    </div>
  );
}

function CategoryLink({
  href,
  label,
  count,
  active,
  muted,
}: {
  href: string;
  label: string;
  count: number;
  active: boolean;
  muted?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-sm transition-colors ${
        active
          ? "bg-accent/10 text-accent font-medium"
          : "text-muted hover:text-foreground hover:bg-card-hover"
      } ${muted && !active ? "italic" : ""}`}
    >
      <span className="truncate">{label}</span>
      <span className="ml-2 shrink-0 text-xs opacity-60">{count}</span>
    </Link>
  );
}
