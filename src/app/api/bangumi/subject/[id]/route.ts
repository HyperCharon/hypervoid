import { NextResponse } from "next/server";
import { siteConfig } from "@/lib/site-config";

const UA = `HyperCharon/hypervoid (+${siteConfig.url})`;

export const revalidate = 86400;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) {
    return new Response("invalid id", { status: 400 });
  }

  try {
    const res = await fetch(`https://api.bgm.tv/v0/subjects/${id}`, {
      headers: { "User-Agent": UA, Accept: "application/json" },
    });
    if (!res.ok) {
      return new Response("upstream error", { status: 502 });
    }
    const data = await res.json();

    return NextResponse.json({
      id: data.id,
      summary: data.summary || "",
      tags: (data.tags ?? [])
        .slice(0, 12)
        .map((t: { name: string; count: number }) => ({
          name: t.name,
          count: t.count,
        })),
      rating: data.rating ?? null,
      eps: data.eps,
      totalEpisodes: data.total_episodes,
      platform: data.platform || null,
      date: data.date || null,
      nsfw: data.nsfw === true,
      infobox: (data.infobox ?? [])
        .slice(0, 10)
        .map(
          (b: {
            key: string;
            value: string | Array<{ v?: string }>;
          }) => ({
            key: b.key,
            value: Array.isArray(b.value)
              ? b.value
                  .map((x) => x.v)
                  .filter(Boolean)
                  .join(" / ")
              : b.value,
          }),
        ),
    });
  } catch (e) {
    console.error("[bangumi-subject]", e);
    return new Response("error", { status: 500 });
  }
}
