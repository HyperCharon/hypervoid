"use client";

import Link from "next/link";
import { Check, RadioTower } from "lucide-react";
import { useReadPosts } from "@/lib/use-read-posts";
import type { Post } from "@/lib/posts";

export function SeriesPostList({
  posts,
  seriesName,
}: {
  posts: Post[];
  seriesName: string;
}) {
  const readPosts = useReadPosts();
  const readCount = posts.filter((p) => readPosts.has(p.slug)).length;
  const total = posts.length;

  return (
    <>
      <header className="hv-panel p-4">
        <p className="hv-kicker inline-flex items-center gap-2">
          <RadioTower className="h-3.5 w-3.5" aria-hidden />
          Series progress
        </p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <h2 className="hv-title text-xl font-semibold tracking-normal">
            {seriesName}
          </h2>
          <span className="hv-chip">
            {readCount}/{total} read
          </span>
        </div>
        {total > 0 ? (
          <div className="mt-3 h-1.5 w-full overflow-hidden bg-border">
            <div
              className="h-full bg-foreground shadow-[0_0_14px_var(--accent-glow)] transition-all duration-500"
              style={{ width: String(Math.round((readCount / total) * 100)) + "%" }}
            />
          </div>
        ) : null}
      </header>

      <ol className="flex flex-col gap-2">
        {posts.map((post, i) => {
          const isRead = readPosts.has(post.slug);
          return (
            <li key={post.slug}>
              <Link
                href={"/posts/" + post.slug}
                className={"hv-panel hv-panel-hover group flex items-baseline gap-4 p-4 " + (isRead ? "opacity-[0.72]" : "")}
              >
                <span className="shrink-0 font-mono text-sm text-muted">
                  {String(post.frontmatter.seriesOrder ?? i + 1).padStart(
                    2,
                    "0",
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p
                    className={"font-medium tracking-tight transition " + (
                      isRead
                        ? "text-muted-soft line-through decoration-border"
                        : "text-foreground group-hover:text-accent"
                    )}
                  >
                    {post.frontmatter.title}
                  </p>
                  {post.frontmatter.description ? (
                    <p className="mt-0.5 line-clamp-1 text-xs text-muted-soft">
                      {post.frontmatter.description}
                    </p>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {isRead ? (
                    <span className="hv-chip text-xs">
                      <Check className="h-3 w-3" aria-hidden /> 已读
                    </span>
                  ) : null}
                  <time className="font-mono text-xs text-muted-soft">
                    {post.frontmatter.date}
                  </time>
                </div>
              </Link>
            </li>
          );
        })}
      </ol>
    </>
  );
}
