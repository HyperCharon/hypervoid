"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import type { SteamGame } from "@/lib/steam-types";
import { formatHours } from "@/lib/steam-types";

type SortKey = "recent" | "total" | "name" | "appId";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "recent", label: "最近游玩" },
  { key: "total", label: "总时长" },
  { key: "name", label: "名称" },
  { key: "appId", label: "appid" },
];

function sortGames(games: SteamGame[], by: SortKey): SteamGame[] {
  const arr = [...games];
  arr.sort((a, b) => {
    switch (by) {
      case "total":
        return b.playtimeForeverMin - a.playtimeForeverMin;
      case "name":
        return a.name.localeCompare(b.name);
      case "appId":
        return a.appId - b.appId;
      case "recent":
      default: {
        const ra = a.playtimeRecentMin;
        const rb = b.playtimeRecentMin;
        if (ra !== rb) return rb - ra;
        return b.playtimeForeverMin - a.playtimeForeverMin;
      }
    }
  });
  return arr;
}

export function GamesBrowser({ games }: { games: SteamGame[] }) {
  const [sort, setSort] = useState<SortKey>("recent");
  const [search, setSearch] = useState("");
  const [showOnlyPlayed, setShowOnlyPlayed] = useState(false);
  const [imgError, setImgError] = useState<Set<number>>(new Set());

  const recent = useMemo(
    () => games.filter((g) => g.playtimeRecentMin > 0),
    [games],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sortGames(
      games.filter((g) => {
        if (showOnlyPlayed && g.playtimeForeverMin === 0) return false;
        if (!q) return true;
        return g.name.toLowerCase().includes(q);
      }),
      sort,
    );
  }, [games, sort, search, showOnlyPlayed]);

  function markImgError(appId: number) {
    setImgError((prev) => {
      const next = new Set(prev);
      next.add(appId);
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-5">
      {recent.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-base font-semibold tracking-tight">
            🎮 最近 2 周
            <span className="ml-2 text-sm font-normal text-muted">
              {recent.length}
            </span>
          </h2>
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
            {recent.slice(0, 8).map((g) => (
              <RecentCard
                key={g.appId}
                game={g}
                imgFailed={imgError.has(g.appId)}
                onImgError={() => markImgError(g.appId)}
              />
            ))}
          </div>
        </section>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-base font-semibold tracking-tight">
          全部 ({games.length})
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <label className="inline-flex items-center gap-1.5 text-xs text-muted">
            <input
              type="checkbox"
              checked={showOnlyPlayed}
              onChange={(e) => setShowOnlyPlayed(e.target.checked)}
              className="accent-primary"
            />
            只看玩过的
          </label>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            aria-label="排序"
            className="rounded-md border border-border bg-card px-2 py-1 text-xs transition focus:border-primary focus:outline-none"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.key} value={o.key}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="🔍 按名称搜索…"
        className="w-full rounded-md border border-border bg-card px-3 py-1.5 text-sm transition focus:border-primary focus:outline-none"
      />

      {filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted">
          没有匹配的游戏。
        </p>
      ) : (
        <div className="grid gap-3 grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
          {filtered.map((g) => (
            <GameCard
              key={g.appId}
              game={g}
              imgFailed={imgError.has(g.appId)}
              onImgError={() => markImgError(g.appId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function GameCard({
  game,
  imgFailed,
  onImgError,
}: {
  game: SteamGame;
  imgFailed: boolean;
  onImgError: () => void;
}) {
  return (
    <a
      href={`https://store.steampowered.com/app/${game.appId}`}
      target="_blank"
      rel="noreferrer noopener"
      className="group flex flex-col gap-2 overflow-hidden rounded-xl border border-border bg-card transition hover:border-primary/40 hover:shadow-md"
      title={game.name}
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-background">
        {!imgFailed ? (
          <Image
            src={game.cover}
            alt=""
            width={300}
            height={450}
            sizes="(min-width: 1024px) 200px, (min-width: 640px) 25vw, 50vw"
            loading="lazy"
            onError={onImgError}
            className="h-full w-full object-cover transition group-hover:scale-[1.03]"
          />
        ) : (
          <div className="grid h-full place-items-center px-2 text-center text-xs text-muted">
            {game.name}
          </div>
        )}
        {game.playtimeForeverMin > 0 ? (
          <span className="dark-locked absolute right-1.5 top-1.5 inline-flex items-center gap-0.5 rounded-md bg-black px-1.5 py-0.5 text-[10px] font-mono font-bold text-white shadow-sm">
            {formatHours(game.playtimeForeverMin)}
          </span>
        ) : null}
      </div>
      <div className="flex flex-col px-2 pb-2">
        <p className="line-clamp-2 text-xs font-medium leading-snug transition group-hover:text-primary">
          {game.name}
        </p>
        {game.playtimeRecentMin > 0 ? (
          <p className="mt-0.5 font-mono text-xs text-primary">
            ↻ {formatHours(game.playtimeRecentMin)} (最近 2 周)
          </p>
        ) : null}
      </div>
    </a>
  );
}

function RecentCard({
  game,
  imgFailed,
  onImgError,
}: {
  game: SteamGame;
  imgFailed: boolean;
  onImgError: () => void;
}) {
  return (
    <a
      href={`https://store.steampowered.com/app/${game.appId}`}
      target="_blank"
      rel="noreferrer noopener"
      className="group flex flex-col gap-2 overflow-hidden rounded-xl border border-primary/30 bg-primary/5 transition hover:border-primary/60 hover:shadow-md"
      title={game.name}
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-background">
        {!imgFailed ? (
          <Image
            src={game.cover}
            alt=""
            width={300}
            height={450}
            sizes="(min-width: 1024px) 200px, (min-width: 640px) 25vw, 50vw"
            loading="lazy"
            onError={onImgError}
            className="h-full w-full object-cover transition group-hover:scale-[1.03]"
          />
        ) : (
          <div className="grid h-full place-items-center px-2 text-center text-xs text-muted">
            {game.name}
          </div>
        )}
      </div>
      <div className="flex flex-col px-2.5 pb-2.5">
        <p className="line-clamp-2 text-sm font-medium leading-snug transition group-hover:text-primary">
          {game.name}
        </p>
        <p className="mt-1 flex items-center justify-between gap-1 text-xs text-muted">
          <span className="font-mono text-primary">
            ↻ {formatHours(game.playtimeRecentMin)}
          </span>
          <span className="font-mono">
            总 {formatHours(game.playtimeForeverMin)}
          </span>
        </p>
      </div>
    </a>
  );
}
