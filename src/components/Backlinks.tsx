import Link from "next/link";
import { CornerDownRight } from "lucide-react";
import type { PostMeta } from "@/lib/posts";

export function Backlinks({ posts }: { posts: PostMeta[] }) {
  if (posts.length === 0) return null;
  return (
    <section className="mt-12">
      <h2 className="hv-title mb-4 flex items-center gap-2 text-xl font-semibold tracking-normal">
        <CornerDownRight className="h-5 w-5 text-accent-soft" aria-hidden />
        被这些文章引用
        <span className="hv-chip text-xs font-normal">
          ({posts.length})
        </span>
      </h2>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {posts.map((p) => (
          <Link
            key={p.slug}
            href={`/posts/${p.slug}`}
            className="hv-panel hv-panel-hover group flex flex-col gap-1 p-3"
          >
            <p className="line-clamp-1 text-sm font-medium tracking-tight text-foreground transition group-hover:text-accent">
              {p.frontmatter.title}
            </p>
            <p className="text-xs text-muted-soft">
              {p.frontmatter.date}
              {p.frontmatter.tags.length > 0 ? (
                <>
                  {" · "}
                  <span className="font-mono">
                    {p.frontmatter.tags.slice(0, 3).join(", ")}
                  </span>
                </>
              ) : null}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
