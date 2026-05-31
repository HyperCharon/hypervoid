import { SiteUptime } from "@/components/SiteUptime";
import { TechStackBadges } from "@/components/TechStackBadges";
import { siteConfig } from "@/lib/site-config";

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="hv-grad-header relative mt-16 backdrop-blur-sm">
      {/* Full spectrum top border */}
      <div aria-hidden className="hv-spectrum-line pointer-events-none absolute inset-x-0 top-0 h-[2px] opacity-50" />
      <div className="mx-auto flex max-w-[100rem] flex-col gap-5 px-4 py-6 text-sm sm:px-6 sm:py-8 lg:px-8">
        <div className="relative flex flex-wrap items-center justify-between gap-3 pb-4">
          <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-border" />
          <div>
            <p className="text-xs font-medium text-muted-soft">
              Hypervoid
            </p>
            <p className="mt-1 text-xs text-muted-soft">
              &copy; {year} &middot; <span className="italic">One &amp; Only</span>
            </p>
          </div>
          <TechStackBadges />
        </div>
        <div className="flex flex-col items-start justify-between gap-3 text-xs sm:flex-row sm:items-center">
          <p className="flex flex-wrap items-center gap-3 text-muted-soft">
            <span className="inline-flex items-center gap-1.5 text-accent">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Online
            </span>
            <SiteUptime className="hidden text-muted-soft sm:inline" />
          </p>
          <p className="flex flex-wrap items-center gap-3">
            <a
              href="https://github.com/HyperCharon"
              target="_blank"
              rel="noreferrer noopener"
              className="glow-underline inline-flex items-center gap-1 text-muted transition hover:text-accent"
            >
              GitHub
              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
              </svg>
            </a>
            <a href="/rss.xml" className="text-muted transition hover:text-accent">
              RSS
            </a>
            {siteConfig.donate.enabled ? (
              <a href="/donate" className="text-muted transition hover:text-accent">
                Donate
              </a>
            ) : null}
          </p>
        </div>
      </div>
    </footer>
  );
}
