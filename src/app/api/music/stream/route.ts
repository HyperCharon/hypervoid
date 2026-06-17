import { NextResponse } from "next/server";
import { getPlayableSongUrl, ncmMediaHeaders } from "@/lib/ncm";
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

function copyHeader(from: Headers, to: Headers, name: string) {
  const value = from.get(name);
  if (value) to.set(name, value);
}

export async function GET(req: Request): Promise<Response> {
  const rl = await rateLimit(getIp(req), {
    key: "music:stream",
    limit: 240,
    windowSec: 60,
  });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "请求过于频繁，请 " + rl.resetInSec + " 秒后重试" },
      { status: 429 },
    );
  }

  const url = new URL(req.url);
  const id = Number(url.searchParams.get("id"));
  if (!Number.isSafeInteger(id) || id <= 0) {
    return NextResponse.json({ error: "invalid song id" }, { status: 400 });
  }

  const upstreamUrl = await getPlayableSongUrl(id);
  if (!upstreamUrl) {
    return NextResponse.json({ error: "song unavailable" }, { status: 404 });
  }

  const headers: Record<string, string> = {
    ...ncmMediaHeaders(),
    Accept: "audio/*,*/*;q=0.8",
  };
  const range = req.headers.get("range");
  if (range) headers.Range = range;

  const upstream = await fetch(upstreamUrl, {
    method: "GET",
    headers,
    cache: "no-store",
  });

  if (!upstream.ok || !upstream.body) {
    return NextResponse.json(
      { error: "upstream audio " + upstream.status },
      { status: 502 },
    );
  }

  // Verify upstream returned audio, not an error page or HTML.
  const upstreamCt = upstream.headers.get("content-type") ?? "";
  if (!upstreamCt.startsWith("audio/") && !upstreamCt.startsWith("application/octet-stream")) {
    return NextResponse.json(
      { error: "upstream returned non-audio content" },
      { status: 502 },
    );
  }

  const resHeaders = new Headers();
  copyHeader(upstream.headers, resHeaders, "content-type");
  copyHeader(upstream.headers, resHeaders, "content-length");
  copyHeader(upstream.headers, resHeaders, "content-range");
  copyHeader(upstream.headers, resHeaders, "accept-ranges");
  resHeaders.set("Cache-Control", "private, no-store");
  resHeaders.set("X-Content-Type-Options", "nosniff");

  return new Response(upstream.body, {
    status: upstream.status,
    headers: resHeaders,
  });
}
