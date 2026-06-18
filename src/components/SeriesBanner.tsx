import Link from "next/link";
import { ArrowRight, ListTree, RadioTower } from "lucide-react";
import type { Post, PostMeta } from "@/lib/posts";
import { getPostsBySeries } from "@/lib/posts";

export async function SeriesBanner({ post }: { post: Post }) {
  const seriesName = post.frontmatter.series;
  if (!seriesName) return null;

  const seriesPosts: PostMeta[] = await getPostsBySeries(seriesName);
  if (seriesPosts.length <= 1) return null;

  const currentIndex = seriesPosts.findIndex((p) => p.slug === post.slug);
  const position = currentIndex >= 0 ? currentIndex + 1 : 1;

  return (
    <aside className="hv-panel mt-6 overflow-hidden">
      <Link
        href={`/series/${encodeURIComponent(seriesName)}`}
        className="hv-series-banner-link block px-4 py-3 transition hover:bg-card-hover"
      >
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="inline-flex items-center gap-2 font-medium text-foreground">
            <RadioTower className="h-4 w-4 text-accent-soft" aria-hidden />
            本文是「{seriesName}」系列的第 {position} 篇 / 共 {seriesPosts.length} 篇
          </span>
          <span className="inline-flex items-center gap-1 font-mono uppercase text-muted">
            查看全部 <ArrowRight className="h-3 w-3" aria-hidden />
          </span>
        </div>
      </Link>
      <div className="border-t border-border px-4 py-3">
        <div className="flex flex-col gap-1.5 text-sm">
          {seriesPosts.map((p, i) => {
            const isCurrent = p.slug === post.slug;
            return (
              <Link
                key={p.slug}
                href={`/posts/${p.slug}`}
                className={`flex items-baseline gap-2 rounded-md px-2 py-1 transition ${
                  isCurrent
                    ? "bg-foreground/5 font-medium text-accent"
                    : "text-muted hover:bg-card hover:text-foreground"
                }`}
              >
                <span className="shrink-0 font-mono text-xs opacity-70">
                  {String(p.frontmatter.seriesOrder ?? i + 1).padStart(2, "0")}
                </span>
                <ListTree className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-55" aria-hidden />
                <span className="line-clamp-1 flex-1">
                  {p.frontmatter.title}
                </span>
                {isCurrent ? (
                  <span className="shrink-0 text-xs uppercase tracking-wider">
                    当前
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
