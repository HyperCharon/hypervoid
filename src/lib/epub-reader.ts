/**
 * Epub parsing utility — extracts chapters, metadata, and cover from an epub file.
 * Uses epubjs for parsing, returns a simple structure the reader can consume.
 *
 * Limitations: epubjs loads the entire epub into memory. Files > 200MB may fail
 * on mobile devices with limited memory. The caller (ReaderShell) enforces the
 * size limit via EPUB_CLIENT_LIMIT.
 */

export interface EpubChapter {
  id: string;
  title: string;
  html: string;
  level: number;
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

export async function parseEpub(arrayBuffer: ArrayBuffer): Promise<EpubData> {
  const ePub = (await import("epubjs")).default;
  const book = ePub(arrayBuffer);
  const b = book as any;

  // Wait for book to be ready with a timeout
  await Promise.race([
    b.ready,
    new Promise((_, reject) => setTimeout(() => reject(new Error("epub 解析超时")), 30000)),
  ]);

  // Extract metadata
  const meta: EpubMeta = {
    title: (b.packaging?.metadata?.title as string) || "未知书名",
    author: (b.packaging?.metadata?.creator as string) || "未知作者",
    cover: null,
  };

  // Try to get cover image
  try {
    const coverUrl = await b.cover?.url?.();
    if (coverUrl) {
      const resp = await fetch(coverUrl);
      const blob = await resp.blob();
      meta.cover = URL.createObjectURL(blob);
    }
  } catch {
    // no cover — ignore
  }

  // Extract chapters from spine
  const chapters: EpubChapter[] = [];

  const spine = b.spine;
  const spineItems = spine?.items || spine?.spineItems || [];

  for (let i = 0; i < spineItems.length; i++) {
    const item = spineItems[i];
    try {
      const doc = await Promise.race([
        item.load(b.load.bind(b)),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000)),
      ]);

      if (!doc) continue; // timeout — skip this chapter

      const body = doc?.body || doc?.querySelector?.("body");
      if (!body) continue;

      // Extract title from headings
      const headings = body.querySelectorAll("h1, h2, h3, h4");
      let chapterTitle = headings.length > 0
        ? (headings[0].textContent || "").trim()
        : `第 ${i + 1} 章`;
      if (!chapterTitle) chapterTitle = `第 ${i + 1} 章`;

      const html = body.innerHTML || "";
      if (html.trim().length < 10) continue;

      chapters.push({
        id: `epub-ch-${i}`,
        title: chapterTitle,
        html,
        level: 1,
      });
    } catch {
      // skip failed chapters
    }
  }

  // Cleanup
  try { b.destroy(); } catch {}

  return {
    meta,
    chapters,
  };
}
