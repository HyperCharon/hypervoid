/**
 * POST /api/admin/import — import .md files as posts (admin only).
 */
import { requireAdmin } from "@/auth";
import { createPost } from "@/db/admin-posts";
import { rateLimit } from "@/lib/rate-limit";
import matter from "gray-matter";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_FILE_BYTES = 2 * 1024 * 1024; // 2MB per file
const MAX_FILES = 20;

export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await rateLimit("admin", { key: "admin:import", limit: 5, windowSec: 60 });
  if (!rl.ok) return Response.json({ error: "导入过于频繁，请稍后再试" }, { status: 429 });

  const formData = await request.formData();
  const files = formData.getAll("files").filter((f): f is File => f instanceof File);

  if (files.length === 0) {
    return Response.json({ error: "请上传 .md 文件" }, { status: 400 });
  }
  if (files.length > MAX_FILES) {
    return Response.json({ error: `一次最多导入 ${MAX_FILES} 个文件` }, { status: 400 });
  }

  const results: { slug: string; title: string; ok: boolean; error?: string }[] = [];

  for (const file of files) {
    const stem = file.name.replace(/\.md$/i, "");
    const slug = stem
      .toLowerCase()
      .replace(/[\s_]+/g, "-")
      .replace(/[^a-z0-9一-鿿-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    if (!slug) {
      results.push({ slug: file.name, title: file.name, ok: false, error: "无法生成有效的 slug" });
      continue;
    }

    if (file.size > MAX_FILE_BYTES) {
      results.push({ slug, title: file.name, ok: false, error: "文件超过 2MB" });
      continue;
    }

    const text = await file.text();
    let parsed;
    try {
      parsed = matter(text);
    } catch {
      results.push({ slug, title: file.name, ok: false, error: "无法解析 frontmatter" });
      continue;
    }

    const title = (parsed.data.title as string) || stem;
    const tags = Array.isArray(parsed.data.tags)
      ? parsed.data.tags.map(String)
      : typeof parsed.data.tags === "string"
        ? parsed.data.tags.split(",").map((t: string) => t.trim()).filter(Boolean)
        : [];
    const description = (parsed.data.description as string) || undefined;

    try {
      await createPost({
        slug,
        title,
        content: parsed.content.trim() || " ",
        description,
        tags,
        status: "draft",
        visibility: "public",
        publishAt: null,
        cover: parsed.data.cover as string | undefined,
        pinned: parsed.data.pinned === true,
        series: (parsed.data.series as string) || undefined,
        seriesOrder: typeof parsed.data.seriesOrder === "number" ? parsed.data.seriesOrder : undefined,
      });
      results.push({ slug, title, ok: true });
    } catch (e) {
      const msg = (e as Error).message.includes("duplicate key")
        ? "slug 已存在"
        : (e as Error).message.slice(0, 100);
      results.push({ slug, title, ok: false, error: msg });
    }
  }

  const imported = results.filter((r) => r.ok).length;

  return Response.json({ imported, total: files.length, results });
}
