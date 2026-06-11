// Routes that render WITHOUT the global blog chrome (header / footer / backdrop /
// announcement). The layout escapes these to a blank, full-bleed canvas and CSS
// (`html[data-fullscreen-route="true"]`) hides `.hv-chrome-only` + full-bleeds
// `.hv-main-shell`. Keep this the single source of truth — it feeds the server
// render (layout.tsx), the beforeInteractive pre-paint script, and the
// client-nav sync (RouteChromeState.tsx).
export const FULLSCREEN_PATHS = ["/sign-in", "/cv", "/tools"] as const;

// The résumé subdomain serves /cv at its root via a rewrite, so the browser
// path is "/" while the page is really /cv. Client-side detectors must also
// treat this host as the fullscreen résumé.
export const CV_SUBDOMAIN = "cv.hypervoid.top";

// The study-tools subdomain serves /tools/* at its root via a rewrite, so the
// browser path is clean (e.g. "/flashcards") while the page is really /tools/*.
// Client-side detectors must also treat this host as fullscreen.
export const TOOLS_SUBDOMAIN = "study.hypervoid.top";

function isToolsSubdomainHost(): boolean {
  if (typeof location === "undefined") return false;
  const h = location.hostname;
  return h === TOOLS_SUBDOMAIN || h === "study.localhost";
}

export function isFullScreenPath(pathname: string): boolean {
  return FULLSCREEN_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

/** Client-side: is this the résumé, either by path or by the cv subdomain host? */
export function isCvContext(pathname: string): boolean {
  if (pathname === "/cv" || pathname.startsWith("/cv/")) return true;
  if (typeof location !== "undefined" && location.hostname === CV_SUBDOMAIN) return true;
  return false;
}

/** Client-side fullscreen check that also accounts for the cv + tools subdomains. */
export function isFullScreenContext(pathname: string): boolean {
  return isFullScreenPath(pathname) || isCvContext(pathname) || isToolsSubdomainHost();
}
