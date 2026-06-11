import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import Script from "next/script";
import { Geist, JetBrains_Mono, Orbitron } from "next/font/google";
import "./globals.css";
import "remark-github-blockquote-alert/alert.css";
import { Providers } from "@/components/Providers";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { UmamiScript } from "@/components/UmamiScript";
import { AnnouncementWrapper } from "@/components/AnnouncementWrapper";
import { Backdrop } from "@/components/Backdrop";
import { BannerStrip } from "@/components/BannerStrip";
import { SettingsProvider } from "@/components/SettingsProvider";
import { ScrollProgress } from "@/components/ScrollProgress";
import { siteConfig } from "@/lib/site-config";
import { CommandPaletteHost } from "@/components/CommandPaletteHost";
import { CustomThemeStyles, CustomWallpaper } from "@/components/CustomThemeStyles";
import { DeferredClientUI } from "@/components/DeferredClientUI";
import { RouteChromeState } from "@/components/RouteChromeState";
import { getSiteOverride } from "@/lib/site-config-server";
import { FULLSCREEN_PATHS, isFullScreenPath, CV_SUBDOMAIN, TOOLS_SUBDOMAIN } from "@/lib/fullscreen-routes";
import { isCvVisible } from "@/lib/cv-store";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
};

export async function generateMetadata(): Promise<Metadata> {
  const [description, authorName, authorUrl, title, siteName] = await Promise.all([
    getSiteOverride("description"),
    getSiteOverride("author.name"),
    getSiteOverride("author.githubUrl"),
    getSiteOverride("title"),
    getSiteOverride("name"),
  ]);
  return {
    metadataBase: new URL(siteConfig.url),
    title: {
      default: title,
      template: `%s · ${siteName}`,
    },
    description,
    authors: [{ name: authorName, url: authorUrl }],
    creator: authorName,
    openGraph: {
      title,
      description,
      url: siteConfig.url,
      siteName,
      type: "website",
      locale: siteConfig.locale,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    alternates: {
      canonical: "/",
      types: {
        "application/rss+xml": [
          { url: "/rss.xml", title: siteConfig.rss.title },
        ],
      },
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Set by src/middleware.ts. Undefined when middleware doesn't run (e.g.
  // RSC dev compile passes); next-themes silently skips the nonce attr.
  const headersList = await headers();
  const nonce = headersList.get("x-nonce") ?? undefined;
  const pathname = headersList.get("x-pathname") ?? "";
  const isFullScreenRoute = isFullScreenPath(pathname);
  const cvVisible = await isCvVisible();
  return (
    <html
      lang="zh-CN"
      suppressHydrationWarning
      className={`${geistSans.variable} ${jetbrainsMono.variable} ${orbitron.variable} h-full antialiased`}
    >
      <head>
        <link rel="preconnect" href="https://github.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://lain.bgm.tv" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://cdn.cloudflare.steamstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://media.steampowered.com" crossOrigin="anonymous" />
        <link rel="webmention" href="/api/webmention" />
        <Script
          id="route-chrome-state"
          strategy="beforeInteractive"
          nonce={nonce}
        >{`!function(){var ps=${JSON.stringify(FULLSCREEN_PATHS)},p=location.pathname,h=location.hostname,f=ps.some(function(x){return p===x||p.indexOf(x+"/")===0})||h===${JSON.stringify(CV_SUBDOMAIN)}||h===${JSON.stringify(TOOLS_SUBDOMAIN)}||h==="study.localhost";document.documentElement.dataset.fullscreenRoute=f?"true":"false"}()`}</Script>
        <Script
          id="sw-cleanup"
          strategy="beforeInteractive"
          nonce={nonce}
        >{`!function(){if(!("serviceWorker"in navigator))return;var h=location.hostname,l=h==="localhost"||h==="127.0.0.1"||h==="0.0.0.0",v=null;try{v=localStorage.getItem("sw_v")}catch(e){}if(!l&&"8"===v)return;navigator.serviceWorker.getRegistrations().then(function(r){if(!r.length)return;return Promise.all(r.map(function(s){return s.unregister()})).then(function(){try{localStorage.removeItem("sw_v")}catch(e){}if("caches"in window)caches.keys().then(function(k){return Promise.all(k.filter(function(x){return x.indexOf("hypervoid-")===0}).map(function(x){return caches.delete(x)}))});if(!sessionStorage.getItem("sw_cleanup_reloaded")){sessionStorage.setItem("sw_cleanup_reloaded","1");location.reload()}})})}()`}</Script>
        <CustomThemeStyles />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ScrollProgress />
        <RouteChromeState />
        <a
          href="#main-content"
          className="hv-chrome-only sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[9999] focus:rounded-full focus:bg-primary focus:px-5 focus:py-2.5 focus:text-sm focus:font-medium focus:text-primary-foreground focus:shadow-lg focus:outline-none"
        >
          跳到内容
        </a>
        <SettingsProvider>
          <div className="hv-chrome-only contents">
            <Backdrop />
            <CustomWallpaper />
          </div>
          <Providers nonce={nonce}>
            <div className="hv-route-chrome contents">
              <div className="hv-chrome-only contents">
                <AnnouncementWrapper />
                <SiteHeader cvVisible={cvVisible} />
                <BannerStrip />
              </div>
              <main id="main-content" tabIndex={-1} className="page-fade hv-main-shell w-full flex-1">
                {children}
              </main>
              <div className="hv-chrome-only contents">
                <SiteFooter />
              </div>
            </div>
            <DeferredClientUI />
          </Providers>
        </SettingsProvider>
        <UmamiScript />
        <CommandPaletteHost />
      </body>
    </html>
  );
}
