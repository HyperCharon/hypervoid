import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ALBUMS_ON_REPEAT,
  GENRES,
  PLAYLISTS,
  type MusicPlaylist,
} from "@/lib/music";
import { HvPlayer } from "@/components/HvPlayer";
import {
  getConfiguredMusicTracks,
  getMusicSourceConfig,
  MUSIC_SOURCE_LABEL,
} from "@/lib/music-sources";
import type { MusicTrack } from "@/lib/music-types";

export const metadata: Metadata = {
  title: "音乐",
  description: "近期循环的专辑、公开歌单与偏爱的曲风。",
};

const PLATFORM_LABEL: Record<MusicPlaylist["platform"], string> = {
  netease: "网易云",
  spotify: "Spotify",
  apple: "Apple Music",
  youtube: "YouTube Music",
  bandcamp: "Bandcamp",
  other: "外链",
};

const PLATFORM_COLOR: Record<MusicPlaylist["platform"], string> = {
  netease: "text-red-500",
  spotify: "text-emerald-500",
  apple: "text-accent",
  youtube: "text-red-600",
  bandcamp: "text-accent",
  other: "text-accent",
};

export default async function MusicPage() {
  let initialTracks: MusicTrack[] = [];
  const config = await getMusicSourceConfig();
  try {
    initialTracks = await getConfiguredMusicTracks();
  } catch {
    // Client component retries through the API route and surfaces the error.
  }

  return (
    <div className="flex flex-col gap-10">
      <header className="hv-panel relative overflow-hidden p-5 sm:p-7">
        <p className="hv-kicker">Music / Loop_Station</p>
        <h1 className="hv-title mt-2 text-3xl font-black uppercase tracking-tight sm:text-4xl">
          在循环里
        </h1>
        <p className="mt-2 text-sm text-muted">
          这里收集最近反复听的专辑、愿意分享的播放列表，以及偏爱的曲风。
          音乐是另一种穿过虚空的方式。
        </p>
      </header>

      <HvPlayer
        initialTracks={initialTracks}
        sourceLabel={MUSIC_SOURCE_LABEL[config.mode]}
      />

      <section>
        <div className="mb-4 flex items-baseline justify-between gap-3">
          <h2 className="text-xl font-bold tracking-tight">最近循环</h2>
          <span className="text-xs text-muted">
            {ALBUMS_ON_REPEAT.length} 张
          </span>
        </div>
        {ALBUMS_ON_REPEAT.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted">
            还没有正在循环的专辑。在{" "}
            <code className="rounded bg-card px-1.5 py-0.5 text-xs">
              src/lib/music.ts
            </code>{" "}
            的 <code className="rounded bg-card px-1.5 py-0.5 text-xs">ALBUMS_ON_REPEAT</code>{" "}
            数组里加几张吧。
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ALBUMS_ON_REPEAT.map((album) => {
              const card = (
                <div className="group flex h-full flex-col gap-3 overflow-hidden rounded-2xl border border-border bg-card p-4 transition hover:border-primary/40 hover:shadow-md">
                  <div className="flex gap-4">
                    {album.cover ? (
                      <Image
                        src={album.cover}
                        alt={album.title}
                        width={160}
                        height={160}
                        sizes="80px"
                        loading="lazy"
                        unoptimized
                        className="h-20 w-20 shrink-0 rounded-lg object-cover shadow-sm"
                      />
                    ) : (
                      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary/15 to-primary/5 text-3xl">
                        ♪
                      </div>
                    )}
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <h3 className="line-clamp-2 text-base font-semibold leading-snug tracking-tight transition group-hover:text-primary">
                        {album.title}
                      </h3>
                      <p className="text-sm text-muted">{album.artist}</p>
                      {album.year ? (
                        <p className="font-mono text-xs text-muted/80">
                          {album.year}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  {album.note ? (
                    <p className="text-sm leading-relaxed text-muted">
                      {album.note}
                    </p>
                  ) : null}
                </div>
              );
              return album.link ? (
                <a
                  key={album.id}
                  href={album.link}
                  target="_blank"
                  rel="noreferrer"
                  className="block"
                >
                  {card}
                </a>
              ) : (
                <div key={album.id}>{card}</div>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <div className="mb-4 flex items-baseline justify-between gap-3">
          <h2 className="text-xl font-bold tracking-tight">公开歌单</h2>
          <span className="text-xs text-muted">{PLAYLISTS.length} 个</span>
        </div>
        {PLAYLISTS.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted">
            还没有公开歌单。可以在{" "}
            <code className="rounded bg-card px-1.5 py-0.5 text-xs">
              src/lib/music.ts
            </code>{" "}
            的 <code className="rounded bg-card px-1.5 py-0.5 text-xs">PLAYLISTS</code>{" "}
            数组里加。
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {PLAYLISTS.map((p) => (
              <li key={p.id}>
                <a
                  href={p.link}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex h-full flex-col gap-1.5 rounded-2xl border border-border bg-card p-4 transition hover:border-primary/40"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-base font-medium transition group-hover:text-primary">
                      {p.title}
                    </span>
                    <span
                      className={"shrink-0 font-mono text-[11px] " + PLATFORM_COLOR[p.platform]}
                    >
                      {PLATFORM_LABEL[p.platform]}
                    </span>
                  </div>
                  {p.description ? (
                    <p className="text-sm leading-relaxed text-muted">
                      {p.description}
                    </p>
                  ) : null}
                  {p.trackCount ? (
                    <p className="mt-auto pt-1 font-mono text-[11px] text-muted/80">
                      {p.trackCount} 首
                    </p>
                  ) : null}
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-xl font-bold tracking-tight">偏爱曲风</h2>
        <div className="flex flex-wrap gap-2">
          {GENRES.map((g) => (
            <span
              key={g}
              className="rounded-full border border-border bg-card px-3 py-1 text-sm text-foreground/85 transition hover:border-primary/40 hover:text-primary"
            >
              {g}
            </span>
          ))}
        </div>
      </section>

      <p className="rounded-xl border border-dashed border-border p-4 text-xs text-muted">
        播放器已升级为 APlayer。音源由后台「音乐设置」统一切换，支持已部署音源、LX API 和本地 JSON 歌单。
        也可在留言板 [
        <Link href="/guestbook" className="text-primary hover:underline">
          点这
        </Link>
        ] 给我推荐音乐。
      </p>
    </div>
  );
}
