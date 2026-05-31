import { getSiteStats } from "@/lib/stats";
import { StatsCarousel, type StatsCarouselItem } from "@/components/StatsCarousel";
import { getMessages } from "@/lib/i18n-server";

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `${(n / 1000).toFixed(1)}k`;
  return n.toLocaleString();
}

export async function SiteStats() {
  const [stats, t] = await Promise.all([getSiteStats(), getMessages()]);

  const items: StatsCarouselItem[] = [
    {
      id: "posts",
      title: t.stats.articles,
      value: stats.posts.toLocaleString(),
      description: t.stats.articlesDesc,
      tone: "cyan",
    },
    {
      id: "views",
      title: t.stats.pageViews,
      value: formatNumber(stats.views),
      description: t.stats.pageViewsDesc,
      tone: "cyan",
    },
    {
      id: "likes",
      title: t.stats.reactions,
      value: formatNumber(stats.likes),
      description: t.stats.reactionsDesc,
      tone: "cyan",
    },
    {
      id: "uptime",
      title: t.stats.uptime,
      value: `${stats.daysOnline.toLocaleString()} ${t.stats.daysSuffix}`,
      description: t.stats.uptimeDesc,
      tone: "cyan",
    },
  ];

  return (
    <aside className="hv-panel-sci group relative overflow-hidden p-3">
      <div aria-hidden className="pointer-events-none absolute right-0 top-0 h-px w-12 bg-gradient-to-l from-accent/60 to-transparent" />
      <div aria-hidden className="pointer-events-none absolute right-0 top-0 h-12 w-px bg-gradient-to-b from-accent/60 to-transparent" />

      <div className="flex items-center justify-between">
        <h3 className="font-mono text-xs font-semibold uppercase tracking-widest text-foreground/80">
          {t.stats.siteStats}
        </h3>
        <div className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
          <span className="font-mono text-xs uppercase tracking-wider text-accent/70">{t.stats.live}</span>
        </div>
      </div>

      <div className="mt-2.5">
        <StatsCarousel
          items={items}
          baseWidth={330}
          autoplay
          autoplayDelay={3000}
          pauseOnHover={false}
          loop={false}
        />
      </div>
    </aside>
  );
}
