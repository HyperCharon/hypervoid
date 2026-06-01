import Link from "next/link";
import { ArrowRight, Orbit } from "lucide-react";
import type { Post } from "@/lib/posts";

export function RelatedPosts({ posts }: { posts: Post[] }) {
  if (posts.length === 0) return null;
  return (
    <section className="mt-12">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid h-7 w-7 place-items-center border border-accent/30 bg-card text-accent">
            <Orbit className="h-3.5 w-3.5" aria-hidden />
          </div>
          <h2 className="font-mono text-lg font-bold uppercase tracking-tight text-foreground">
            相关推荐
          </h2>
        </div>
        <span className="inline-flex items-center gap-1.5 border border-border bg-card px-2.5 py-0.5 font-mono text-xs uppercase tracking-wider text-accent-soft">
          <span className="h-1 w-1 rounded-full bg-accent-soft" />
          {posts.length} 篇
        </span>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {posts.map((p) => (
          <Link
            key={p.slug}
            href={`/posts/${p.slug}`}
            className="group relative flex min-h-36 flex-col gap-2 overflow-hidden rounded-xl border border-border bg-gradient-to-br from-card to-card/50 p-4 transition hover:border-accent/35 hover:shadow-[0_0_20px_var(--accent-glow)]"
          >
            <Orbit className="h-4 w-4 text-accent-soft transition group-hover:text-accent" aria-hidden />
            <p className="line-clamp-2 text-sm font-semibold tracking-tight text-foreground transition group-hover:text-accent">
              {p.frontmatter.title}
            </p>
            {p.frontmatter.description ? (
              <p className="line-clamp-2 text-xs leading-relaxed text-muted-soft">
                {p.frontmatter.description}
              </p>
            ) : null}
            <span className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-2 font-mono text-xs uppercase tracking-wider text-muted-soft">
              <span>{p.frontmatter.date}</span>
              <span>{p.frontmatter.readingMinutes}m</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
