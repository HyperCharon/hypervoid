import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Tags } from "lucide-react";
import { PostCard } from "@/components/PostCard";
import { PostsGrid } from "@/components/PostsGrid";
import { getAllPostMeta } from "@/lib/posts";
import { getMessages } from "@/lib/i18n-server";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "文章",
  description: "所有已发布的文章",
};

export default async function PostsIndex() {
  const [posts, t] = await Promise.all([
    getAllPostMeta().catch((error) => {
      console.warn("[posts] failed to load post list:", error instanceof Error ? error.message : error);
      return [];
    }),
    getMessages(),
  ]);
  return (
    <div className="flex flex-col gap-6">
      <header className="group relative overflow-hidden border border-border bg-gradient-to-br from-card to-background p-5 sm:p-7" style={{ clipPath: 'polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 0 100%)' }}>
        {/* Corner accents */}
        <div aria-hidden className="pointer-events-none absolute left-0 top-0 h-px w-24 bg-gradient-to-r from-accent/60 to-transparent" />
        <div aria-hidden className="pointer-events-none absolute left-0 top-0 h-24 w-px bg-gradient-to-b from-accent/60 to-transparent" />
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
              <p className="font-mono text-xs font-semibold uppercase tracking-widest text-accent">
                {t.posts.kicker}
              </p>
            </div>
            <h1 className="mt-3 font-mono text-3xl font-black uppercase leading-tight tracking-tight text-foreground sm:text-5xl">
              {t.posts.allPosts}
            </h1>
            <p className="mt-3 text-sm leading-7 text-muted">
              {t.posts.description}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 border border-border bg-accent/15 px-3 py-1 font-mono text-xs font-bold uppercase tracking-wider text-foreground" style={{ clipPath: 'polygon(0 0, calc(100% - 5px) 0, 100% 5px, 100% 100%, 0 100%)' }}>
              <span className="h-1 w-1 rounded-full bg-accent" />
              {posts.length} {t.posts.nodes}
            </span>
            <Link href="/tags" className="inline-flex items-center gap-1.5 border border-border bg-card px-4 py-1.5 font-mono text-xs font-medium uppercase tracking-wider text-foreground transition hover:border-accent/40 hover:bg-card-hover hover:text-accent-soft" style={{ clipPath: 'polygon(0 0, calc(100% - 5px) 0, 100% 5px, 100% 100%, 0 100%)' }}>
              <Tags className="h-3.5 w-3.5" aria-hidden />
              {t.posts.tags}
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>
        </div>
      </header>
      {posts.length ? (
        <PostsGrid>
          {posts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </PostsGrid>
      ) : (
        <p className="border border-dashed border-border bg-card p-8 text-center font-mono text-sm uppercase tracking-wider text-muted" style={{ clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 0 100%)' }}>
          {t.posts.empty}
        </p>
      )}
    </div>
  );
}
