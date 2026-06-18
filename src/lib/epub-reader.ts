/**
 * Epub parsing utility — extracts chapters, metadata, and cover from an epub file.
 *
 * Uses JSZip directly instead of epubjs to avoid the `replacements()` bug where
 * `this.resources` is undefined for certain epub structures. This also reduces
 * memory usage since we don't create blob URLs for every resource.
 */

export interface EpubChapter {
  id: string;
  title: string;
  html: string;
  level: number;
  /** Original file path in the epub (e.g. "OEBPS/chapter1.xhtml") */
  href: string;
}

export interface EpubMeta {
  title: string;
  author: string;
  cover: string | null;
}

export interface EpubData {
  meta: EpubMeta;
  chapters: EpubChapter[];
}

/** Resolve a relative path against a base directory. */
function resolvePath(base: string, relative: string): string {
  if (relative.startsWith("/")) return relative.slice(1);
  const baseParts = base.split("/").slice(0, -1); // drop filename
  const relParts = relative.split("/");
  for (const part of relParts) {
    if (part === "..") baseParts.pop();
    else if (part !== ".") baseParts.push(part);
  }
  return baseParts.join("/");
}

/** Parse OPF XML to extract metadata, manifest, and spine. */
function parseOpf(xml: string, opfDir: string) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "application/xml");

  // Metadata
  const title = doc.querySelector("metadata title")?.textContent?.trim() || "未知书名";
  const creator = doc.querySelector("metadata creator")?.textContent?.trim() || "未知作者";

  // Manifest: id → { href, mediaType }
  const manifest = new Map<string, { href: string; mediaType: string }>();
  for (const item of doc.querySelectorAll("manifest item")) {
    const id = item.getAttribute("id");
    const href = item.getAttribute("href");
    const mediaType = item.getAttribute("media-type") || "";
    if (id && href) {
      manifest.set(id, { href: resolvePath(opfDir + "/", href), mediaType });
    }
  }

  // Spine: ordered list of idref
  const spine: string[] = [];
  for (const itemRef of doc.querySelectorAll("spine itemref")) {
    const idref = itemRef.getAttribute("idref");
    if (idref) spine.push(idref);
  }

  return { title, creator, manifest, spine };
}

/** Extract body innerHTML from an XHTML string. */
function extractBodyHtml(xhtml: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xhtml, "application/xhtml+xml");
  const body = doc.querySelector("body");
  if (!body) return "";
  return body.innerHTML || "";
}

/** Extract the media-type from manifest for a given href. */
function getMimeType(href: string): string {
  const ext = href.split(".").pop()?.toLowerCase() || "";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "gif") return "image/gif";
  if (ext === "svg") return "image/svg+xml";
  if (ext === "webp") return "image/webp";
  return "image/png";
}

/** Extract the first heading text from HTML. */
function extractTitle(html: string): string | null {
  const m = html.match(/<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>/i);
  if (!m) return null;
  // Strip inner tags
  return m[1].replace(/<[^>]+>/g, "").trim() || null;
}

export async function parseEpub(arrayBuffer: ArrayBuffer): Promise<EpubData> {
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(arrayBuffer);

  // 1. Find the OPF file from META-INF/container.xml
  const containerEntry = zip.file("META-INF/container.xml");
  if (!containerEntry) throw new Error("epub 缺少 container.xml");
  const containerXml = await containerEntry.async("text");
  const containerDoc = new DOMParser().parseFromString(containerXml, "application/xml");
  const rootFilePath = containerDoc.querySelector("rootfile")?.getAttribute("full-path");
  if (!rootFilePath) throw new Error("epub container.xml 缺少 rootfile");

  // 2. Parse the OPF file
  const opfEntry = zip.file(rootFilePath);
  if (!opfEntry) throw new Error(`epub 缺少 OPF 文件: ${rootFilePath}`);
  const opfXml = await opfEntry.async("text");
  const opfDir = rootFilePath.includes("/") ? rootFilePath.substring(0, rootFilePath.lastIndexOf("/")) : "";
  const { title, creator, manifest, spine } = parseOpf(opfXml, opfDir);

  // 3. Find cover image
  let cover: string | null = null;
  // Try meta cover
  const containerDoc2 = new DOMParser().parseFromString(opfXml, "application/xml");
  const coverId = containerDoc2.querySelector('meta[name="cover"]')?.getAttribute("content");
  if (coverId && manifest.has(coverId)) {
    const entry = zip.file(manifest.get(coverId)!.href);
    if (entry) {
      const blob = await entry.async("blob");
      cover = URL.createObjectURL(blob);
    }
  }
  // Fallback: first image with "cover" in the id or href
  if (!cover) {
    for (const [, item] of manifest) {
      if (item.mediaType.startsWith("image/") && /cover/i.test(item.href)) {
        const entry = zip.file(item.href);
        if (entry) {
          const blob = await entry.async("blob");
          cover = URL.createObjectURL(blob);
          break;
        }
      }
    }
  }

  // 4. Extract chapters from spine
  const chapters: EpubChapter[] = [];
  for (let i = 0; i < spine.length; i++) {
    const idref = spine[i];
    const manifestItem = manifest.get(idref);
    if (!manifestItem) continue;

    // Only process XHTML content documents
    const mt = manifestItem.mediaType;
    if (!mt.includes("html") && !mt.includes("xml") && !mt.includes("xhtml")) continue;

    const entry = zip.file(manifestItem.href);
    if (!entry) continue;

    try {
      const xhtml = await entry.async("text");
      let bodyHtml = extractBodyHtml(xhtml);
      if (bodyHtml.trim().length < 10) continue;

      // Resolve relative image src to base64 data URLs
      const imgDir = manifestItem.href.includes("/") ? manifestItem.href.substring(0, manifestItem.href.lastIndexOf("/") + 1) : "";
      const imgRegex = /src="([^"]+)"/g;
      let imgMatch: RegExpExecArray | null;
      const replacements: [string, string][] = [];
      while ((imgMatch = imgRegex.exec(bodyHtml)) !== null) {
        const src = imgMatch[1];
        if (src.startsWith("data:") || src.startsWith("http") || src.startsWith("blob:")) continue;
        const imgPath = resolvePath(imgDir, src);
        const imgFile = zip.file(imgPath);
        if (imgFile) {
          try {
            const base64 = await imgFile.async("base64");
            const mime = getMimeType(src);
            replacements.push([src, `data:${mime};base64,${base64}`]);
          } catch {
            // skip broken images
          }
        }
      }
      for (const [orig, dataUrl] of replacements) {
        bodyHtml = bodyHtml.replaceAll(`src="${orig}"`, `src="${dataUrl}"`);
      }

      const chapterTitle = extractTitle(bodyHtml) || `第 ${i + 1} 章`;

      chapters.push({
        id: `epub-ch-${i}`,
        title: chapterTitle,
        html: bodyHtml,
        level: 1,
        href: manifestItem.href,
      });
    } catch {
      // skip failed chapters
    }
  }

  return {
    meta: { title, author: creator, cover },
    chapters,
  };
}
