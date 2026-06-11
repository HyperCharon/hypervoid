import type { NextConfig } from "next";
import path from "node:path";

// CSP: strict routes (/admin, /api/admin, /api/cron, /search) get a
// per-request nonce-based policy from src/proxy.ts. Public ISR-cached
// routes get a static permissive policy below so they can still be cached.

const nextConfig: NextConfig = {
  poweredByHeader: false,
  turbopack: {
    root: path.resolve(__dirname),
  },
  experimental: {
    viewTransition: true,
    serverActions: {
      allowedOrigins: [
        "hypervoid.top",
        "www.hypervoid.top",
        "cv.hypervoid.top",
        "study.hypervoid.top",
        "*.vercel.app",
      ],
      bodySizeLimit: "4mb",
    },
  },
  // Lets next/image proxy + auto-resize covers/avatars from these hosts.
  // The Vercel Image Optimization API will fetch, resize, and serve modern
  // formats (AVIF/WebP) — saving the bandwidth + LCP cost of returning raw
  // 1-5MB originals at 128px display widths.
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "lain.bgm.tv" },
      { protocol: "https", hostname: "cdn.cloudflare.steamstatic.com" },
    ],
  },
  headers: async () => [
    {
      // Public permissive CSP — excludes strict routes handled by proxy.
      source: "/((?!admin|api/admin|api/cron|search).*)",
      headers: [
        {
          key: "Content-Security-Policy",
          value: [
            "default-src 'self'",
            "style-src 'self' 'unsafe-inline' https://giscus.app",
            "img-src 'self' data: blob: https:",
            "font-src 'self' data:",
            "frame-src https://giscus.app https://www.youtube.com https://player.bilibili.com",
            "connect-src 'self' https://cloud.umami.is https://umami.hypervoid.top https://api-gateway.umami.dev https://giscus.app https://api.bgm.tv https://api.anthropic.com https://api.deepseek.com https://api.iconify.design",
            "media-src 'self'",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://giscus.app https://cloud.umami.is https://umami.hypervoid.top",
          ].join("; "),
        },
      ],
    },
    {
      source: "/(.*)",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-XSS-Protection", value: "0" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
        { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
      ],
    },
  ],
};

export default nextConfig;
