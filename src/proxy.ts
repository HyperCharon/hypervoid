import { NextResponse, type NextRequest } from "next/server";
import { auth, ADMIN_LOGIN } from "@/auth";

/**
 * Per-request CSP nonce + preview-deployment/admin gate + optional site-wide login.
 *
 * Next.js 16 renamed the `middleware` convention to `proxy`; keep this file
 * narrow so public ISR pages stay cacheable. Public routes use the static CSP
 * from next.config.ts, while admin/search/cron routes get a strict nonce CSP.
 */

const COMMON_DIRECTIVES = [
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
];

const SCRIPT_HOSTS =
  "https://giscus.app https://cloud.umami.is https://umami.hypervoid.top";

// Paths exempt from site-wide login check
const PUBLIC_PATHS = [
  "/sign-in",
  "/api/auth",
  "/api/og",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
  "/manifest.json",
];

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/")))
    return true;
  // Static assets
  if (pathname.startsWith("/_next/") || pathname.startsWith("/live2d/"))
    return true;
  if (/\.(ico|png|jpg|jpeg|gif|webp|svg|css|js|woff2?|ttf|eot|mp4|webm|mov|mp3|m4a|ogg|wav|flac|aac|vtt|m3u8|mpd)$/.test(pathname))
    return true;
  return false;
}

async function isSiteLoginRequired(): Promise<boolean> {
  try {
    const { getSiteSetting } = await import("@/db/site-settings");
    const val = await getSiteSetting("site_login_required");
    return val === "true";
  } catch {
    return false;
  }
}

async function denyUnauthorized(req: NextRequest): Promise<NextResponse | null> {
  const { pathname } = req.nextUrl;
  const isAdminPath = pathname.startsWith("/admin");
  const isAdminApi = pathname.startsWith("/api/admin");
  if ((!isAdminPath && !isAdminApi) || pathname === "/admin/sign-in") {
    return null;
  }

  const session = await auth();
  const user = session?.user as
    | { login?: string | null; isAdmin?: boolean | null }
    | undefined;
  const allowed = user?.isAdmin === true || user?.login === ADMIN_LOGIN;
  if (allowed) return null;

  if (isAdminApi) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const signInUrl = new URL("/admin/sign-in", req.nextUrl);
  signInUrl.searchParams.set("callbackUrl", req.nextUrl.pathname + req.nextUrl.search);
  if (user) signInUrl.searchParams.set("error", "AccessDenied");
  return NextResponse.redirect(signInUrl);
}

async function checkSiteLogin(req: NextRequest): Promise<NextResponse | null> {
  const { pathname } = req.nextUrl;

  // Skip public paths, admin paths (handled separately), and API routes
  if (isPublicPath(pathname) || pathname.startsWith("/admin") || pathname.startsWith("/api/")) {
    return null;
  }

  const required = await isSiteLoginRequired();
  if (!required) return null;

  const session = await auth();
  if (session?.user) return null;

  const signInUrl = new URL("/sign-in", req.nextUrl);
  signInUrl.searchParams.set("callbackUrl", pathname + req.nextUrl.search);
  return NextResponse.redirect(signInUrl);
}

export default async function proxy(req: NextRequest): Promise<NextResponse> {
  const { pathname } = req.nextUrl;
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", pathname);

  const isAdminOrSearch =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api/admin") ||
    pathname.startsWith("/api/cron") ||
    pathname === "/search";

  // Site-wide login check (runs for all routes)
  const siteLoginRedirect = await checkSiteLogin(req);
  if (siteLoginRedirect) return siteLoginRedirect;

  if (!isAdminOrSearch) {
    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  const unauthorized = await denyUnauthorized(req);
  if (unauthorized) return unauthorized;

  if (process.env.VERCEL_ENV === "preview") {
    const previewSecret = process.env.PREVIEW_SECRET;
    const cookie = req.cookies.get("__hypervoid_preview")?.value;
    if (cookie !== previewSecret || !previewSecret) {
      return new NextResponse("Preview - admin disabled", { status: 403 });
    }
  }

  const nonce = btoa(crypto.randomUUID());
  const scriptSrc = `script-src 'self' 'nonce-${nonce}' ${SCRIPT_HOSTS}`;
  const csp = [...COMMON_DIRECTIVES, scriptSrc].join("; ");

  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    // Match all paths except internal Next.js
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
