/**
 * Epub parsing utility — extracts chapters, metadata, and cover from an epub file.
 * Uses epubjs for parsing, returns a simple structure the reader can consume.
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
  fullHtml: string;
}

export async function parseEpub(arrayBuffer: ArrayBuffer): Promise<EpubData> {
  const ePub = (await import("epubjs")).default;
  const book = ePub(arrayBuffer);
  // epubjs types are incomplete — use any for internal access
  const b = book as any;

  await b.ready;

  // Extract metadata
  const meta: EpubMeta = {
    title: (b.packaging?.metadata?.title as string) || "未知书名",
    author: (b.packaging?.metadata?.creator as string) || "未知作者",
    cover: null,
  };

  // Try to get cover image
  try {
    const coverUrl = await b.cover?.url();
    if (coverUrl) {
      const resp = await fetch(coverUrl);
      const blob = await resp.blob();
      meta.cover = URL.createObjectURL(blob);
    }
  } catch {
    // no cover
  }

  // Extract chapters from spine
  const chapters: EpubChapter[] = [];
  const allHtmlParts: string[] = [];

  const spine = b.spine;
  const spineItems = spine?.items || spine?.spineItems || [];

  for (let i = 0; i < spineItems.length; i++) {
    const item = spineItems[i];
    try {
      const doc = await item.load(b.load.bind(b));
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

      allHtmlParts.push(`<section data-chapter="${i}" data-line="${i}"><h1>${chapterTitle}</h1>${html}</section>`);
    } catch {
      // skip failed chapters
    }
  }

  // Cleanup
  try { b.destroy(); } catch {}

  return {
    meta,
    chapters,
    fullHtml: allHtmlParts.join("\n<hr class='epub-divider' />\n"),
  };
}
