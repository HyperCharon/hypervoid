import { NextResponse } from "next/server";
import {
  getConfiguredMusicTracks,
  getMusicSourceConfig,
  MUSIC_SOURCE_LABEL,
} from "@/lib/music-sources";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

// Clients always get the source selected by the admin. This keeps the endpoint
// from becoming a public free-form music proxy.
export async function GET(req: Request): Promise<Response> {
  const rl = await rateLimit(getIp(req), {
    key: "music:playlist",
    limit: 30,
    windowSec: 60,
  });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "请求过于频繁，请 " + rl.resetInSec + " 秒后重试" },
      { status: 429 },
    );
  }

  try {
    const [config, tracks] = await Promise.all([
      getMusicSourceConfig(),
      getConfiguredMusicTracks(),
    ]);
    if (tracks.length === 0) {
      return NextResponse.json(
        { error: "当前音源没有返回曲目，请去后台音乐设置检查配置" },
        { status: 400 },
      );
    }
    return NextResponse.json(
      {
        source: MUSIC_SOURCE_LABEL[config.mode],
        tracks,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=180, stale-while-revalidate=900",
        },
      },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    console.error("[music/playlist] " + msg);
    return NextResponse.json(
      { error: "获取音乐数据失败，请稍后重试" },
      { status: 502 },
    );
  }
}
