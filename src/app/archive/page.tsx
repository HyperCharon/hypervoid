import Link from "next/link";
import { Archive, Pin, Radio } from "lucide-react";
import { getAllPostMeta } from "@/lib/posts";
import { ArchiveLayout } from "@/components/ArchiveLayout";
import { getMessages } from "@/lib/i18n-server";

export const revalidate = 60;

export default async function ArchivePage() {
  const [posts, t] = await Promise.all([getAllPostMeta(), getMessages()]);

  const byYear = new Map<string, typeof posts>();
  for (const post of posts) {
    const year = post.frontmatter.date.slice(0, 4);
    if (!byYear.has(year)) byYear.set(year, []);
    byYear.get(year)!.push(post);
  }
  const years = [...byYear.keys()].sort((a, b) => (a < b ? 1 : -1));

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8">
      <header className="group relative overflow-hidden border border-border bg-gradient-to-br from-card to-background p-5 sm:p-7" style={{ clipPath: 'polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 0 100%)' }}>
        {/* Corner accents */}
        <div aria-hidden className="pointer-events-none absolute left-0 top-0 h-px w-24 bg-gradient-to-r from-accent/60 to-transparent" />
        <div aria-hidden className="pointer-events-none absolute left-0 top-0 h-24 w-px bg-gradient-to-b from-accent/60 to-transparent" />
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
          <p className="font-mono text-xs font-semibold uppercase tracking-widest text-accent">
            {t.archive.kicker}
          </p>
        </div>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <h1 className="flex items-center gap-3 font-mono text-3xl font-black uppercase leading-tight tracking-tight text-foreground sm:text-5xl">
            <Archive className="h-8 w-8 text-accent-soft sm:h-10 sm:w-10" aria-hidden />
            {t.nav.archive}
          </h1>
          <span className="inline-flex items-center gap-1.5 border border-border bg-accent/15 px-3 py-1 font-mono text-xs font-bold uppercase tracking-wider text-foreground" style={{ clipPath: 'polygon(0 0, calc(100% - 5px) 0, 100% 5px, 100% 100%, 0 100%)' }}>
            <span className="h-1 w-1 rounded-full bg-accent" />
            {posts.length} / {years.length}{t.archive.yearSuffix}
          </span>
        </div>
      </header>
      {years.length === 0 ? (
        <p className="border border-dashed border-border bg-card p-8 text-center font-mono text-sm uppercase tracking-wider text-muted" style={{ clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 0 100%)' }}>
          {t.posts.empty}
        </p>
      ) : (
        <ArchiveLayout>
          {years.map((year) => {
            const yearPosts = byYear.get(year)!;
            return (
              <section key={year} className="flex flex-col gap-3">
                <h2 className="flex items-baseline gap-2 font-mono text-2xl font-bold uppercase tracking-tight text-foreground">
                  {year}
                  <span className="inline-flex items-center gap-1 border border-border bg-card px-2 py-0.5 text-xs font-normal normal-case tracking-wider text-muted" style={{ clipPath: 'polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 0 100%)' }}>
                    {yearPosts.length} {t.archive.postsCount}
                  </span>
                </h2>
                <ol className="relative ml-2 space-y-3 border-l-2 border-border pl-5">
                  {yearPosts.map((post) => (
                    <li key={post.slug} className="relative">
                      <span className="absolute -left-[27px] mt-2 grid h-2.5 w-2.5 place-items-center border border-accent bg-card shadow-[0_0_14px_var(--accent-glow)]" style={{ clipPath: 'polygon(0 0, calc(100% - 2px) 0, 100% 2px, 100% 100%, 0 100%)' }} />
                      <Link
                        href={`/posts/${post.slug}`}
                        className="group flex items-baseline justify-between gap-3 border border-transparent p-2 transition hover:border-border hover:bg-card"
                        style={{ clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 0 100%)' }}
                      >
                        <span className="flex min-w-0 items-baseline gap-2">
                          {post.frontmatter.pinned ? (
                            <Pin className="h-3.5 w-3.5 shrink-0 text-accent" aria-label={t.post.pinnedTooltip} />
                          ) : (
                            <Radio className="h-3.5 w-3.5 shrink-0 text-muted-soft" aria-hidden />
                          )}
                          <span className="line-clamp-1 font-medium text-foreground transition group-hover:text-foreground">
                            {post.frontmatter.title}
                          </span>
                        </span>
                        <time className="shrink-0 font-mono text-xs uppercase tracking-wider text-muted-soft">
                          {post.frontmatter.date.slice(5)}
                        </time>
                      </Link>
                    </li>
                  ))}
                </ol>
              </section>
            );
          })}
        </ArchiveLayout>
      )}
    </div>
  );
}
