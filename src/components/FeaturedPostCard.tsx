"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpenText, Clock3, Pin, Radio } from "lucide-react";
import type { PostMeta } from "@/lib/posts";
import { ReadBadge } from "@/components/ReadBadge";
import { BorderGlow } from "@/components/BorderGlow";
import { useT } from "@/components/LocaleProvider";

export function FeaturedPostCard({ post }: { post: PostMeta }) {
  const t = useT();
  const { slug, frontmatter } = post;
  return (
    <BorderGlow
      colors={["#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4", "#3b82f6", "#6366f1", "#8b5cf6", "#d946ef", "#ec4899"]}
      glowColor="99 102 241"
      backgroundColor="rgba(12,18,36,0.9)"
      lightBackgroundColor="#fffcf5"
      borderRadius={16}
      edgeSensitivity={20}
      glowRadius={36}
      animated
    >
      {/* Accent stripe */}
      <div aria-hidden className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: "var(--rainbow)" }} />

      <Link
        href={`/posts/${slug}`}
        className="group relative flex flex-row gap-3 overflow-hidden p-3 sm:gap-5 sm:p-5"
      >
        {/* Cover image — side thumbnail on mobile */}
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-card sm:h-auto sm:w-44 sm:rounded-xl md:w-52">
          {frontmatter.cover ? (
            <Image
              src={frontmatter.cover}
              alt=""
              fill
              sizes="(min-width: 640px) 208px, 80px"
              loading="lazy"
              className="object-cover opacity-[0.85] saturate-[0.9] transition duration-500 group-hover:scale-105 group-hover:opacity-100 group-hover:saturate-100"
            />
          ) : (
            <div className="grid h-full place-items-center bg-[radial-gradient(circle_at_50%_50%,var(--accent-glow),transparent_48%)]">
              <Radio className="h-10 w-10 text-muted" aria-hidden />
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:gap-2.5">
          <div className="flex items-center gap-2 overflow-hidden">
            {frontmatter.pinned ? (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-border bg-card px-2 py-0.5 whitespace-nowrap" title={t.post.pinnedTooltip}>
                <Pin className="h-3 w-3 text-accent" aria-hidden />
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-muted">{t.post.pinned}</span>
              </span>
            ) : null}
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-border bg-card px-2 py-0.5 whitespace-nowrap">
              <BookOpenText className="h-3 w-3 text-accent/60" aria-hidden />
              <span className="font-mono text-xs uppercase tracking-wider text-muted">{t.post.featured}</span>
            </span>
            <ReadBadge slug={slug} />
          </div>

          <h3 className="text-lg font-bold leading-snug tracking-tight text-foreground transition group-hover:text-foreground sm:text-xl md:text-2xl">
            {frontmatter.title}
          </h3>

          {frontmatter.description ? (
            <p className="line-clamp-2 text-sm leading-relaxed text-muted-soft sm:text-base">
              {frontmatter.description}
            </p>
          ) : null}

          <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border pt-2.5 font-mono text-xs uppercase tracking-wider text-muted">
            <time className="inline-flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full bg-accent" />
              {frontmatter.date}
            </time>
            <span className="inline-flex items-center gap-1">
              <BookOpenText className="h-3 w-3" aria-hidden />
              {frontmatter.wordCount.toLocaleString()}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock3 className="h-3 w-3" aria-hidden />
              {frontmatter.readingMinutes}{t.post.readingTimeSuffix}
            </span>
            {frontmatter.tags?.length ? (
              <span className="flex flex-wrap gap-1.5">
                {frontmatter.tags.slice(0, 4).map((tag) => (
                  <span key={tag} className="text-muted">
                    #{tag}
                  </span>
                ))}
              </span>
            ) : null}
          </div>
        </div>

        <span className="absolute bottom-4 right-4 hidden place-items-center text-muted transition group-hover:text-accent sm:grid">
          <span className="grid h-9 w-9 place-items-center rounded-xl border border-border bg-card backdrop-blur-sm transition group-hover:border-accent group-hover:bg-card-hover">
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
          </span>
        </span>
      </Link>
    </BorderGlow>
  );
}
