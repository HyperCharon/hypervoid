"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import type { BangumiItem, BangumiStatus } from "@/lib/bangumi-types";
import { STATUS_LABEL } from "@/lib/bangumi-types";
import { AnimeDetailModal } from "@/components/AnimeDetailModal";

type SortKey =
  | "updated"
  | "myRating"
  | "bgmScore"
  | "yearDesc"
  | "yearAsc";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "updated", label: "最近更新" },
  { key: "myRating", label: "我的评分" },
  { key: "bgmScore", label: "bgm 评分" },
  { key: "yearDesc", label: "年份新→旧" },
  { key: "yearAsc", label: "年份旧→新" },
];

const STATUS_ORDER: ("all" | BangumiStatus)[] = [
  "all",
  "watching",
  "done",
  "wish",
  "onhold",
  "dropped",
];

function sortItems(items: BangumiItem[], by: SortKey): BangumiItem[] {
  const arr = [...items];
  arr.sort((a, b) => {
    switch (by) {
      case "myRating":
        return (b.myRating || 0) - (a.myRating || 0);
      case "bgmScore":
        return (b.bgmScore || 0) - (a.bgmScore || 0);
      case "yearDesc":
        return (b.date || "").localeCompare(a.date || "");
      case "yearAsc":
        return (a.date || "").localeCompare(b.date || "");
      case "updated":
      default:
        return (b.updatedAt || "").localeCompare(a.updatedAt || "");
    }
  });
  return arr;
}

export function AnimeBrowser({
  items,
  statusLabels = STATUS_LABEL,
  searchPlaceholder = "🔍 按名称过滤（中文 / 原名）…",
}: {
  items: BangumiItem[];
  statusLabels?: Record<BangumiStatus, string>;
  searchPlaceholder?: string;
}) {
  const [status, setStatus] = useState<"all" | BangumiStatus>("all");
  const [sort, setSort] = useState<SortKey>("updated");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<BangumiItem | null>(null);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: items.length };
    for (const it of items) c[it.status] = (c[it.status] ?? 0) + 1;
    return c;
  }, [items]);

  const displayLabel = useMemo<Record<"all" | BangumiStatus, string>>(
    () => ({ all: "全部", ...statusLabels }),
    [statusLabels],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sortItems(
      items.filter((it) => {
        if (status !== "all" && it.status !== status) return false;
        if (!q) return true;
        return (
          it.name.toLowerCase().includes(q) ||
          (it.nameCn ?? "").toLowerCase().includes(q)
        );
      }),
      sort,
    );
  }, [items, status, sort, search]);

  function pickRandom() {
    if (filtered.length === 0) return;
    const idx = Math.floor(Math.random() * filtered.length);
    setSelected(filtered[idx]);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {STATUS_ORDER.map((s) => {
            const n = counts[s] ?? 0;
            if (s !== "all" && n === 0) return null;
            const active = status === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                aria-pressed={active}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  active
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-muted hover:border-primary/40 hover:text-foreground"
                }`}
              >
                {displayLabel[s]}
                <span
                  className={`rounded-full px-1.5 text-xs tabular-nums ${
                    active ? "bg-primary/20" : "bg-background"
                  }`}
                >
                  {n}
                </span>
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            aria-label="排序"
            className="rounded-md border border-border bg-card px-2 py-1.5 text-xs transition focus:border-primary focus:outline-none"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.key} value={o.key}>
                {o.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={pickRandom}
            disabled={filtered.length === 0}
            title="随机抽一部"
            className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1.5 text-xs transition hover:border-primary/40 hover:text-primary disabled:opacity-50"
          >
            <svg
              aria-hidden
              className="h-3.5 w-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="18" height="18" rx="3" />
              <circle cx="8.5" cy="8.5" r="1.2" fill="currentColor" />
              <circle cx="15.5" cy="15.5" r="1.2" fill="currentColor" />
              <circle cx="15.5" cy="8.5" r="1.2" fill="currentColor" />
              <circle cx="8.5" cy="15.5" r="1.2" fill="currentColor" />
              <circle cx="12" cy="12" r="1.2" fill="currentColor" />
            </svg>
            抽一部
          </button>
        </div>
      </div>

      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={searchPlaceholder}
        className="w-full rounded-md border border-border bg-card px-3 py-1.5 text-sm transition focus:border-primary focus:outline-none"
      />

      {filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted">
          没有匹配的条目。
        </p>
      ) : (
        <div className="grid gap-3 grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
          {filtered.map((item) => (
            <AnimeCard
              key={`${item.status}-${item.id}`}
              item={item}
              statusLabel={statusLabels[item.status]}
              onClick={() => setSelected(item)}
            />
          ))}
        </div>
      )}

      {selected ? (
        <AnimeDetailModal
          item={selected}
          onClose={() => setSelected(null)}
        />
      ) : null}
    </div>
  );
}

function AnimeCard({
  item,
  statusLabel,
  onClick,
}: {
  item: BangumiItem;
  statusLabel: string;
  onClick: () => void;
}) {
  const title = item.nameCn || item.name;
  const year = item.date?.slice(0, 4);
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex flex-col gap-2 overflow-hidden rounded-xl border border-border bg-card text-left transition hover:border-primary/40 hover:shadow-md"
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-background">
        {item.cover ? (
          <Image
            src={item.cover}
            alt=""
            width={300}
            height={450}
            sizes="(min-width: 1024px) 200px, (min-width: 640px) 25vw, 50vw"
            loading="lazy"
            className="h-full w-full object-cover transition group-hover:scale-[1.03]"
          />
        ) : (
          <div className="grid h-full place-items-center text-xs text-muted">
            无封面
          </div>
        )}
        {item.myRating > 0 ? (
          <span className="dark-locked absolute right-1.5 top-1.5 inline-flex items-center gap-0.5 rounded-md bg-black px-1.5 py-0.5 text-[10px] font-mono font-bold text-white shadow-sm">
            ★ {item.myRating}
          </span>
        ) : null}
        <span className="dark-locked absolute left-1.5 top-1.5 inline-flex items-center gap-0.5 rounded-md bg-black px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
          {statusLabel}
        </span>
      </div>
      <div className="flex flex-col px-2 pb-2">
        <p
          className="line-clamp-2 text-xs font-medium leading-snug transition group-hover:text-primary"
          title={item.name}
        >
          {title}
        </p>
        <p className="mt-1 flex items-center justify-between gap-1 text-xs text-muted">
          {year ? <span className="font-mono">{year}</span> : <span />}
          {item.bgmScore ? (
            <span className="font-mono">bgm {item.bgmScore.toFixed(1)}</span>
          ) : null}
        </p>
      </div>
    </button>
  );
}
