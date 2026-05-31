import { Suspense } from "react";
import Link from "next/link";
import { FeaturedPostCard } from "@/components/FeaturedPostCard";
import { CompactPostCard } from "@/components/CompactPostCard";
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
import { getAllPostMeta } from "@/lib/posts";
import { getSiteOverride } from "@/lib/site-config-server";
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
      <div className="mt-8 w-full px-4 sm:px-6 lg:px-8 lg:mt-12">
      <div className="mx-auto grid max-w-[100rem] grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-10">
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
              <div className="flex flex-col gap-6">
                {/* Featured — full width with cover */}
                <ScrollReveal variant="scale-up" duration={700}>
                  <FeaturedPostCard post={recent[0]} />
                </ScrollReveal>

                {/* Typographic list — overreacted.io style */}
                {recent.length > 1 ? (
                  <div className="flex flex-col">
                    {recent.slice(1).map((post, i) => (
                      <ScrollReveal key={post.slug} variant="fade-up" delay={i * 60} duration={500}>
                        <CompactPostCard post={post} index={i + 1} />
                      </ScrollReveal>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : (
              <EmptyPosts />
            )}
          </section>

          {/* ── Subscribe ── */}
          <ScrollReveal variant="fade-up" delay={100}>
            <div className="border-t border-border pt-6">
              {isEmailConfigured() ? <SubscribeForm variant="compact" /> : (
                <div className="flex items-center justify-between gap-4">
                  <RssHint />
                  <Link
                    href="/rss.xml"
                    prefetch={false}
                    className="inline-flex shrink-0 items-center gap-1.5 font-mono text-xs font-medium uppercase tracking-wider text-accent transition hover:text-accent-soft"
                  >
                    RSS
                    <svg aria-hidden className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M13 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              )}
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
