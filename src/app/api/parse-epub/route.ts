/**
 * POST /api/parse-epub — server-side epub parsing for large files.
 * Accepts multipart/form-data with an epub file, returns parsed
 * chapters + metadata as JSON. No auth required (public tool).
 */

import { NextResponse } from "next/server";
import JSZip from "jszip";
import { rateLimit } from "@/lib/rate-limit";
import { sanitizeHtml } from "@/lib/sanitize-html";

export const runtime = "nodejs";
export const maxDuration = 60; // 60s timeout for large files

const MAX_SIZE = 50 * 1024 * 1024; // 50MB server-side limit

interface EpubChapter {
  id: string;
  title: string;
  html: string;
  level: number;
}

export async function POST(request: Request) {
  // Rate limit: 10 per minute per IP
  const rl = await rateLimit("parse-epub", { key: "parse-epub", limit: 10, windowSec: 60 });
  if (!rl.ok) {
    return NextResponse.json({ error: "解析请求过于频繁" }, { status: 429 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "无效的请求" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "请上传 epub 文件" }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: `文件过大 (${(file.size / 1024 / 1024).toFixed(1)}MB)，上限 50MB` }, { status: 400 });
  }

  if (!file.name.endsWith(".epub")) {
    return NextResponse.json({ error: "仅支持 .epub 格式" }, { status: 400 });
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);

    // 1. Find and parse the OPF file (container.xml → *.opf)
    const containerXml = await zip.file("META-INF/container.xml")?.async("text");
    if (!containerXml) {
      return NextResponse.json({ error: "无效的 epub 文件：缺少 container.xml" }, { status: 400 });
    }

    const opfPathMatch = containerXml.match(/full-path="([^"]+)"/);
    if (!opfPathMatch) {
      return NextResponse.json({ error: "无效的 epub 文件：找不到 OPF 路径" }, { status: 400 });
    }

    const opfPath = opfPathMatch[1];
    const opfDir = opfPath.includes("/") ? opfPath.substring(0, opfPath.lastIndexOf("/") + 1) : "";
    const opfText = await zip.file(opfPath)?.async("text");
    if (!opfText) {
      return NextResponse.json({ error: "无效的 epub 文件：找不到 OPF 文件" }, { status: 400 });
    }

    // 2. Extract metadata
    const titleMatch = opfText.match(/<dc:title[^>]*>([^<]+)<\/dc:title>/);
    const authorMatch = opfText.match(/<dc:creator[^>]*>([^<]+)<\/dc:creator>/);
    const meta = {
      title: titleMatch?.[1]?.trim() || file.name.replace(/\.epub$/i, ""),
      author: authorMatch?.[1]?.trim() || "未知作者",
    };

    // 3. Find spine order (reading order)
    const spineItemRefs: string[] = [];
    const spineRegex = /<itemref\s+idref="([^"]+)"/g;
    let spineMatch;
    while ((spineMatch = spineRegex.exec(opfText)) !== null) {
      spineItemRefs.push(spineMatch[1]);
    }

    // 4. Build manifest: id → href mapping
    const manifest: Record<string, string> = {};
    const manifestRegex = /<item\s+[^>]*id="([^"]+)"[^>]*href="([^"]+)"/g;
    let manifestMatch;
    while ((manifestMatch = manifestRegex.exec(opfText)) !== null) {
      manifest[manifestMatch[1]] = manifestMatch[2];
    }

    // 5. Extract chapters in spine order
    const chapters: EpubChapter[] = [];
    const allHtmlParts: string[] = [];

    for (let i = 0; i < spineItemRefs.length; i++) {
      const ref = spineItemRefs[i];
      const href = manifest[ref];
      if (!href) continue;

      const fullPath = opfDir + href;
      const fileEntry = zip.file(fullPath);
      if (!fileEntry) continue;

      try {
        const html = await fileEntry.async("text");
        if (!html || html.trim().length < 20) continue;

        // Extract title from <title> tag or first heading
        let chapterTitle = `第 ${i + 1} 章`;
        const titleTag = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        const h1Tag = html.match(/<h[1-4][^>]*>([^<]+)<\/h[1-4]>/i);
        if (h1Tag?.[1]) chapterTitle = h1Tag[1].trim();
        else if (titleTag?.[1]) chapterTitle = titleTag[1].trim();

        // Extract body content (strip <html>, <head>, <body> tags)
        let body = html;
        const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
        if (bodyMatch) body = bodyMatch[1];

        // Rewrite relative image URLs to data URLs (extract from zip)
        const imgRegex = /src="([^"]+)"/g;
        let imgMatch;
        const imageReplacements: [string, string][] = [];
        while ((imgMatch = imgRegex.exec(body)) !== null) {
          const imgSrc = imgMatch[1];
          if (imgSrc.startsWith("data:") || imgSrc.startsWith("http")) continue;
          const imgPath = opfDir + href.replace(/[^/]*$/, "") + imgSrc;
          const imgFile = zip.file(imgPath) || zip.file(opfDir + imgSrc);
          if (imgFile) {
            try {
              const base64 = await imgFile.async("base64");
              const ext = imgSrc.split(".").pop()?.toLowerCase() || "png";
              const mime = ext === "jpg" || ext === "jpeg" ? "image/jpeg" : ext === "gif" ? "image/gif" : ext === "svg" ? "image/svg+xml" : "image/png";
              imageReplacements.push([imgSrc, `data:${mime};base64,${base64}`]);
            } catch {
              // skip broken images
            }
          }
        }
        for (const [orig, dataUrl] of imageReplacements) {
          body = body.replaceAll(`src="${orig}"`, `src="${dataUrl}"`);
        }

        // Sanitize to strip <script>, event handlers, etc.
        body = sanitizeHtml(body);

        chapters.push({ id: `epub-ch-${i}`, title: chapterTitle, html: body, level: 1 });
        allHtmlParts.push(`<section data-chapter="${i}" data-line="${i}"><h1>${chapterTitle}</h1>${body}</section>`);
      } catch {
        // skip failed chapters
      }
    }

    if (chapters.length === 0) {
      return NextResponse.json({ error: "epub 中没有找到可解析的章节" }, { status: 400 });
    }

    const fullHtml = sanitizeHtml(allHtmlParts.join("\n<hr class='epub-divider' />\n"));

    return NextResponse.json({
      meta,
      chapters,
      fullHtml,
    });
  } catch (e) {
    console.error("[parse-epub]", e);
    return NextResponse.json({ error: "epub 解析失败：" + (e instanceof Error ? e.message : "未知错误") }, { status: 500 });
  }
}
