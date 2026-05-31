"use client";

import Link from "next/link";
import { ArrowRight, Pin, Sparkles } from "lucide-react";
import type { PostMeta } from "@/lib/posts";
import { useT } from "@/components/LocaleProvider";

export function DailyPick({ post }: { post: PostMeta }) {
  const t = useT();
  const { slug, frontmatter } = post;
  return (
    <Link
      href={`/posts/${slug}`}
      className="hv-daily-pick group relative flex items-center gap-4 overflow-hidden rounded-2xl p-3 transition sm:p-4"
    >
      {/* Animated sparkle indicator */}
      <div aria-hidden className="hv-daily-sparkle-h pointer-events-none absolute right-0 top-0 h-px w-20" />
      <div aria-hidden className="hv-daily-sparkle-v pointer-events-none absolute right-0 top-0 h-20 w-px" />

      <div className="hv-daily-icon grid h-11 w-11 shrink-0 place-items-center rounded-xl transition group-hover:shadow-[0_0_20px_var(--rainbow-glow)]">
        <Sparkles className="h-5 w-5 transition group-hover:scale-110" aria-hidden />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full" style={{ background: "var(--rainbow)" }} />
          <p className="font-mono text-xs font-semibold uppercase tracking-widest text-accent/80">
            {t.home.dailyPick}
          </p>
        </div>
        <p className="mt-1 flex min-w-0 items-center gap-1.5 text-sm font-semibold tracking-tight text-foreground transition group-hover:text-accent">
          {frontmatter.pinned ? <Pin className="h-3.5 w-3.5 shrink-0 text-accent/75" aria-hidden /> : null}
          <span className="line-clamp-1 min-w-0">{frontmatter.title}</span>
        </p>
        {frontmatter.description ? (
          <p className="mt-1 line-clamp-1 text-xs text-muted" style={{ textShadow: "var(--text-shadow-subtle)" }}>
            {frontmatter.description}
          </p>
        ) : null}
      </div>

      <div className="hidden shrink-0 flex-col items-end gap-1 sm:flex">
        <span className="font-mono text-xs uppercase tracking-wider text-muted-soft">
          {frontmatter.readingMinutes}{t.post.readingTimeSuffix}
        </span>
        <ArrowRight className="h-4 w-4 text-muted transition group-hover:translate-x-0.5 group-hover:text-accent" aria-hidden />
      </div>
    </Link>
  );
}
