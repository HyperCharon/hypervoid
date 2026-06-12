"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { requireAdmin, requireAdminAiQuota } from "@/auth";
import {
  bulkDelete,
  bulkSetPinned,
  bulkSetStatus,
  bulkSetVisibility,
  clearSummary,
  createPost,
  deletePost,
  getPostForEditing,
  setSummary,
  updatePost,
  type AdminPostInput,
} from "@/db/admin-posts";
import { broadcastPost } from "@/lib/newsletter";
import {
  generateOutline,
  generateTldr,
  isAiConfigured,
  polishText,
  suggestTags,
  suggestTitles,
  summarizePost,
} from "@/lib/ai";
import { getAllTags } from "@/lib/posts";
import { recordAudit } from "@/lib/audit";

async function requireAuth() {
  await requireAdmin();
}

/**
 * Fire-and-forget AI summary generation for a freshly written/edited post.
 * Only runs when:
 *   - AI is configured (ANTHROPIC_API_KEY set)
 *   - The post is published
 *   - The post currently has no summary (preserves manual overrides)
 *   - Content is long enough to make summarization meaningful
 * Errors are swallowed — the editor never blocks waiting for this.
 */
async function autoSummarize(
  slug: string,
  title: string,
  content: string,
  status: AdminPostInput["status"],
  hasExistingSummary: boolean,
): Promise<void> {
  if (status !== "published") return;
  if (hasExistingSummary) return;
  if (!(await isAiConfigured())) return;
  if (content.trim().length < 200) return;
  try {
    const summary = await summarizePost({ title, content });
    await setSummary(slug, summary);
    revalidatePath(`/posts/${slug}`);
    revalidatePath(`/admin/posts/${slug}/edit`);
  } catch (e) {
    console.error("[auto-summary]", slug, e);
  }
}

function parseStatus(value: string): AdminPostInput["status"] {
  if (value === "published" || value === "scheduled" || value === "draft") {
    return value;
  }
  return "draft";
}

function parseVisibility(value: string): AdminPostInput["visibility"] {
  return value === "private" ? "private" : "public";
}

function parseFormToInput(formData: FormData): {
  slug: string;
  input: Omit<AdminPostInput, "slug">;
} {
  const slug = String(formData.get("slug") ?? "").trim();
  const status = parseStatus(String(formData.get("status") ?? "draft"));
  const visibility = parseVisibility(
    String(formData.get("visibility") ?? "public"),
  );
  const publishAtStr = String(formData.get("publishAt") ?? "").trim();
  const tagsStr = String(formData.get("tags") ?? "").trim();
  const tags = tagsStr
    ? tagsStr
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : [];
  const pinnedRaw = formData.get("pinned");
  const pinned = pinnedRaw === "on" || pinnedRaw === "true";

  const publishAt =
    status === "scheduled" && publishAtStr
      ? new Date(publishAtStr)
      : status === "published"
        ? new Date()
        : null;

  const description = String(formData.get("description") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const cover = String(formData.get("cover") ?? "").trim();
  const series = String(formData.get("series") ?? "").trim();
  const seriesOrderRaw = String(formData.get("seriesOrder") ?? "").trim();
  const seriesOrder =
    series && seriesOrderRaw && !Number.isNaN(Number(seriesOrderRaw))
      ? Number(seriesOrderRaw)
      : null;

  return {
    slug,
    input: {
      title: String(formData.get("title") ?? "").trim() || "Untitled",
      description: description || null,
      content: String(formData.get("content") ?? ""),
      category: category || null,
      tags,
      cover: cover || null,
      pinned,
      status,
      visibility,
      series: series || null,
      seriesOrder,
      publishAt,
    },
  };
}

export async function createPostAction(formData: FormData) {
  await requireAuth();
  const { slug, input } = parseFormToInput(formData);
  if (!slug) throw new Error("slug is required");
  if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
    throw new Error("slug 必须是小写字母、数字、连字符");
  }

  const existing = await getPostForEditing(slug);
  if (existing) {
    throw new Error(`slug "${slug}" 已存在`);
  }

  await createPost({ slug, ...input });
  await recordAudit({
    action: "post.create",
    targetType: "post",
    targetId: slug,
    details: { title: input.title, status: input.status, visibility: input.visibility },
  });
  revalidatePath("/posts");
  revalidatePath("/tags");
  revalidatePath("/");
  revalidatePath(`/posts/${slug}`);
  updateTag("posts");
  after(() => autoSummarize(slug, input.title, input.content, input.status, false));
  redirect(`/admin/posts/${slug}/edit`);
}

export async function updatePostAction(originalSlug: string, formData: FormData) {
  await requireAuth();
  const { input } = parseFormToInput(formData);

  const existing = await getPostForEditing(originalSlug);
  const hadSummary = !!existing?.summary;

  await updatePost(originalSlug, input);
  await recordAudit({
    action: "post.update",
    targetType: "post",
    targetId: originalSlug,
    details: { title: input.title, status: input.status, visibility: input.visibility },
  });
  revalidatePath("/posts");
  revalidatePath("/tags");
  revalidatePath("/");
  revalidatePath(`/posts/${originalSlug}`);
  revalidatePath(`/admin/posts/${originalSlug}/edit`);
  updateTag("posts");
  after(() =>
    autoSummarize(originalSlug, input.title, input.content, input.status, hadSummary),
  );
}

export async function deletePostAction(slug: string) {
  await requireAuth();
  await deletePost(slug);
  await recordAudit({
    action: "post.delete",
    targetType: "post",
    targetId: slug,
  });
  revalidatePath("/posts");
  revalidatePath("/tags");
  revalidatePath("/");
  revalidatePath(`/posts/${slug}`);
  updateTag("posts");
  redirect("/admin/posts");
}

export type BulkOp =
  | "publish"
  | "draft"
  | "set-public"
  | "set-private"
  | "pin"
  | "unpin"
  | "delete";

export async function bulkAction(
  slugs: string[],
  op: BulkOp,
): Promise<{ affected: number }> {
  await requireAuth();
  if (slugs.length === 0) return { affected: 0 };
  let affected = 0;
  switch (op) {
    case "publish":
      affected = await bulkSetStatus(slugs, "published", new Date());
      break;
    case "draft":
      affected = await bulkSetStatus(slugs, "draft", null);
      break;
    case "set-public":
      affected = await bulkSetVisibility(slugs, "public");
      break;
    case "set-private":
      affected = await bulkSetVisibility(slugs, "private");
      break;
    case "pin":
      affected = await bulkSetPinned(slugs, true);
      break;
    case "unpin":
      affected = await bulkSetPinned(slugs, false);
      break;
    case "delete":
      affected = await bulkDelete(slugs);
      break;
  }
  await recordAudit({
    action: `post.bulk.${op}`,
    targetType: "post",
    details: { slugs, affected },
  });
  revalidatePath("/posts");
  revalidatePath("/tags");
  revalidatePath("/");
  revalidatePath("/admin/posts");
  updateTag("posts");
  return { affected };
}

export async function broadcastPostAction(
  slug: string,
): Promise<{ sent: number; failed: number; errors: string[]; alreadyNotified: boolean }> {
  await requireAuth();
  return broadcastPost(slug);
}

export async function generateSummaryAction(
  slug: string,
): Promise<{ summary: string } | { error: string }> {
  await requireAdminAiQuota();
  if (!(await isAiConfigured())) {
    return { error: "AI 未配置：当前模型未配置可用 API Key" };
  }
  const post = await getPostForEditing(slug);
  if (!post) return { error: "文章不存在" };
  try {
    const summary = await summarizePost({
      title: post.title,
      content: post.content,
    });
    await setSummary(slug, summary);
    revalidatePath(`/posts/${slug}`);
    revalidatePath(`/admin/posts/${slug}/edit`);
    return { summary };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function clearSummaryAction(slug: string): Promise<void> {
  await requireAuth();
  await clearSummary(slug);
  revalidatePath(`/posts/${slug}`);
  revalidatePath(`/admin/posts/${slug}/edit`);
}

export async function suggestTagsAction(args: {
  title: string;
  content: string;
}): Promise<{ tags: string[] } | { error: string }> {
  await requireAdminAiQuota();
  if (!(await isAiConfigured())) {
    return { error: "AI 未配置：当前模型未配置可用 API Key" };
  }
  if (!args.content.trim()) {
    return { error: "正文为空，先写点东西再让 AI 建议标签" };
  }
  try {
    const existing = await getAllTags({ isAdmin: true });
    const tags = await suggestTags({
      title: args.title || "Untitled",
      content: args.content,
      existingTags: existing.map((t) => t.tag),
    });
    return { tags };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function generateOutlineAction(args: {
  title: string;
  content: string;
}): Promise<{ outline: string } | { error: string }> {
  await requireAdminAiQuota();
  if (!(await isAiConfigured())) return { error: "AI 未配置" };
  if (!args.title.trim()) return { error: "需要标题才能生成大纲" };
  try {
    const outline = await generateOutline({
      title: args.title,
      content: args.content,
    });
    return { outline };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function polishTextAction(
  text: string,
): Promise<{ text: string } | { error: string }> {
  await requireAdminAiQuota();
  if (!(await isAiConfigured())) return { error: "AI 未配置" };
  const trimmed = text.trim();
  if (!trimmed) return { error: "请先选中或粘贴一段文字" };
  if (trimmed.length > 4000) return { error: "段落太长（>4000 字），请分段" };
  try {
    const out = await polishText(trimmed);
    return { text: out };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function suggestTitlesAction(args: {
  title: string;
  content: string;
}): Promise<{ titles: string[] } | { error: string }> {
  await requireAdminAiQuota();
  if (!(await isAiConfigured())) return { error: "AI 未配置" };
  if (!args.content.trim()) return { error: "正文为空，无法建议标题" };
  try {
    const titles = await suggestTitles({
      currentTitle: args.title,
      content: args.content,
    });
    return { titles };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function generateTldrAction(args: {
  title: string;
  content: string;
}): Promise<{ tldr: string } | { error: string }> {
  await requireAdminAiQuota();
  if (!(await isAiConfigured())) return { error: "AI 未配置" };
  if (!args.content.trim()) return { error: "正文为空" };
  try {
    const tldr = await generateTldr({
      title: args.title || "Untitled",
      content: args.content,
    });
    return { tldr };
  } catch (e) {
    return { error: (e as Error).message };
  }
}
