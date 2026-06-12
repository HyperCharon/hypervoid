import { NextResponse } from "next/server";

/**
 * Study-tools-specific PWA manifest. Served from /tools/manifest on both the
 * main domain and the study subdomain. The layout points here via <link rel="manifest">.
 */
export async function GET(): Promise<NextResponse> {
  const manifest = {
    name: "考研工具",
    short_name: "考研",
    description: "背单词 · 错题本 · 刷题 · 番茄钟",
    start_url: "/",
    display: "standalone" as const,
    background_color: "#09090b",
    theme_color: "#6366f1",
    orientation: "portrait" as const,
    categories: ["education", "productivity"],
    lang: "zh-CN",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon.svg",
        sizes: "192x192",
        type: "image/svg+xml",
        purpose: "maskable",
      },
      {
        src: "/icon.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };

  return NextResponse.json(manifest, {
    headers: {
      "Cache-Control": "public, max-age=86400",
    },
  });
}
