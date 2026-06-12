import Link from "next/link";
import { getAllPosts } from "@/lib/posts";

export const revalidate = 300;

const HINTS = [
  "宇宙在膨胀，这条路径已经远去了",
  "你走到了无人涉足过的坐标",
  "时空在此折叠，回到入口处看看",
  "黑洞吞噬了这个 URL，但故事还在继续",
  "迷失也是一种到达——只是不是你想的那个地方",
];

function pickRandom<T>(arr: T[]): T | null {
  if (arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

export default async function NotFound() {
  const all = await getAllPosts();
  const recommendation = pickRandom(all);
  // Deterministic hint index from current hour so it changes occasionally
  // but is stable within a given render.
  const hintIdx = new Date().getHours() % HINTS.length;
  const hint = HINTS[hintIdx];

  return (
    <div className="relative flex min-h-[60vh] flex-col items-center justify-center gap-8 overflow-hidden py-12 text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-50"
      >
        <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute right-1/4 top-1/3 h-40 w-40 rounded-full bg-primary/15 blur-2xl" />
        <div className="absolute bottom-1/4 left-1/3 h-32 w-32 rounded-full bg-primary/10 blur-2xl" />
      </div>

      <div className="relative">
        <svg
          aria-hidden
          viewBox="0 0 120 120"
          className="h-32 w-32 text-primary"
        >
          <rect width="120" height="120" rx="22" fill="#0b0f1a" />
          <ellipse
            cx="60"
            cy="60"
            rx="42"
            ry="14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            opacity="0.9"
          />
          <ellipse
            cx="60"
            cy="60"
            rx="42"
            ry="14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            opacity="0.55"
            transform="rotate(60 60 60)"
          />
          <ellipse
            cx="60"
            cy="60"
            rx="42"
            ry="14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            opacity="0.3"
            transform="rotate(-60 60 60)"
          />
          <circle cx="60" cy="60" r="6" fill="#fff" />
        </svg>
      </div>

      <div className="flex flex-col items-center gap-3">
        <p className="font-mono text-sm uppercase tracking-[0.3em] text-primary">
          404 · Lost in the Void
        </p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
          这里是创世之初的虚空
        </h1>
        <p className="max-w-xl text-base text-muted sm:text-lg">{hint}</p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <svg
            aria-hidden
            className="h-3.5 w-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 12L12 3l9 9" />
            <path d="M5 10v10h14V10" />
          </svg>
          返回首页
        </Link>
        {recommendation ? (
          <Link
            href={`/posts/${recommendation.slug}`}
            className="group inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground/80 transition hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
            title={recommendation.frontmatter.title}
          >
            ✦ 随便看一篇
            <svg
              aria-hidden
              className="h-3.5 w-3.5 transition group-hover:translate-x-0.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14" />
              <path d="M13 5l7 7-7 7" />
            </svg>
          </Link>
        ) : (
          <Link
            href="/posts"
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground/80 transition hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
          >
            所有文章
          </Link>
        )}
      </div>

      <p className="mt-4 font-mono text-xs text-muted">
        — One &amp; Only —
      </p>
    </div>
  );
}
