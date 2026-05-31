"use client";

import Link from "next/link";
import { Clock3 } from "lucide-react";
import type { PostMeta } from "@/lib/posts";
import { ReadBadge } from "@/components/ReadBadge";
import { useT } from "@/components/LocaleProvider";

const RAINBOW = [
  "#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4",
  "#3b82f6", "#6366f1", "#8b5cf6", "#d946ef", "#ec4899",
];

export function CompactPostCard({
  post,
  index = 0,
}: {
  post: PostMeta;
  index?: number;
}) {
  const t = useT();
  const { slug, frontmatter } = post;
  const accent = RAINBOW[index % RAINBOW.length];

  return (
    <Link
      href={`/posts/${slug}`}
      className="hv-compact-card group relative block py-4 transition-all duration-300 will-change-transform hover:scale-[1.003] active:scale-100"
      style={{ ["--card-accent" as string]: accent }}
    >
      {/* Divider line */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px opacity-10 transition-opacity duration-300 group-hover:opacity-40"
        style={{ background: accent }}
      />

      {/* Hover glow background */}
      <div
        aria-hidden
        className="hv-compact-glow absolute -inset-x-3 -inset-y-1 rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      />

      <div className="relative flex items-baseline gap-2 sm:gap-3">
        {/* Date — hidden on very small screens */}
        <time
          className="hidden shrink-0 font-mono text-xs tracking-wider text-muted transition-colors duration-300 group-hover:text-muted-soft sm:block"
          style={{ minWidth: "5.5rem" }}
        >
          {frontmatter.date}
        </time>

        {/* Title — with CSS glow on hover */}
        <h3 className="hv-compact-title min-w-0 truncate font-mono text-base font-bold tracking-tight transition-all duration-300 sm:text-lg">
          {frontmatter.title}
        </h3>

        {/* Reading time */}
        <span className="hidden shrink-0 items-center gap-1 font-mono text-xs uppercase tracking-wider text-muted transition-colors duration-300 group-hover:text-muted-soft sm:flex">
          <Clock3 className="h-3 w-3" aria-hidden />
          {frontmatter.readingMinutes}{t.post.readingTimeSuffix}
        </span>
      </div>

      {/* Description */}
      {frontmatter.description ? (
        <p className="relative mt-1 truncate pl-0 text-sm leading-relaxed text-muted-soft transition-colors duration-300 group-hover:text-muted sm:pl-[5.5rem]">
          {frontmatter.description}
        </p>
      ) : null}

      {/* Tags */}
      {frontmatter.tags?.length ? (
        <div className="relative mt-1 flex items-center gap-2 pl-0 sm:pl-[5.5rem]">
          <span className="flex gap-1.5 font-mono text-xs uppercase tracking-wider text-muted-soft transition-colors duration-300 group-hover:text-muted">
            {frontmatter.tags.slice(0, 3).map((tag) => (
              <span key={tag}>#{tag}</span>
            ))}
          </span>
          <ReadBadge slug={slug} />
        </div>
      ) : null}
    </Link>
  );
}
