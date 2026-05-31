"use client";

import Link from "next/link";
import { ArrowRight, Clock3, Trash2 } from "lucide-react";
import { useReadLater } from "@/lib/use-read-later";

function formatRelative(ts: number): string {
  const diff = Date.now() - ts;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff < hour) return String(Math.floor(diff / minute) || 1) + " 分钟前";
  if (diff < day) return String(Math.floor(diff / hour)) + " 小时前";
  if (diff < 7 * day) return String(Math.floor(diff / day)) + " 天前";
  return new Date(ts).toLocaleDateString("zh-CN");
}

export function ReadLaterList() {
  const { items, remove, clear, ready } = useReadLater();

  if (!ready) {
    return (
      <p className="hv-panel border-dashed p-8 text-center text-muted">
        加载中…
      </p>
    );
  }

  if (items.length === 0) {
    return (
      <div className="hv-panel border-dashed p-8 text-center text-muted">
        <Clock3 className="mx-auto h-8 w-8 text-muted" aria-hidden />
        <p className="mt-3">
          稍后读队列是空的。文章页点时钟图标，把感兴趣的文章塞进来。
        </p>
        <Link href="/posts" className="hv-action mt-4 px-4 text-sm">
          浏览文章
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-soft">
          共 <span className="font-mono text-foreground">{items.length}</span> 篇
        </p>
        <button
          type="button"
          onClick={() => {
            if (confirm("清空整个稍后读队列？")) clear();
          }}
          className="hv-action min-h-8 px-3 text-xs"
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden />
          清空
        </button>
      </div>
      <ul className="flex flex-col gap-2">
        {items.map((it) => (
          <li
            key={it.slug}
            className="hv-panel hv-panel-hover group flex items-start gap-3 p-3"
          >
            <div className="min-w-0 flex-1">
              <Link
                href={"/posts/" + it.slug}
                className="line-clamp-1 text-sm font-medium text-foreground hover:text-accent"
              >
                {it.title}
              </Link>
              {it.description ? (
                <p className="mt-0.5 line-clamp-2 text-xs text-muted-soft">
                  {it.description}
                </p>
              ) : null}
              <p className="mt-1 font-mono text-xs uppercase text-muted-soft">
                加入于 {formatRelative(it.addedAt)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => remove(it.slug)}
              aria-label="移除"
              className="shrink-0 border border-border bg-card px-2 py-1 text-xs text-muted-soft opacity-100 transition hover:border-red-400/45 hover:text-red-300 sm:opacity-0 sm:group-hover:opacity-100"
            >
              移除
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
