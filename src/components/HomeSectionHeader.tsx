"use client";

import Link from "next/link";
import { useT } from "@/components/LocaleProvider";

export function LatestPostsHeader() {
  const t = useT();
  return (
    <div className="mb-5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-xl border border-accent/25 bg-card text-accent-soft">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9" />
            <path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z" />
          </svg>
        </div>
        <h2 className="bg-gradient-to-r from-accent-soft via-accent-soft to-accent-soft bg-clip-text font-mono text-xl font-bold uppercase tracking-tight text-transparent sm:text-2xl">
          {t.home.latest}
        </h2>
      </div>
      <Link
        href="/posts"
        className="group inline-flex items-center gap-1.5 rounded-full border border-accent/20 bg-card px-4 py-1.5 font-mono text-xs font-medium uppercase tracking-wider text-accent-soft transition hover:border-accent/40 hover:bg-card-hover hover:text-accent-soft"
      >
        {t.home.seeAll}
        <svg aria-hidden className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M13 5l7 7-7 7" />
        </svg>
      </Link>
    </div>
  );
}

export function EmptyPosts() {
  const t = useT();
  return (
    <p className="rounded-2xl border border-dashed border-accent/20 p-6 text-center font-mono text-sm text-muted sm:p-8 lg:p-10">
      {t.home.empty}
    </p>
  );
}

export function RssHint() {
  const t = useT();
  return (
    <p className="text-sm text-muted">{t.home.rssHint}</p>
  );
}
