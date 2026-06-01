import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { AdjacentPost } from "@/lib/posts";

export function PostNav({
  prev,
  next,
}: {
  prev: AdjacentPost | null;
  next: AdjacentPost | null;
}) {
  if (!prev && !next) return null;
  return (
    <nav
      aria-label="文章导航"
      className="mt-12 grid grid-cols-1 gap-3 sm:grid-cols-2"
    >
      {prev ? (
        <NavCard side="prev" post={prev} />
      ) : (
        <div className="hidden sm:block" aria-hidden />
      )}
      {next ? (
        <NavCard side="next" post={next} />
      ) : (
        <div className="hidden sm:block" aria-hidden />
      )}
    </nav>
  );
}

function NavCard({
  side,
  post,
}: {
  side: "prev" | "next";
  post: AdjacentPost;
}) {
  const isPrev = side === "prev";
  return (
    <Link
      href={`/posts/${post.slug}`}
      className={`group relative flex gap-3 overflow-hidden rounded-xl border border-border bg-gradient-to-br from-card to-card/50 p-4 transition hover:border-accent/40 hover:shadow-[0_0_24px_var(--accent-glow)] ${
        isPrev ? "" : "flex-row-reverse"
      }`}
    >
      {post.cover ? (
        <Image
          src={post.cover}
          alt=""
          width={80}
          height={80}
          sizes="80px"
          loading="lazy"
          className="h-16 w-16 shrink-0 rounded-lg border border-border object-cover opacity-[0.86] saturate-[0.85] transition group-hover:opacity-100 group-hover:saturate-100 sm:h-20 sm:w-20"
        />
      ) : (
        <div
          aria-hidden
          className="grid h-16 w-16 shrink-0 place-items-center rounded-lg border border-border bg-card text-accent-soft transition group-hover:border-accent/40 group-hover:text-accent sm:h-20 sm:w-20"
        >
          {isPrev ? <ArrowLeft className="h-5 w-5" /> : <ArrowRight className="h-5 w-5" />}
        </div>
      )}
      <div
        className={`flex min-w-0 flex-1 flex-col justify-center gap-1 ${
          isPrev ? "items-start text-left" : "items-end text-right"
        }`}
      >
        <span className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold uppercase tracking-widest text-accent-soft whitespace-nowrap">
          {isPrev ? (
            <>
              <ArrowLeft className="h-3 w-3 shrink-0 transition group-hover:-translate-x-0.5" aria-hidden />
              上一篇
            </>
          ) : (
            <>
              下一篇
              <ArrowRight className="h-3 w-3 shrink-0 transition group-hover:translate-x-0.5" aria-hidden />
            </>
          )}
        </span>
        <p className="line-clamp-2 text-sm font-semibold leading-snug tracking-tight text-foreground transition group-hover:text-accent">
          {post.title}
        </p>
      </div>
    </Link>
  );
}
