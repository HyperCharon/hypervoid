import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpenText, Clock3, Pin, Radio } from "lucide-react";
import type { PostMeta } from "@/lib/posts";
import { ReadBadge } from "@/components/ReadBadge";
import { BorderGlow } from "@/components/BorderGlow";

export function PostCard({ post }: { post: PostMeta }) {
  const { slug, frontmatter } = post;
  return (
    <BorderGlow
      colors={["#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4", "#3b82f6", "#6366f1", "#8b5cf6", "#d946ef", "#ec4899"]}
      glowColor="99 102 241"
      backgroundColor="rgba(12,18,36,0.9)"
      lightBackgroundColor="#fffcf5"
      borderRadius={16}
      edgeSensitivity={20}
      glowRadius={30}
    >
      <Link
        href={`/posts/${slug}`}
        className="group relative flex flex-col gap-3 overflow-hidden p-3 sm:flex-row sm:items-stretch sm:gap-3 sm:p-3.5"
      >
        <div className="relative h-32 w-full shrink-0 overflow-hidden rounded-xl bg-card sm:h-auto sm:w-32">
          {frontmatter.cover ? (
            <Image
              src={frontmatter.cover}
              alt=""
              fill
              sizes="(min-width: 640px) 128px, 100vw"
              loading="lazy"
              className="object-cover opacity-[0.82] saturate-[0.85] transition duration-300 group-hover:scale-105 group-hover:opacity-100 group-hover:saturate-100"
            />
          ) : (
            <div className="grid h-full min-h-24 place-items-center bg-[radial-gradient(circle_at_50%_50%,var(--accent-glow),transparent_48%)]">
              <Radio className="h-8 w-8 text-accent/60" aria-hidden />
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent,var(--overlay-dark))]" />
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {frontmatter.pinned ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2 py-0.5" title="置顶">
                <Pin className="h-3 w-3 text-accent" aria-hidden />
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-muted">Pinned</span>
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2 py-0.5">
              <BookOpenText className="h-3 w-3 text-accent/60" aria-hidden />
              <span className="font-mono text-xs uppercase tracking-wider text-muted">Article</span>
            </span>
            <ReadBadge slug={slug} />
          </div>

          <h3 className="line-clamp-2 text-base font-semibold leading-snug tracking-tight text-foreground transition group-hover:text-foreground sm:text-lg">
            {frontmatter.title}
          </h3>

          {frontmatter.description ? (
            <p className="line-clamp-2 text-sm leading-snug text-muted-soft">
              {frontmatter.description}
            </p>
          ) : null}

          <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border pt-2 font-mono text-xs uppercase tracking-wider text-muted">
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
              {frontmatter.readingMinutes}m
            </span>
            {frontmatter.tags?.length ? (
              <span className="flex flex-wrap gap-1.5">
                {frontmatter.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="text-muted">
                    #{tag}
                  </span>
                ))}
              </span>
            ) : null}
          </div>
        </div>

        <span className="absolute bottom-3 right-3 hidden place-items-center text-muted transition group-hover:text-accent sm:grid">
          <span className="grid h-8 w-8 place-items-center rounded-xl border border-border bg-card backdrop-blur-sm transition group-hover:border-accent group-hover:bg-card-hover">
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
          </span>
        </span>
      </Link>
    </BorderGlow>
  );
}
