import { redirect } from "next/navigation";
import Image from "next/image";
import type { Metadata } from "next";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { AdminBackLink } from "@/components/admin/AdminBackLink";
import { getSiteOverride, setSiteOverrides } from "@/lib/site-config-server";
import {
  getPlaylistMeta,
  ncmCookieConfigured,
  type NcmPlaylistMeta,
} from "@/lib/ncm";
import {
  getConfiguredMusicTracks,
  getMusicSourceConfig,
  MUSIC_SOURCE_LABEL,
  parseLocalMusicTracks,
  type MusicSourceMode,
} from "@/lib/music-sources";

export const metadata: Metadata = {
  title: "音乐设置",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type SavedPlaylist = NcmPlaylistMeta & { addedAt: number };

function parseSaved(raw: string): SavedPlaylist[] {
  if (!raw.trim()) return [];
  try {
    const v = JSON.parse(raw);
    if (!Array.isArray(v)) return [];
    return v.filter((x): x is SavedPlaylist =>
      typeof x?.id === "string" && typeof x?.name === "string",
    );
  } catch {
    return [];
  }
}

function extractPlaylistId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (/^\d+$/.test(trimmed)) return trimmed;
  const m = trimmed.match(/[?&]id=(\d+)/);
  if (m) return m[1];
  return null;
}

function normalizeMode(value: string): MusicSourceMode {
  return value === "lx" || value === "local" ? value : "deployed";
}

async function ensureAdmin() {
  const s = await auth();
  if (!s?.user) redirect("/sign-in");
}

function revalidateMusic() {
  revalidatePath("/admin/music");
  revalidatePath("/music");
  revalidatePath("/");
}

async function saveSourceAction(formData: FormData) {
  "use server";
  await ensureAdmin();
  const mode = normalizeMode(String(formData.get("sourceMode") ?? "deployed"));
  const lxApiUrl = String(formData.get("lxApiUrl") ?? "").trim();
  const localTracks = String(formData.get("localTracks") ?? "").trim();

  if (mode === "lx" && !lxApiUrl) {
    redirect("/admin/music?err=lx");
  }
  if (mode === "local") {
    try {
      parseLocalMusicTracks(localTracks || "[]");
    } catch {
      redirect("/admin/music?err=local");
    }
  }

  await setSiteOverrides([
    { key: "music.sourceMode", value: mode },
    { key: "music.lxApiUrl", value: lxApiUrl },
    { key: "music.localTracks", value: localTracks || "[]" },
  ]);
  revalidateMusic();
}

async function addPlaylistAction(formData: FormData) {
  "use server";
  await ensureAdmin();
  const input = String(formData.get("input") ?? "");
  const id = extractPlaylistId(input);
  if (!id) redirect("/admin/music?err=invalid");

  const savedRaw = await getSiteOverride("music.savedPlaylists");
  const saved = parseSaved(savedRaw);
  if (saved.some((p) => p.id === id)) redirect("/admin/music?err=duplicate");

  let meta: NcmPlaylistMeta;
  try {
    meta = await getPlaylistMeta(id);
  } catch {
    redirect("/admin/music?err=fetch");
  }

  const next: SavedPlaylist[] = [...saved, { ...meta, addedAt: Date.now() }];
  await setSiteOverrides([
    { key: "music.savedPlaylists", value: JSON.stringify(next) },
  ]);

  const currentActive = await getSiteOverride("music.playlistId");
  if (!currentActive.trim() && next.length === 1) {
    await setSiteOverrides([{ key: "music.playlistId", value: id }]);
  }
  revalidateMusic();
}

async function setActiveAction(formData: FormData) {
  "use server";
  await ensureAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await setSiteOverrides([
    { key: "music.playlistId", value: id },
    { key: "music.sourceMode", value: "deployed" },
  ]);
  revalidateMusic();
}

async function removePlaylistAction(formData: FormData) {
  "use server";
  await ensureAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const savedRaw = await getSiteOverride("music.savedPlaylists");
  const saved = parseSaved(savedRaw);
  const next = saved.filter((p) => p.id !== id);
  await setSiteOverrides([
    { key: "music.savedPlaylists", value: JSON.stringify(next) },
  ]);
  const activeId = await getSiteOverride("music.playlistId");
  if (activeId === id) {
    await setSiteOverrides([{ key: "music.playlistId", value: next[0]?.id ?? "" }]);
  }
  revalidateMusic();
}

async function refreshPlaylistAction(formData: FormData) {
  "use server";
  await ensureAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  let meta: NcmPlaylistMeta;
  try {
    meta = await getPlaylistMeta(id);
  } catch {
    redirect("/admin/music?err=fetch");
  }
  const savedRaw = await getSiteOverride("music.savedPlaylists");
  const saved = parseSaved(savedRaw);
  const next = saved.map((p) =>
    p.id === id ? { ...p, ...meta, addedAt: p.addedAt } : p,
  );
  await setSiteOverrides([
    { key: "music.savedPlaylists", value: JSON.stringify(next) },
  ]);
  revalidateMusic();
}

const ERROR_MESSAGES: Record<string, string> = {
  invalid: "无法从输入里识别出歌单 ID。请贴网易云歌单链接（含 id=...）或纯数字 ID。",
  duplicate: "这个歌单已经在列表里了。",
  fetch: "拉取歌单信息失败。检查 ID 是否正确，或网络是否能访问 music.163.com。",
  lx: "LX 模式需要填写可返回 JSON 曲目列表的 API URL。",
  local: "本地音源 JSON 无法解析。请使用数组，至少包含 title/name 与 url 字段。",
};

const LOCAL_EXAMPLE = JSON.stringify(
  [
    {
      title: "Song title",
      artist: "Artist",
      url: "/music/song.mp3",
      cover: "/music/cover.jpg",
      duration: 210000,
    },
  ],
  null,
  2,
);

export default async function AdminMusicPage({
  searchParams,
}: {
  searchParams: Promise<{ err?: string; test?: string }>;
}) {
  await ensureAdmin();
  const { err, test } = await searchParams;
  const [savedRaw, activeId, sourceConfig] = await Promise.all([
    getSiteOverride("music.savedPlaylists"),
    getSiteOverride("music.playlistId"),
    getMusicSourceConfig(),
  ]);
  const saved = parseSaved(savedRaw).sort((a, b) => b.addedAt - a.addedAt);
  const cookieSet = ncmCookieConfigured();

  let testResult: { ok: boolean; source?: string; tracks?: number; playable?: number; error?: string } | null = null;
  if (test === "connect") {
    try {
      const tracks = await getConfiguredMusicTracks();
      testResult = {
        ok: tracks.length > 0,
        source: MUSIC_SOURCE_LABEL[sourceConfig.mode],
        tracks: tracks.length,
        playable: tracks.filter((track) => Boolean(track.url)).length,
        error: tracks.length > 0 ? undefined : "当前音源没有返回曲目",
      };
    } catch (e) {
      testResult = { ok: false, source: MUSIC_SOURCE_LABEL[sourceConfig.mode], error: e instanceof Error ? e.message : "unknown" };
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="flex items-center gap-3">
        <AdminBackLink href="/admin" label="后台" />
        <h1 className="text-2xl font-bold tracking-tight">音乐设置</h1>
      </header>

      {err && ERROR_MESSAGES[err] ? (
        <p className="rounded-md border border-accent/30 bg-accent/5 px-3 py-2 text-xs text-amber-700 dark:text-accent">
          {ERROR_MESSAGES[err]}
        </p>
      ) : null}

      <section className="hv-panel p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold tracking-tight">音源模式</h2>
            <p className="mt-1 text-xs text-muted">
              前台 APlayer 和首页小组件都会读取这里选择的统一音源。
            </p>
          </div>
          <span className=" border border-border bg-black/20 px-3 py-1 text-xs text-muted">
            当前：{MUSIC_SOURCE_LABEL[sourceConfig.mode]}
          </span>
        </div>

        <form action={saveSourceAction} className="mt-4 flex flex-col gap-4">
          <div className="grid gap-3 md:grid-cols-3">
            <label className="border border-border bg-black/20/60 p-4 text-sm transition has-[:checked]:border-accent/55 has-[:checked]:bg-accent/10">
              <input
                type="radio"
                name="sourceMode"
                value="deployed"
                defaultChecked={sourceConfig.mode === "deployed"}
                className="mr-2 align-middle"
              />
              <span className="font-medium">已部署音源</span>
              <p className="mt-1 text-xs text-muted">沿用现有网易云歌单链路，受 Cookie、版权和地区影响。</p>
            </label>
            <label className="border border-border bg-black/20/60 p-4 text-sm transition has-[:checked]:border-accent/55 has-[:checked]:bg-accent/10">
              <input
                type="radio"
                name="sourceMode"
                value="lx"
                defaultChecked={sourceConfig.mode === "lx"}
                className="mr-2 align-middle"
              />
              <span className="font-medium">LX 音源</span>
              <p className="mt-1 text-xs text-muted">填写可返回 JSON 曲目列表的 LX API。不要直接执行混淆 JS 音源脚本。</p>
            </label>
            <label className="border border-border bg-black/20/60 p-4 text-sm transition has-[:checked]:border-accent/55 has-[:checked]:bg-accent/10">
              <input
                type="radio"
                name="sourceMode"
                value="local"
                defaultChecked={sourceConfig.mode === "local"}
                className="mr-2 align-middle"
              />
              <span className="font-medium">本地音源</span>
              <p className="mt-1 text-xs text-muted">适合少量稳定歌曲，URL 可指向 public 里的 mp3 或外链。</p>
            </label>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">LX API URL 模板</span>
            <input
              name="lxApiUrl"
              type="url"
              defaultValue={sourceConfig.lxApiUrl}
              placeholder="https://example.com/playlist?id={playlistId}"
              className="rounded-md border border-border bg-black/20 px-3 py-2 text-sm transition focus:border-accent/55 focus:outline-none"
            />
            <span className="text-[11px] text-muted">
              支持 {"{playlistId}"} 占位符；返回 JSON 可为数组，或包含 tracks/list/songs/data/result.playlist 等字段。
            </span>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">本地音源 JSON</span>
            <textarea
              name="localTracks"
              rows={8}
              defaultValue={sourceConfig.localTracksRaw}
              placeholder={LOCAL_EXAMPLE}
              className="rounded-md border border-border bg-black/20 px-3 py-2 font-mono text-xs transition focus:border-accent/55 focus:outline-none"
            />
            <span className="text-[11px] text-muted">
              每首歌至少需要 title/name 与 url；可选 artist、cover、duration、lrc。
            </span>
          </label>

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              className="hv-action hv-chip-strong px-4 text-sm font-medium"
            >
              保存音源设置
            </button>
            <a
              href="/admin/music?test=connect"
              className="rounded-md border border-border bg-black/20 px-4 py-2 text-sm text-muted transition hover:border-accent/40 hover:text-foreground"
            >
              测试当前音源
            </a>
          </div>
        </form>

        {testResult ? (
          <div className={"mt-4 rounded-md border px-4 py-3 " + (testResult.ok ? "border-accent/30 bg-accent/5" : "border-red-400/30 bg-red-400/5")}>
            {testResult.ok ? (
              <p className="text-sm">
                <span className="font-medium text-emerald-700 dark:text-accent">连接成功</span>
                <span className="ml-2 text-muted">
                  {testResult.source} · {testResult.tracks} 首 · 可播放 {testResult.playable} 首
                </span>
              </p>
            ) : (
              <p className="text-sm">
                <span className="font-medium text-red-700 dark:text-red-400">连接失败</span>
                <span className="ml-2 break-all font-mono text-xs text-muted">{testResult.error}</span>
              </p>
            )}
          </div>
        ) : null}
      </section>

      <section className="hv-panel p-5">
        <h2 className="text-sm font-semibold tracking-tight">添加已部署音源歌单</h2>
        <p className="mt-1 text-xs text-muted">
          粘贴网易云音乐歌单链接或纯数字 ID。设为当前后会自动切回「已部署音源」。
        </p>
        <form
          action={addPlaylistAction}
          className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center"
        >
          <input
            name="input"
            type="text"
            required
            placeholder="https://music.163.com/playlist?id=... 或 2829883282"
            className="flex-1 rounded-md border border-border bg-black/20 px-3 py-2 text-sm transition focus:border-accent/55 focus:outline-none"
          />
          <button
            type="submit"
            className="hv-action hv-chip-strong px-4 text-sm font-medium"
          >
            添加
          </button>
        </form>
      </section>

      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-sm font-semibold tracking-tight">
            已保存歌单
            <span className="ml-2 font-mono text-xs text-muted">{saved.length}</span>
          </h2>
          {activeId ? <p className="font-mono text-xs text-muted">当前 ID: {activeId}</p> : null}
        </div>

        {saved.length === 0 ? (
          <div className="hv-panel border-dashed p-8 text-center text-sm text-muted">
            还没有保存的歌单。上方添加一个。
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {saved.map((p) => {
              const isActive = p.id === activeId && sourceConfig.mode === "deployed";
              return (
                <div
                  key={p.id}
                  className={"flex flex-col gap-3 overflow-hidden hv-panel p-4 transition " + (isActive ? "border-accent/55 bg-accent/10 shadow-md" : "border-border bg-accent/6 hover:border-accent/40")}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted/20">
                      {p.cover ? (
                        <Image
                          src={p.cover}
                          alt={p.name}
                          fill
                          sizes="80px"
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-3xl text-muted/40">♪</div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="line-clamp-1 text-base font-semibold tracking-tight">{p.name}</h3>
                        {isActive ? (
                          <span className="shrink-0  bg-accent px-2 py-0.5 text-[10px] font-medium text-slate-950">
                            当前
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-0.5 text-xs text-muted">
                        {p.trackCount} 首{p.creator ? " · " + p.creator : ""}
                      </p>
                      <p className="mt-1 font-mono text-[10px] text-muted/70">ID: {p.id}</p>
                    </div>
                  </div>

                  {p.description ? <p className="line-clamp-2 text-xs leading-relaxed text-muted">{p.description}</p> : null}

                  <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
                    {!isActive ? (
                      <form action={setActiveAction}>
                        <input type="hidden" name="id" value={p.id} />
                        <button
                          type="submit"
                          className="rounded-md border border-accent/55 bg-accent/10 px-3 py-1 text-xs font-medium text-foreground transition hover:bg-accent/15"
                        >
                          设为当前
                        </button>
                      </form>
                    ) : null}
                    <form action={refreshPlaylistAction}>
                      <input type="hidden" name="id" value={p.id} />
                      <button
                        type="submit"
                        title="重新拉取封面/名称"
                        className="rounded-md border border-border bg-black/20 px-3 py-1 text-xs text-muted transition hover:border-accent/40 hover:text-foreground"
                      >
                        刷新
                      </button>
                    </form>
                    <a
                      href={"https://music.163.com/#/playlist?id=" + p.id}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-md border border-border bg-black/20 px-3 py-1 text-xs text-muted transition hover:border-accent/40 hover:text-foreground"
                    >
                      网易云 ↗
                    </a>
                    <form action={removePlaylistAction} className="ml-auto">
                      <input type="hidden" name="id" value={p.id} />
                      <button
                        type="submit"
                        className="rounded-md border border-border bg-black/20 px-3 py-1 text-xs text-muted transition hover:border-red-500/40 hover:text-red-500"
                      >
                        删除
                      </button>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="hv-panel p-5">
        <h2 className="text-sm font-semibold tracking-tight">已部署音源 Cookie 状态</h2>
        <div className="mt-3 flex items-center gap-3">
          <span className={"inline-flex h-2.5 w-2.5  " + (cookieSet ? "bg-accent" : "bg-accent")} />
          <p className="text-sm">
            <span className={cookieSet ? "font-medium text-emerald-700 dark:text-accent" : "font-medium text-amber-700 dark:text-accent"}>
              {cookieSet ? "已配置" : "未配置"}
            </span>
            <span className="ml-2 text-muted">
              {cookieSet ? "已部署音源会带登录态请求。" : "未配置时 VIP / 版权曲大概率拿不到可播放地址。"}
            </span>
          </p>
        </div>
        <details className="mt-3">
          <summary className="cursor-pointer text-xs text-muted hover:text-foreground">
            常见 Cookie 粘贴问题
          </summary>
          <ul className="mt-2 space-y-1 pl-5 text-xs text-muted">
            <li>从浏览器 Headers 面板复制可能带 <code className="rounded bg-background px-1">Cookie:</code> 前缀，代码会自动去掉。</li>
            <li>Vercel 里填的时候不要加引号。</li>
            <li>改环境变量后要重新部署，过期后浏览器重新登录再复制。</li>
            <li>如果返回 code=301，说明 Cookie 无效或需要刷新。</li>
          </ul>
        </details>
      </section>

      <div className="text-xs text-muted">
        <p className="font-medium">说明</p>
        <ul className="mt-1.5 list-disc space-y-0.5 pl-5">
          <li>音源模式存储在 <code>music.sourceMode</code>：deployed / lx / local。</li>
          <li>已部署音源沿用 <code>music.playlistId</code> 与 <code>music.savedPlaylists</code>。</li>
          <li>LX 音源使用 <code>music.lxApiUrl</code>，这里只接受 JSON API，不执行第三方混淆脚本。</li>
          <li>本地音源使用 <code>music.localTracks</code> JSON，适合稳定少量曲目。</li>
        </ul>
      </div>
    </div>
  );
}
