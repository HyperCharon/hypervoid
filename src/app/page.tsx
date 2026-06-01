import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { FeaturedPostCard } from "@/components/FeaturedPostCard";
import { ScrollReveal } from "@/components/ScrollReveal";
import { SubscribeForm } from "@/components/SubscribeForm";
import { RssSubscribeCard } from "@/components/RssSubscribeCard";
import { isEmailConfigured } from "@/lib/email";
import { SiteStats } from "@/components/SiteStats";
import { AnnouncementWidget } from "@/components/AnnouncementWidget";
import { ProfileCard } from "@/components/ProfileCard";
import { MiniCalendar } from "@/components/MiniCalendar";
import { MiniTerminal } from "@/components/MiniTerminal";
import { PostActivityHeatmap } from "@/components/PostActivityHeatmap";
import { TopicCollections } from "@/components/TopicCollections";
import { TagCloud } from "@/components/TagCloud";
import { RecentGuestbook } from "@/components/RecentGuestbook";
import { PrivateSpace } from "@/components/PrivateSpace";
import { HeroSection } from "@/components/HeroSection";
import { DailyPick } from "@/components/DailyPick";
import { HomePlayerWidget } from "@/components/HomePlayerWidget";
import { LatestPostsHeader, EmptyPosts, RssHint } from "@/components/HomeSectionHeader";
import { GradualBlur } from "@/components/GradualBlur";
import { getAllPostMeta } from "@/lib/posts";
import { getSiteOverride } from "@/lib/site-config-server";
import { getMessages } from "@/lib/i18n-server";
import { Skeleton } from "@/components/Skeleton";

export const revalidate = 60;

function pickByDay<T>(arr: T[]): T | null {
  if (arr.length === 0) return null;
  const day = Math.floor(Date.now() / 86_400_000);
  return arr[day % arr.length];
}

export default async function Home() {
  const [all, quote, quoteAuthor] = await Promise.all([
    getAllPostMeta().catch((error) => {
      console.warn("[home] failed to load posts:", error instanceof Error ? error.message : error);
      return [];
    }),
    getSiteOverride("home.quote"),
    getSiteOverride("home.quoteAuthor"),
  ]);
  const recent = all;
  const dailyPick = pickByDay(all);
  const t = await getMessages();

  const terminalPosts = all
    .slice(0, 20)
    .map((p) => ({ slug: p.slug, title: p.frontmatter.title }));
  const tagCounts = new Map<string, number>();
  for (const p of all) {
    for (const t of p.frontmatter.tags) {
      tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
    }
  }
  const terminalTags = [...tagCounts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const heroStats = {
    articles: all.length,
    words: all.reduce((sum, p) => sum + (p.frontmatter.wordCount ?? 0), 0),
    minutes: all.reduce((sum, p) => sum + (p.frontmatter.readingMinutes ?? 0), 0),
    tags: tagCounts.size,
  };

  const heroRecent = all.slice(0, 5).map((p) => ({
    slug: p.slug,
    title: p.frontmatter.title,
  }));

  return (
    <>
      {/* ═══ HERO ═══ */}
      <HeroSection
        quote={quote}
        quoteAuthor={quoteAuthor}
        stats={heroStats}
        recentPosts={heroRecent}
        topTags={terminalTags.slice(0, 8)}
      />

      {/* ═══ MAIN + SIDEBAR ═══ */}
      <div className="mt-4 w-full px-3 sm:px-6 sm:mt-8 lg:px-8 lg:mt-12">
      <div className="mx-auto grid max-w-[100rem] grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-10">
        <main className="flex flex-col gap-8 lg:order-1">

          {/* ── Daily Pick — floating card ── */}
          {dailyPick ? (
            <ScrollReveal variant="fade-up" delay={100}>
              <div className="-mt-4 lg:-mt-6">
                <DailyPick post={dailyPick} />
              </div>
            </ScrollReveal>
          ) : null}

          {/* ── Topic Series — breakout bento ── */}
          <ScrollReveal variant="fade-up" delay={150}>
            <div className="-mx-4 sm:-mx-6 md:-mx-8">
              <div className="px-4 sm:px-6 md:px-8">
                <Suspense fallback={<Skeleton className="h-64 w-full" />}>
                  <TopicCollections />
                </Suspense>
              </div>
            </div>
          </ScrollReveal>

          {/* ── Activity Heatmap ── */}
          <ScrollReveal variant="fade-up" delay={100}>
            <PostActivityHeatmap />
          </ScrollReveal>

          {/* ── Posts Section ── */}
          <section>
            <LatestPostsHeader />

            {recent.length ? (
              <div className="flex flex-col gap-5">
                {/* Featured — full width */}
                <ScrollReveal variant="scale-up" duration={700}>
                  <FeaturedPostCard post={recent[0]} />
                </ScrollReveal>

                {/* Posts grid — mobile: simple list / desktop: masonry */}
                {recent.length > 1 ? (
                  <div className="relative">
                    {/* Mobile: simple stacked list */}
                    <div className="flex flex-col gap-2 sm:hidden">
                      {recent.slice(1).map((post, i) => (
                        <ScrollReveal key={post.slug} variant="fade-up" delay={i * 40} duration={400}>
                          <Link
                            href={`/posts/${post.slug}`}
                            className="group flex items-center gap-3 rounded-xl border border-border/30 bg-card/40 px-3 py-2.5 transition-all duration-200 hover:border-accent/30 hover:bg-card/70"
                          >
                            <span className="w-5 shrink-0 text-center font-mono text-[10px] text-muted-soft/30">
                              {String(i + 1).padStart(2, "0")}
                            </span>
                            <div className="min-w-0 flex-1">
                              <h3 className="truncate text-[13px] font-semibold tracking-tight text-foreground/90 group-hover:text-accent">
                                {post.frontmatter.title}
                              </h3>
                              <div className="mt-0.5 flex items-center gap-2 text-[10px] text-muted-soft/50">
                                <time className="font-mono">{post.frontmatter.date}</time>
                                <span>{post.frontmatter.readingMinutes}{t.post.readingTimeSuffix}</span>
                              </div>
                            </div>
                            {post.frontmatter.cover ? (
                              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md">
                                <Image src={post.frontmatter.cover} alt="" width={80} height={80} className="h-full w-full object-cover opacity-70" unoptimized />
                              </div>
                            ) : null}
                            <svg aria-hidden className="h-3.5 w-3.5 shrink-0 text-muted-soft/25 transition group-hover:translate-x-0.5 group-hover:text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M5 12h14M13 5l7 7-7 7" />
                            </svg>
                          </Link>
                        </ScrollReveal>
                      ))}
                    </div>

                    {/* Desktop: masonry columns */}
                    <div className="hidden columns-1 gap-3 sm:columns-2">
                      {recent.slice(1).map((post, i) => {
                        const hasCover = !!post.frontmatter.cover;
                        return (
                          <ScrollReveal key={post.slug} variant="fade-up" delay={i * 40} duration={400}>
                            <Link
                              href={`/posts/${post.slug}`}
                              className="group relative mb-3 flex flex-row items-center gap-3 break-inside-avoid overflow-hidden rounded-xl border border-border/30 bg-card/40 p-3.5 transition-all duration-250 hover:border-accent/30 hover:bg-card/70 hover:shadow-[0_0_20px_var(--accent-glow)]"
                            >
                              {hasCover ? (
                                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg">
                                  <Image src={post.frontmatter.cover!} alt="" width={144} height={144} sizes="144px" loading="lazy" className="h-full w-full object-cover opacity-80 saturate-[0.85] transition duration-300 group-hover:scale-105 group-hover:opacity-100 group-hover:saturate-100" />
                                </div>
                              ) : null}
                              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                                <div className="flex items-center gap-2">
                                  <span className="pointer-events-none font-mono text-[10px] font-bold tracking-wider text-muted-soft/20 transition-colors group-hover:text-accent/25">{String(i + 1).padStart(2, "0")}</span>
                                  <time className="font-mono text-[10px] tracking-wider text-muted-soft/50 transition-colors group-hover:text-accent/60">{post.frontmatter.date}</time>
                                  <span className="h-px flex-1 bg-border/20" />
                                  <span className="font-mono text-[10px] text-muted-soft/35">{post.frontmatter.readingMinutes}{t.post.readingTimeSuffix}</span>
                                </div>
                                <h3 className="line-clamp-2 text-[15px] font-semibold tracking-tight text-foreground/90 transition-colors duration-200 group-hover:text-accent">{post.frontmatter.title}</h3>
                                {!hasCover && post.frontmatter.description ? (
                                  <p className="line-clamp-2 text-xs leading-relaxed text-muted-soft/60">{post.frontmatter.description}</p>
                                ) : null}
                                {post.frontmatter.tags?.length ? (
                                  <div className="mt-auto flex flex-wrap gap-1.5 pt-1.5">
                                    {post.frontmatter.tags.slice(0, 2).map((tag) => (
                                      <span key={tag} className="rounded-md border border-border/25 bg-background/50 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-muted-soft/50 transition-colors group-hover:border-accent/20 group-hover:text-muted-soft/70">{tag}</span>
                                    ))}
                                  </div>
                                ) : null}
                              </div>
                              <span className="absolute inset-x-3 bottom-0 h-px scale-x-0 bg-gradient-to-r from-transparent via-accent/40 to-transparent transition-transform duration-300 group-hover:scale-x-100" />
                            </Link>
                          </ScrollReveal>
                        );
                      })}
                    </div>

                    {/* Gradual blur overlay (reactbits-inspired) */}
                    <GradualBlur
                      position="bottom"
                      intensity={1.2}
                      height="5rem"
                      layers={4}
                    />

                    {/* View all link */}
                    <div className="relative z-20 flex justify-center pt-6 pb-1">
                      <Link
                        href="/posts"
                        className="inline-flex items-center gap-1.5 rounded-full border border-border/40 bg-card/60 px-4 py-1.5 font-mono text-[11px] uppercase tracking-wider text-muted-soft transition-all duration-200 hover:border-accent/40 hover:bg-accent/8 hover:text-accent"
                      >
                        {t.hero.enterPosts}
                        <svg aria-hidden className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 12h14M13 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <EmptyPosts />
            )}
          </section>

          {/* ── Subscribe ── */}
          <ScrollReveal variant="fade-up" delay={100}>
            <div className="hv-card overflow-hidden p-0">
              <div className="grid gap-0 md:grid-cols-[1fr_auto] md:items-stretch">
                {/* Left — info */}
                <div className="flex flex-col justify-center gap-2 border-b border-border p-4 sm:p-5 md:border-b-0 md:border-r">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded bg-accent/10">
                      <svg aria-hidden className="h-3 w-3 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="4" width="20" height="16" rx="2" />
                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                      </svg>
                    </span>
                    <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-foreground">
                      Subscribe_Updates
                    </h3>
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                  </div>
                  <p className="text-sm leading-relaxed text-muted-soft">
                    {t.subscribe.description}
                  </p>
                </div>
                {/* Right — form */}
                <div className="flex items-center p-4 sm:p-5">
                  {isEmailConfigured() ? <SubscribeForm variant="compact" /> : (
                    <Link
                      href="/rss.xml"
                      prefetch={false}
                      className="inline-flex items-center gap-1.5 rounded-md border border-accent/30 bg-accent/8 px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wider text-accent transition hover:border-accent/50 hover:bg-accent/15"
                    >
                      RSS
                      <svg aria-hidden className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14M13 5l7 7-7 7" />
                      </svg>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </ScrollReveal>
        </main>

        {/* ═══ SIDEBAR — staggered, varied spacing ═══ */}
        <aside className="lg:order-2">
          <div className="flex flex-col gap-5 lg:sticky lg:top-20">
            <PrivateSpace />

            <Suspense fallback={<Skeleton className="h-48 w-full" />}>
              <ProfileCard />
            </Suspense>

            <Suspense fallback={<Skeleton className="h-24 w-full" />}>
              <SiteStats />
            </Suspense>

            <Suspense fallback={null}>
              <AnnouncementWidget />
            </Suspense>

            <div className="hidden lg:block">
              <MiniTerminal posts={terminalPosts} tags={terminalTags} me={null} />
            </div>

            <div className="hidden md:contents">
              <Suspense fallback={<Skeleton className="h-44 w-full" />}>
                <MiniCalendar />
              </Suspense>
            </div>

            <HomePlayerWidget />

            <div className="hidden md:contents">
              <Suspense fallback={<Skeleton className="h-32 w-full" />}>
                <TagCloud />
              </Suspense>
            </div>

            <Suspense fallback={<Skeleton className="h-40 w-full" />}>
              <RecentGuestbook />
            </Suspense>
          </div>
        </aside>
      </div>
      </div>
    </>
  );
}
