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
      className={`group relative overflow-hidden border border-border bg-gradient-to-br from-card to-card/50 p-3 transition hover:border-accent/40 hover:shadow-[0_0_24px_var(--accent-glow)] sm:p-4 ${
        isPrev ? "flex flex-row" : "flex flex-row-reverse"
      }`}
      style={{ clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 0 100%)' }}
    >
      {/* Corner accent */}
      <div aria-hidden className={`pointer-events-none absolute top-0 h-px w-16 bg-gradient-to-${isPrev ? 'r' : 'l'} from-accent/50 to-transparent ${isPrev ? 'left-0' : 'right-0'}`} />
      <div aria-hidden className={`pointer-events-none absolute top-0 h-16 w-px bg-gradient-to-b from-accent/50 to-transparent ${isPrev ? 'left-0' : 'right-0'}`} />

      {post.cover ? (
        <Image
          src={post.cover}
          alt=""
          width={160}
          height={160}
          sizes="(min-width: 640px) 80px, 64px"
          loading="lazy"
          className="aspect-square h-16 w-16 shrink-0 border border-border object-cover opacity-[0.86] saturate-[0.85] transition group-hover:scale-105 group-hover:opacity-100 group-hover:saturate-100 sm:h-20 sm:w-20"
          style={{ clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 0 100%)' }}
        />
      ) : (
        <div
          aria-hidden
          className={`grid h-16 w-16 shrink-0 place-items-center border border-border bg-card text-accent-soft transition group-hover:border-accent/40 group-hover:text-accent sm:h-20 sm:w-20 ${
            isPrev
              ? "bg-[radial-gradient(circle_at_35%_50%,var(--accent-glow),transparent_48%)]"
              : "bg-[radial-gradient(circle_at_65%_50%,var(--accent-glow),transparent_48%)]"
          }`}
          style={{ clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 0 100%)' }}
        >
          {isPrev ? <ArrowLeft className="h-5 w-5" /> : <ArrowRight className="h-5 w-5" />}
        </div>
      )}
      <div
        className={`flex min-w-0 flex-1 flex-col gap-1.5 ${
          isPrev ? "items-start text-left" : "items-end text-right"
        }`}
      >
        <span className="inline-flex items-center gap-1 font-mono text-xs font-semibold uppercase tracking-widest text-accent-soft">
          {isPrev ? (
            <>
              <ArrowLeft className="h-3.5 w-3.5 transition group-hover:-translate-x-0.5" aria-hidden />
              Prev
            </>
          ) : (
            <>
              Next
              <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" aria-hidden />
            </>
          )}
        </span>
        <p className="line-clamp-2 text-sm font-semibold leading-snug tracking-tight text-foreground transition group-hover:text-accent sm:text-base">
          {post.title}
        </p>
        <span className="font-mono text-xs uppercase tracking-wider text-muted-soft">
          {post.readingMinutes}m Read
        </span>
      </div>
    </Link>
  );
}
