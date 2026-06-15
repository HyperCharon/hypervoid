/**
 * One-shot script: import .md files as blog posts.
 * Usage: pnpm tsx scripts/import-md-files.ts <file1.md> [file2.md ...]
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import { basename } from "node:path";
import matter from "gray-matter";
import { createPost } from "../src/db/admin-posts";

async function main() {
  const files = process.argv.slice(2);
  if (files.length === 0) {
    console.error("Usage: pnpm tsx scripts/import-md-files.ts <file.md> ...");
    process.exit(1);
  }

  for (const filePath of files) {
    const stem = basename(filePath).replace(/\.md$/i, "");
    const slug = stem
      .toLowerCase()
      .replace(/[\s_]+/g, "-")
      .replace(/[^a-z0-9一-鿿-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    if (!slug) {
      console.error(`[SKIP] Cannot generate slug from: ${filePath}`);
      continue;
    }

    const text = readFileSync(filePath, "utf-8");
    let parsed;
    try {
      parsed = matter(text);
    } catch {
      console.error(`[SKIP] Cannot parse frontmatter: ${filePath}`);
      continue;
    }

    const title = (parsed.data.title as string) || stem;
    const tags = Array.isArray(parsed.data.tags)
      ? parsed.data.tags.map(String)
      : typeof parsed.data.tags === "string"
        ? parsed.data.tags.split(",").map((t: string) => t.trim()).filter(Boolean)
        : [];

    try {
      await createPost({
        slug,
        title,
        content: parsed.content.trim() || " ",
        description: (parsed.data.description as string) || null,
        tags,
        status: "draft",
        visibility: "public",
        publishAt: null,
        cover: (parsed.data.cover as string) || null,
        pinned: parsed.data.pinned === true,
        series: (parsed.data.series as string) || null,
        seriesOrder:
          typeof parsed.data.seriesOrder === "number"
            ? parsed.data.seriesOrder
            : null,
      });
      console.log(`[OK] ${slug} — "${title}"`);
    } catch (e) {
      const msg = (e as Error).message;
      if (msg.includes("duplicate key")) {
        console.error(`[SKIP] Slug already exists: ${slug}`);
      } else {
        console.error(`[ERR] ${slug}: ${msg.slice(0, 120)}`);
      }
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
