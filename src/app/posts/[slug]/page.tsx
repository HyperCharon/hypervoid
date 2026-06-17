import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Coffee, Dices, ExternalLink, LockKeyhole, Pin, RefreshCcw, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import { MDXRemote } from "next-mdx-remote/rsc";
// KaTeX stylesheet — scoped to article pages so the ~50KB of CSS isn't
// pulled in on /posts, /tags, /home etc. when no math is rendered.
import "katex/dist/katex.min.css";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { remarkAlert } from "remark-github-blockquote-alert";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeKatex from "rehype-katex";
import rehypeShiki from "@shikijs/rehype";
import { remarkVideoEmbed } from "@/lib/remark-video-embed";
import { remarkMermaid } from "@/lib/remark-mermaid";
import { getAllPostSlugs, getAdjacentPosts, getBacklinks, getPostBySlug, getRelatedPosts } from "@/lib/posts";
import { mdxComponents } from "@/lib/mdx-components";
import { extractTOC } from "@/lib/toc";
import { transformerCodeMeta } from "@/lib/shiki-meta";
import { TableOfContents } from "@/components/TableOfContents";
import { Comments } from "@/components/Comments";
import { ViewCounter } from "@/components/ViewCounter";
import { ReactionBar } from "@/components/ReactionBar";
import { getReactionCounts } from "@/lib/reactions";
import { AskAI } from "@/components/AskAI";
import { PostNav } from "@/components/PostNav";
import { RelatedPosts } from "@/components/RelatedPosts";
import { Backlinks } from "@/components/Backlinks";
import { Webmentions } from "@/components/Webmentions";
import { listForSlug as listWebmentions } from "@/lib/webmentions";
import { ReadingProgress } from "@/components/ReadingProgress";
import { ReadingMode } from "@/components/ReadingMode";
import { ShareButtons } from "@/components/ShareButtons";
import { BookmarkButton } from "@/components/BookmarkButton";
import { ReadLaterButton } from "@/components/ReadLaterButton";
import { SeriesBanner } from "@/components/SeriesBanner";
import { ReadTracker } from "@/components/ReadTracker";
import { ArticleTopAnnouncement } from "@/components/ArticleTopAnnouncement";
import { ArticleJsonLd } from "@/components/ArticleJsonLd";
import { siteConfig } from "@/lib/site-config";
import { getViewer } from "@/lib/viewer";
import { getViewCount } from "@/db/posts-stats";
import { isAiConfigured } from "@/lib/ai";

type Params = { slug: string };

/**
 * ISR — cache rendered HTML for 5 minutes, invalidate via revalidatePath
 * from admin save / publish-scheduled cron. This is the highest-volume
 * route on the site and was previously force-dynamic, hitting Postgres
 * for full content + adjacent + related + backlinks + webmentions on
 * every visit. Trade-offs:
 *   - Admin-only UI affordances (e.g. "manage comments on GitHub" deep
 *     link) won't appear in cached pages because auth() doesn't run
 *     during SSG. Admin can still use /admin/posts/[slug]/edit.
 *   - View counter is client-side via recordView, unaffected by ISR.
 *   - Private/draft posts: SSG renders them as 404; admin previewing
 *     them must use the admin route.
 */
export const revalidate = 300;

export async function generateStaticParams(): Promise<Params[]> {
  const slugs = await getAllPostSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata(
  props: { params: Promise<Params> },
): Promise<Metadata> {
  const { slug } = await props.params;
  const post = await getPostBySlug(slug);
  if (!post) return {};
  const description =
    post.frontmatter.description ?? post.frontmatter.summary ?? undefined;
  const canonical = `/posts/${slug}`;
  return {
    title: post.frontmatter.title,
    description,
    alternates: { canonical },
    openGraph: {
      title: post.frontmatter.title,
      description,
      type: "article",
      url: canonical,
      publishedTime: post.frontmatter.date,
      tags: post.frontmatter.tags,
    },
    twitter: {
      card: "summary_large_image",
      title: post.frontmatter.title,
      description,
    },
  };
}

export default async function PostPage(props: { params: Promise<Params> }) {
  const { slug } = await props.params;
  const viewer = await getViewer();
  const post = await getPostBySlug(slug, { isAdmin: viewer.isAdmin });
  if (!post) notFound();

  const { frontmatter, content } = post;
  const toc = extractTOC(content);
  const [viewCount, reactionCounts, adjacent, related, backlinks, webmentions] = await Promise.all([
    getViewCount(slug).catch(() => null),
    getReactionCounts(slug).catch(() => null),
    getAdjacentPosts(slug, { isAdmin: viewer.isAdmin }).catch(() => ({ prev: null, next: null })),
    getRelatedPosts(slug, frontmatter.tags ?? [], { isAdmin: viewer.isAdmin }).catch(() => []),
    getBacklinks(slug, { isAdmin: viewer.isAdmin }).catch(() => []),
    listWebmentions(slug).catch(() => []),
  ]);
  const aiConfigured = await isAiConfigured();
  const giscusRepo = process.env.NEXT_PUBLIC_GISCUS_REPO?.trim();
  const moderateUrl =
    viewer.isAdmin && giscusRepo
      ? `https://github.com/${giscusRepo}/discussions?discussions_q=${encodeURIComponent(`in:title /posts/${slug}`)}`
      : null;

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_260px] lg:gap-10">
      <ArticleJsonLd
        url={`${siteConfig.url}/posts/${slug}`}
        title={frontmatter.title}
        description={frontmatter.description ?? null}
        cover={frontmatter.cover ?? null}
        publishedAt={frontmatter.date}
        updatedAt={frontmatter.updatedDate}
        authorName={siteConfig.author.name}
        authorUrl={siteConfig.author.githubUrl}
        tags={frontmatter.tags ?? []}
      />
      <ReadingProgress />
      <ReadTracker slug={slug} />
      <article className="mx-auto w-full ">
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          <Link
            href="/posts"
            className="hv-action shrink-0 px-4 text-sm font-medium whitespace-nowrap"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">返回文章列表</span>
            <span className="sm:hidden">返回</span>
          </Link>
          <div className="flex items-center gap-1 overflow-x-auto">
            <ReadingMode />
            <BookmarkButton
              slug={slug}
              title={frontmatter.title}
              description={frontmatter.description}
            />
            <ReadLaterButton
              slug={slug}
              title={frontmatter.title}
              description={frontmatter.description}
            />
            <ShareButtons
              title={frontmatter.title}
              url={`${siteConfig.url}/posts/${slug}`}
            />
          </div>
        </div>
        <header className="hv-panel relative mt-5 overflow-hidden p-5 sm:p-7">
          <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          <p className="hv-kicker">Article node / reading chamber</p>
          <h1 className="hv-title mt-2 text-3xl font-black leading-tight sm:text-5xl">
            {frontmatter.title}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-sm text-muted">
            {frontmatter.visibility === "private" ? (
              <span className="hv-chip shrink-0 whitespace-nowrap border-accent-soft/30 bg-accent-soft/10 text-accent-soft">
                <LockKeyhole className="h-3 w-3" aria-hidden /> 私密
              </span>
            ) : null}
            {frontmatter.pinned ? (
              <span className="hv-chip hv-chip-strong shrink-0 whitespace-nowrap">
                <Pin className="h-3 w-3" aria-hidden /> 置顶
              </span>
            ) : null}
            <time className="shrink-0 whitespace-nowrap">{frontmatter.date}</time>
            {frontmatter.updatedDate &&
            frontmatter.updatedDate !== frontmatter.date ? (
              <span
                className="hv-chip shrink-0 whitespace-nowrap"
                title={`本文最后更新于 ${frontmatter.updatedDate}`}
              >
                <RefreshCcw className="h-3 w-3" aria-hidden /> 更新于 {frontmatter.updatedDate}
              </span>
            ) : null}
            {frontmatter.category ? (
              <span className="shrink-0">· {frontmatter.category}</span>
            ) : null}
            <span className="shrink-0">· {frontmatter.wordCount.toLocaleString()} 字 · {frontmatter.readingMinutes} 分钟</span>
            {viewCount !== null ? (
              <span className="shrink-0">· <ViewCounter slug={slug} initialCount={viewCount} /></span>
            ) : null}
            {frontmatter.tags?.length ? (
              <span className="flex flex-wrap items-center gap-1.5">
                <span>·</span>
                {frontmatter.tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/tags/${encodeURIComponent(tag)}`}
                    className="hv-chip shrink-0 whitespace-nowrap transition hover:border-border hover:text-foreground"
                  >
                    #{tag}
                  </Link>
                ))}
              </span>
            ) : null}
          </div>
          {frontmatter.description ? (
            <p className="mt-4  text-base leading-7 text-muted">
              {frontmatter.description}
            </p>
          ) : null}
        </header>
        <SeriesBanner post={post} />
        <ArticleTopAnnouncement />
        {frontmatter.summary ? (
          <aside className="hv-panel mt-8 p-4">
            <p className="hv-kicker mb-1">
              AI briefing
            </p>
            <p className="text-sm leading-7 text-muted">{frontmatter.summary}</p>
          </aside>
        ) : null}
        <div className="prose prose-zinc dark:prose-invert hv-prose mt-8 max-w-none">
          <MDXRemote
            source={content}
            components={mdxComponents}
            options={{
              mdxOptions: {
                remarkPlugins: [remarkGfm, remarkMath, remarkAlert, remarkMermaid, remarkVideoEmbed],
                rehypePlugins: [
                  rehypeSlug,
                  [
                    rehypeAutolinkHeadings,
                    { behavior: "wrap", properties: { className: ["heading-anchor"] } },
                  ],
                  rehypeKatex,
                  [
                    rehypeShiki,
                    {
                      themes: { light: "github-light", dark: "github-dark" },
                      transformers: [transformerCodeMeta],
                      langs: [
                        "ts",
                        "tsx",
                        "js",
                        "jsx",
                        "json",
                        "md",
                        "mdx",
                        "bash",
                        "sh",
                        "css",
                        "html",
                        "yaml",
                        "python",
                      ],
                    },
                  ],
                ],
              },
            }}
          />
        </div>
        {reactionCounts !== null ? (
          <div className="mt-12 flex flex-col items-center gap-3">
            <ReactionBar slug={slug} initialCounts={reactionCounts} />
            {siteConfig.donate.enabled ? (
              <Link
                href="/donate"
                className="hv-action min-h-8 px-3 text-xs"
              >
                <Coffee className="h-3.5 w-3.5" aria-hidden />
                觉得有用？请作者喝杯咖啡
                <ExternalLink className="h-3 w-3" aria-hidden />
              </Link>
            ) : null}
          </div>
        ) : null}
        <PostNav prev={adjacent.prev} next={adjacent.next} />
        <div className="mt-6 flex justify-center">
          <Link
            href="/posts/random"
            prefetch={false}
            className="hv-action px-4 text-sm"
          >
            <Dices className="h-4 w-4" aria-hidden />
            随机一篇
          </Link>
        </div>
        <RelatedPosts posts={related} />
        <Backlinks posts={backlinks} />
        <Webmentions items={webmentions} />
        {aiConfigured ? (
          <section className="mt-12">
            <AskAI slug={slug} />
          </section>
        ) : null}
        <section className="hv-panel mt-16 p-5 sm:p-6">
          <div className="mb-6 flex items-baseline justify-between gap-3">
            <h2 className="hv-title text-xl font-semibold tracking-normal">评论</h2>
            {moderateUrl ? (
              <a
                href={moderateUrl}
                target="_blank"
                rel="noreferrer noopener"
                title="GitHub Discussions 是评论真实存储地。点这里跳到对应 discussion 删评论"
                className="hv-action min-h-8 px-2.5 text-xs"
              >
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden /> 在 GitHub 管理
                <ExternalLink className="h-3 w-3" aria-hidden />
              </a>
            ) : null}
          </div>
          <Comments />
        </section>
      </article>
      <aside className="hidden lg:block">
        <div className="hv-panel sticky top-24 p-4">
          <TableOfContents items={toc} />
        </div>
      </aside>
    </div>
  );
}
