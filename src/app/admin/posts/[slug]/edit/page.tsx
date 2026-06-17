import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  PostEditor,
  type PostEditorInitial,
} from "@/components/admin/PostEditor";
import { BroadcastButton } from "@/components/admin/BroadcastButton";
import { SummaryPanel } from "@/components/admin/SummaryPanel";
import { AiWriterPanel } from "@/components/admin/AiWriterPanel";
import { AdminBackLink } from "@/components/admin/AdminBackLink";
import { getPostForEditing, type AdminPost } from "@/db/admin-posts";
import {
  deletePostAction,
  updatePostAction,
} from "@/app/admin/posts/actions";
import { countActiveSubscribers } from "@/lib/newsletter";

type Params = { slug: string };

function toLocalInputValue(date: Date | null): string {
  if (!date) return "";
  const tz = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tz).toISOString().slice(0, 16);
}

function postRowToInitial(row: AdminPost): PostEditorInitial {
  return {
    slug: row.slug,
    title: row.title,
    description: row.description ?? "",
    content: row.content,
    category: row.category ?? "",
    tags: (row.tags ?? []).join(", "),
    cover: row.cover ?? "",
    pinned: row.pinned,
    status: row.status,
    visibility: row.visibility,
    series: row.series ?? "",
    seriesOrder: row.seriesOrder !== null && row.seriesOrder !== undefined
      ? String(row.seriesOrder)
      : "",
    publishAt: toLocalInputValue(row.publishAt),
  };
}

export async function generateMetadata(props: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await props.params;
  const post = await getPostForEditing(slug);
  return {
    title: post ? `编辑 · ${post.title}` : "编辑文章",
    robots: { index: false, follow: false },
  };
}

export default async function EditPostPage(props: {
  params: Promise<Params>;
}) {
  const { slug } = await props.params;
  const post = await getPostForEditing(slug);
  if (!post) notFound();

  const initial = postRowToInitial(post);
  const subscriberCount = await countActiveSubscribers();

  const updateBound = updatePostAction.bind(null, slug);
  const deleteBound = deletePostAction.bind(null, slug);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <AdminBackLink href="/admin/posts" label="文章列表" />
          <h1 className="text-2xl font-bold tracking-tight">编辑文章</h1>
        </div>
        <Link
          href={`/posts/${slug}`}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex items-center gap-1 text-xs text-muted hover:text-accent"
        >
          线上预览 ↗
        </Link>
      </header>
      <BroadcastButton
        slug={slug}
        status={post.status}
        notifiedAt={post.notifiedAt}
        subscriberCount={subscriberCount}
      />
      <SummaryPanel slug={slug} initialSummary={post.summary} />
      <AiWriterPanel />
      <PostEditor
        mode="edit"
        initial={initial}
        onSubmit={updateBound}
        onDelete={deleteBound}
      />
    </div>
  );
}
