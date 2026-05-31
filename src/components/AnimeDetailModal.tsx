"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { BangumiAnime } from "@/lib/bangumi-types";

type SubjectDetail = {
  id: number;
  summary: string;
  tags: { name: string; count: number }[];
  rating: {
    rank: number;
    total: number;
    count: Record<string, number>;
    score: number;
  } | null;
  eps: number;
  totalEpisodes: number;
  platform: string | null;
  date: string | null;
  infobox: { key: string; value: string }[];
};

export function AnimeDetailModal({
  item,
  onClose,
}: {
  item: BangumiAnime;
  onClose: () => void;
}) {
  const [detail, setDetail] = useState<SubjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/bangumi/subject/${item.id}`)
      .then(async (r) => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.json();
      })
      .then((data: SubjectDetail) => {
        if (!cancelled) setDetail(data);
      })
      .catch((e) => {
        if (!cancelled) setError(String(e));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [item.id]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const title = item.nameCn || item.name;
  const subtitle = item.nameCn ? item.name : null;

  const maxRatingCount = detail?.rating
    ? Math.max(...Object.values(detail.rating.count))
    : 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="关闭"
          className="absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-background/80 text-muted backdrop-blur transition hover:bg-background hover:text-foreground touch-manipulation"
        >
          <svg
            aria-hidden
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <div className="grid gap-5 p-5 sm:grid-cols-[180px_1fr] sm:gap-6 sm:p-6">
          <div className="mx-auto w-[140px] shrink-0 sm:mx-0 sm:w-[180px]">
            <div className="aspect-[2/3] overflow-hidden rounded-xl border border-border bg-background">
              {item.cover ? (
                <Image
                  src={item.cover}
                  alt={title}
                  width={360}
                  height={540}
                  sizes="(min-width: 640px) 180px, 140px"
                  className="h-full w-full object-cover"
                />
              ) : null}
            </div>
            <div className="mt-3 flex flex-col gap-1.5 text-xs">
              {item.myRating > 0 ? (
                <p className="font-mono">
                  我的评分 <span className="text-primary">★ {item.myRating}</span>
                </p>
              ) : null}
              {item.epStatus > 0 || item.totalEps > 0 ? (
                <p className="font-mono text-muted">
                  进度 {item.epStatus} / {item.totalEps || "?"} 集
                </p>
              ) : null}
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer noopener"
                className="mt-2 inline-flex items-center justify-center gap-1 rounded-full border border-border bg-background px-3 py-1.5 text-xs transition hover:border-primary/40 hover:text-primary"
              >
                在 bgm.tv 查看
                <svg
                  aria-hidden
                  className="h-3 w-3"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M7 17L17 7M17 7H8M17 7v9" />
                </svg>
              </a>
            </div>
          </div>

          <div className="min-w-0">
            <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
            {subtitle ? (
              <p className="mt-1 text-sm text-muted">{subtitle}</p>
            ) : null}
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
              {item.date ? <span>📅 {item.date}</span> : null}
              {detail?.platform ? <span>· {detail.platform}</span> : null}
              {item.bgmScore ? (
                <span>
                  · bgm{" "}
                  <span className="text-foreground">
                    {item.bgmScore.toFixed(1)}
                  </span>
                  {detail?.rating
                    ? ` (${detail.rating.total} 人)`
                    : null}
                </span>
              ) : null}
              {detail?.rating?.rank ? (
                <span>· #{detail.rating.rank}</span>
              ) : null}
            </div>

            {error ? (
              <p className="mt-4 rounded-md border border-dashed border-border p-3 text-xs text-muted">
                详情加载失败 ({error})
              </p>
            ) : null}

            {detail?.rating && maxRatingCount > 0 ? (
              <div className="mt-4 rounded-lg border border-border bg-background/50 p-3">
                <p className="mb-2 text-xs uppercase tracking-wider text-muted">
                  评分分布
                </p>
                <div className="flex h-12 items-end gap-1">
                  {Array.from({ length: 10 }, (_, i) => {
                    const score = 10 - i;
                    const count = detail.rating!.count[String(score)] ?? 0;
                    const pct = (count / maxRatingCount) * 100;
                    return (
                      <div
                        key={score}
                        className="group/bar relative flex flex-1 flex-col items-center justify-end"
                        title={`${score} 分 · ${count} 人`}
                      >
                        <div
                          className="w-full rounded-t bg-primary/60 transition group-hover/bar:bg-primary"
                          style={{ height: `${pct}%`, minHeight: 2 }}
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="mt-1 flex justify-between text-xs text-muted">
                  <span>10</span>
                  <span>5</span>
                  <span>1</span>
                </div>
              </div>
            ) : null}

            {loading && !detail ? (
              <p className="mt-4 text-xs text-muted">载入详情中…</p>
            ) : detail?.summary ? (
              <div className="mt-4">
                <p className="mb-1.5 text-xs uppercase tracking-wider text-muted">
                  简介
                </p>
                <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/90">
                  {detail.summary}
                </p>
              </div>
            ) : null}

            {detail?.tags?.length ? (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {detail.tags.map((t) => (
                  <span
                    key={t.name}
                    className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2 py-0.5 text-[11px] text-muted"
                    title={`${t.count} 人标注`}
                  >
                    {t.name}
                    <span className="font-mono text-xs opacity-60">
                      {t.count}
                    </span>
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
