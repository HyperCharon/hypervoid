"use client";

import Link from "next/link";
import { ArrowRight, Bookmark, Trash2 } from "lucide-react";
import { useBookmarks } from "@/lib/use-bookmarks";
import { formatDateCN } from "@/lib/datetime-client";
import { useT } from "@/components/LocaleProvider";

export function BookmarksList() {
  const t = useT();
  const { items, remove, ready } = useBookmarks();

  if (!ready) {
    return (
      <p className="hv-panel border-dashed p-8 text-center text-sm text-muted">
        {t.common.loading}
      </p>
    );
  }

  if (items.length === 0) {
    return (
      <div className="hv-panel border-dashed p-8 text-center text-sm text-muted">
        <Bookmark className="mx-auto h-8 w-8 text-muted" aria-hidden />
        <p className="mt-3">{t.bookmark.empty}</p>
        <p className="mt-2">
          {t.bookmark.emptyDesc}
        </p>
        <div className="mt-4">
          <Link href="/posts" className="hv-action px-4 text-sm">
            {t.bookmark.goToPosts}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    );
  }

  const sorted = [...items].sort((a, b) => b.addedAt - a.addedAt);

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-soft">{t.bookmark.total.replace("{count}", String(items.length))}</p>
      <ul className="flex flex-col gap-2">
        {sorted.map((b) => (
          <li
            key={b.slug}
            className="hv-panel hv-panel-hover group flex items-start gap-3 p-4"
          >
            <Link href={"/posts/" + b.slug} className="min-w-0 flex-1">
              <p className="font-medium tracking-tight text-foreground transition group-hover:text-accent">
                {b.title}
              </p>
              {b.description ? (
                <p className="mt-0.5 line-clamp-2 text-xs text-muted-soft">
                  {b.description}
                </p>
              ) : null}
              <p className="mt-1.5 font-mono text-xs uppercase text-muted-soft">
                {t.bookmark.savedAt} {formatDateCN(new Date(b.addedAt))}
              </p>
            </Link>
            <button
              type="button"
              onClick={() => remove(b.slug)}
              aria-label={t.bookmark.remove}
              className="shrink-0 border border-border bg-card p-1.5 text-muted-soft opacity-100 transition hover:border-red-400/45 hover:text-red-300 sm:opacity-0 sm:group-hover:opacity-100"
              title={t.bookmark.remove}
            >
              <Trash2 className="h-4 w-4" aria-hidden />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
