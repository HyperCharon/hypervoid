import Link from "next/link";
import { ArrowRight, Orbit } from "lucide-react";
import type { Post } from "@/lib/posts";

export function RelatedPosts({ posts }: { posts: Post[] }) {
  if (posts.length === 0) return null;
  return (
    <section className="mt-12">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid h-7 w-7 place-items-center border border-accent/30 bg-card text-accent" style={{ clipPath: 'polygon(0 0, calc(100% - 5px) 0, 100% 5px, 100% 100%, 0 100%)' }}>
            <Orbit className="h-3.5 w-3.5" aria-hidden />
          </div>
          <h2 className="font-mono text-lg font-bold uppercase tracking-tight text-foreground">
            Related_Orbit
          </h2>
        </div>
        <span className="inline-flex items-center gap-1.5 border border-border bg-card px-2.5 py-0.5 font-mono text-xs uppercase tracking-wider text-accent-soft" style={{ clipPath: 'polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 0 100%)' }}>
          <span className="h-1 w-1 rounded-full bg-accent-soft" />
          {posts.length} Nodes
        </span>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {posts.map((p) => (
          <Link
            key={p.slug}
            href={`/posts/${p.slug}`}
            className="group relative flex min-h-36 flex-col gap-2 overflow-hidden border border-border bg-gradient-to-br from-card to-card/50 p-4 transition hover:border-accent/35 hover:shadow-[0_0_20px_var(--accent-glow)]"
            style={{ clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)' }}
          >
            {/* Corner accent */}
            <div aria-hidden className="pointer-events-none absolute right-0 top-0 h-px w-12 bg-gradient-to-l from-accent/50 to-transparent" />
            <div aria-hidden className="pointer-events-none absolute right-0 top-0 h-12 w-px bg-gradient-to-b from-accent/50 to-transparent" />

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
            <ArrowRight className="absolute bottom-4 right-4 h-3.5 w-3.5 text-muted transition group-hover:translate-x-0.5 group-hover:text-accent" aria-hidden />
          </Link>
        ))}
      </div>
    </section>
  );
}
