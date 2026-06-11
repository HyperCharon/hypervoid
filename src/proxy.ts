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

// Résumé subdomain. The whole subdomain *is* the /cv page. Enabled only once the
// DNS/Vercel domain exists — gated by env so behaviour is unchanged until then.
const CV_SUBDOMAIN = "cv.hypervoid.top";
const MAIN_DOMAIN = "hypervoid.top";
const CV_SUBDOMAIN_ENABLED = process.env.CV_SUBDOMAIN_ENABLED === "1";

// Study-tools subdomain (考研工具) — a private, admin-only mini-app. The whole
// subdomain *is* the /tools route tree: every non-passthrough path is rewritten
// under /tools/* so the browser URL stays clean (study.hypervoid.top/flashcards).
// Env-gated like the résumé subdomain; needs AUTH_COOKIE_DOMAIN set so the admin
// session created on the main domain is shared to this subdomain (see auth.ts).
const TOOLS_SUBDOMAIN = "study.hypervoid.top";
const TOOLS_SUBDOMAIN_ENABLED = process.env.TOOLS_SUBDOMAIN_ENABLED === "1";

function hostOf(req: NextRequest): string {
  return (req.headers.get("host") || "").split(":")[0].toLowerCase();
}

// Local dev: *.localhost resolves to 127.0.0.1 in modern browsers, so accept
// study.localhost to exercise the rewrite without DNS. Never matched in prod.
function isToolsHost(host: string): boolean {
  if (!TOOLS_SUBDOMAIN_ENABLED) return false;
  if (host === TOOLS_SUBDOMAIN) return true;
  return process.env.NODE_ENV !== "production" && host === "study.localhost";
}

/**
 * Host-based routing for the résumé subdomain. Returns a response when it has
 * handled the request, or null to fall through to normal routing.
 */
function routeCvSubdomain(req: NextRequest): NextResponse | null {
  if (!CV_SUBDOMAIN_ENABLED) return null;
  const host = hostOf(req);
  const { pathname, search } = req.nextUrl;

  // On the résumé subdomain: serve only /cv; everything else bounces to main.
  if (host === CV_SUBDOMAIN) {
    if (
      pathname === "/cv" ||
      pathname.startsWith("/cv/") ||
      pathname.startsWith("/_next/") ||
      pathname.startsWith("/api/") ||
      pathname === "/favicon.ico" ||
      /\.[a-z0-9]+$/i.test(pathname)
    ) {
      return null; // pass through to normal handling
    }
    if (pathname === "/") {
      const url = req.nextUrl.clone();
      url.pathname = "/cv";
      // Tell the server layout this is the /cv (fullscreen) route, since the
      // browser path stays "/" after a rewrite.
      const headers = new Headers(req.headers);
      headers.set("x-pathname", "/cv");
      return NextResponse.rewrite(url, { request: { headers } });
    }
    // Any other path on the subdomain → corresponding page on the main domain.
    return NextResponse.redirect(`https://${MAIN_DOMAIN}${pathname}${search}`, 308);
  }

  // On the main domain: /cv lives on the subdomain now → send visitors there.
  if (host === MAIN_DOMAIN || host === `www.${MAIN_DOMAIN}`) {
    if (pathname === "/cv" || pathname.startsWith("/cv/")) {
      return NextResponse.redirect(`https://${CV_SUBDOMAIN}/`, 308);
    }
  }

  return null;
}

/**
 * Host-based routing for the private study-tools subdomain. Gates on the admin
 * session (redirecting unauthenticated visitors to the main-domain sign-in),
 * then rewrites the clean URL under /tools/*. Returns a response when handled,
 * or null to fall through to normal routing.
 */
async function routeToolsSubdomain(req: NextRequest): Promise<NextResponse | null> {
  if (!TOOLS_SUBDOMAIN_ENABLED) return null;
  const host = hostOf(req);
  const { pathname, search } = req.nextUrl;

  // On the main domain: /tools lives on the subdomain now → send visitors there.
  if (!isToolsHost(host)) {
    if (host === MAIN_DOMAIN || host === `www.${MAIN_DOMAIN}`) {
      if (pathname === "/tools" || pathname.startsWith("/tools/")) {
        const clean = pathname.replace(/^\/tools/, "") || "/";
        return NextResponse.redirect(`https://${TOOLS_SUBDOMAIN}${clean}${search}`, 308);
      }
    }
    return null;
  }

  // On the tools subdomain. Framework internals, APIs (gated separately), and
  // static files keep their real path so they resolve normally.
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/api/") ||
    pathname === "/favicon.ico" ||
    /\.[a-z0-9]+$/i.test(pathname)
  ) {
    return null;
  }

  // A bare /tools(/…) should never arrive from this host; normalise to the clean
  // URL so we never double-prefix into /tools/tools.
  if (pathname === "/tools" || pathname.startsWith("/tools/")) {
    const clean = pathname.replace(/^\/tools/, "") || "/";
    return NextResponse.redirect(new URL(`${clean}${search}`, req.nextUrl), 308);
  }

  // Private space: require the admin session before serving any page. The cookie
  // is domain-wide (AUTH_COOKIE_DOMAIN), set on the main domain at sign-in.
  const session = await auth();
  const user = session?.user as
    | { login?: string | null; isAdmin?: boolean | null }
    | undefined;
  const allowed = user?.isAdmin === true || user?.login === ADMIN_LOGIN;
  if (!allowed) {
    // Sign-in must happen on the main domain (the GitHub OAuth callback is
    // registered there); the domain-wide cookie then unlocks this subdomain.
    // Sign-in happens on the main domain (the GitHub OAuth callback is
    // registered there); the domain-wide session cookie then unlocks this
    // subdomain. The absolute cross-host target is what makes the browser leave
    // the subdomain — mirrors the résumé subdomain's cross-host redirects.
    const proto = req.nextUrl.protocol; // "https:" | "http:"
    const mainHost =
      host === TOOLS_SUBDOMAIN ? MAIN_DOMAIN : `localhost:${req.nextUrl.port || "3000"}`;
    const signIn = new URL(`${proto}//${mainHost}/sign-in`);
    signIn.searchParams.set("callbackUrl", `${proto}//${host}${pathname}${search}`);
    if (user) signIn.searchParams.set("error", "AccessDenied");
    return NextResponse.redirect(signIn.toString());
  }

  // Blanket rewrite: /<p> → /tools/<p>, / → /tools. The server layout reads
  // x-pathname (the rewritten path) for fullscreen-chrome detection.
  const url = req.nextUrl.clone();
  url.pathname = pathname === "/" ? "/tools" : `/tools${pathname}`;
  const headers = new Headers(req.headers);
  headers.set("x-pathname", url.pathname);
  return NextResponse.rewrite(url, { request: { headers } });
}

// Paths exempt from site-wide login check
const PUBLIC_PATHS = [
  "/sign-in",
  "/cv", // public résumé — recruiter-facing, must bypass the site-login gate
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
    return val === "required";
  } catch {
    // DB error — assume login required (fail closed)
    return true;
  }
}

async function denyUnauthorized(req: NextRequest): Promise<NextResponse | null> {
  const { pathname } = req.nextUrl;
  const isAdminPath = pathname.startsWith("/admin");
  const isAdminApi = pathname.startsWith("/api/admin");
  const isToolsApi = pathname.startsWith("/api/tools");
  if (!isAdminPath && !isAdminApi && !isToolsApi) {
    return null;
  }

  const session = await auth();
  const user = session?.user as
    | { login?: string | null; isAdmin?: boolean | null }
    | undefined;
  const allowed = user?.isAdmin === true || user?.login === ADMIN_LOGIN;
  if (allowed) return null;

  if (isAdminApi || isToolsApi) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const signInUrl = new URL("/sign-in", req.nextUrl);
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
  // Résumé subdomain host-routing runs first (rewrite/redirect short-circuits).
  const cvRoute = routeCvSubdomain(req);
  if (cvRoute) return cvRoute;

  // Study-tools subdomain — gates + rewrites the private mini-app.
  const toolsRoute = await routeToolsSubdomain(req);
  if (toolsRoute) return toolsRoute;

  const { pathname } = req.nextUrl;
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", pathname);

  const isAdminOrSearch =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api/admin") ||
    pathname.startsWith("/api/tools") ||
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
