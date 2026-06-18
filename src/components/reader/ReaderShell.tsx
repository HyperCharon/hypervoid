"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { sanitizeHtml } from "@/lib/sanitize-html";
import {
  BookOpen,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  FileText,
  FolderOpen,
  List,
  Maximize2,
  Minimize2,
  Moon,
  Plus,
  Search,
  Settings,
  Sun,
  Upload,
  X,
  Zap,
  BookMarked,
} from "lucide-react";
import { useTheme } from "next-themes";
import { saveBookContent, loadBookContent, saveChapters, loadChapters, deleteBookData, saveChapterHtml, saveAllChapterHtmls, loadChapterHtml } from "@/lib/reader-storage";

/* ── Types ───────────────────────────────────────────────── */

type ReaderMode = "quick" | "novel";

interface Chapter {
  id: string;
  title: string;
  level: number;
  startLine: number; // for md: line number, for epub: chapter index
}

interface BookMeta {
  id: string;
  name: string;
  size: number;
  addedAt: number;
  lastReadAt?: number;
  scrollPercent?: number;
  mode?: ReaderMode;
  isEpub?: boolean;
  author?: string;
  cover?: string | null;
}

interface BookmarkEntry {
  id: string;
  label: string;
  scrollTop: number;
  createdAt: number;
}

interface ReaderSettings {
  fontSize: number;
  lineHeight: number;
  theme: "normal" | "sepia" | "eye-care";
  maxWidth: number;
  tocOpen: boolean;
}

const DEFAULT_SETTINGS: ReaderSettings = {
  fontSize: 17,
  lineHeight: 1.8,
  theme: "normal",
  maxWidth: 860,
  tocOpen: true,
};

/* ── Storage keys ────────────────────────────────────────── */

const K_LIBRARY = "hv-reader-library";
const K_CONTENT = "hv-reader-book-";
const K_POSITION = "hv-reader-pos-";
const K_SETTINGS = "hv-reader-settings";
const K_BOOKMARKS = "hv-reader-bm-";
const K_MODE = "hv-reader-mode";

/* ── Helpers ─────────────────────────────────────────────── */

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function fmtSize(b: number): string {
  if (b < 1024) return b + " B";
  if (b < 1024 * 1024) return (b / 1024).toFixed(1) + " KB";
  return (b / (1024 * 1024)).toFixed(1) + " MB";
}

function estimateMin(text: string): number {
  const cjk = (text.match(/[一-鿿㐀-䶿]/g) || []).length;
  const words = text.replace(/[一-鿿㐀-䶿]/g, "").trim().split(/\s+/).filter(Boolean).length;
  return Math.ceil(cjk / 400 + words / 200);
}

function extractMdChapters(text: string): Chapter[] {
  const ch: Chapter[] = [];
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^(#{1,4})\s+(.+)/);
    if (m) ch.push({ id: "ch-" + i, title: m[2].replace(/[*_`~\[\]]/g, "").trim(), level: m[1].length, startLine: i });
  }
  return ch;
}

/* ── Markdown renderer (lazy) ────────────────────────────── */

let mdFn: ((s: string) => string | Promise<string>) | null = null;

async function renderMd(src: string): Promise<string> {
  if (!mdFn) {
    const { marked } = await import("marked");
    marked.setOptions({ gfm: true, breaks: false });
    const r = new marked.Renderer();
    r.code = ({ text, lang }: { text: string; lang?: string }) => {
      const esc = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      const lbl = lang ? ` data-lang="${lang}"` : "";
      return `<div class="mcode"><div class="mcode-hd"${lbl}><span>${lang || "code"}</span></div><pre><code>${esc}</code></pre></div>`;
    };
    r.codespan = ({ text }: { text: string }) => {
      const esc = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      return `<code>${esc}</code>`;
    };
    marked.use({ renderer: r });
    mdFn = (s) => { const r = marked(s); return typeof r === "string" ? r : r; };
  }
  let html = await mdFn(src);
  let off = 0;
  html = html.replace(/<h([1-4])([^>]*)>/g, (match, lv, attrs) => {
    const re = new RegExp(`^#{${lv}}\\s+`, "gm"); re.lastIndex = off;
    const m = re.exec(src);
    if (m) { const ln = src.substring(0, m.index).split("\n").length - 1; off = m.index + 1; return `<h${lv}${attrs} data-line="${ln}">`; }
    return match;
  });
  return html;
}

/* ── Epub parser (lazy) ──────────────────────────────────── */

// Client-side epub parsing limit — browser can handle 200MB+ with epubjs
const EPUB_CLIENT_LIMIT = 200 * 1024 * 1024;

async function parseEpubFile(file: File): Promise<{ meta: { title: string; author: string; cover: string | null }; chapters: { id: string; title: string; level: number; html: string }[] }> {
  if (file.size > EPUB_CLIENT_LIMIT) {
    throw new Error(`文件过大 (${fmtSize(file.size)})，上限 ${fmtSize(EPUB_CLIENT_LIMIT)}。`);
  }
  const { parseEpub } = await import("@/lib/epub-reader");
  const buf = await file.arrayBuffer();
  const data = await parseEpub(buf);
  return { meta: { title: data.meta.title, author: data.meta.author, cover: data.meta.cover }, chapters: data.chapters };
}

/**
 * Renders large text files (>5MB) as plain text using textContent.
 * Avoids expensive HTML escaping and sanitization on huge content.
 */
function LargeTextView({ content }: { content: string }) {
  const ref = useRef<HTMLPreElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.textContent = content;
  }, [content]);
  return (
    <pre
      ref={ref}
      className="whitespace-pre-wrap break-words font-mono text-sm leading-relaxed"
      style={{ fontFamily: "inherit" }}
    />
  );
}

/**
 * Renders a single epub chapter. Uses DOMParser for safe HTML parsing
 * instead of regex-based sanitization which can miss edge cases.
 */
function EpubChapterView({ html }: { html: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    // Parse with DOMParser — much safer than innerHTML with regex cleanup
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    // Remove all script, style, link elements
    doc.querySelectorAll("script, style, link").forEach(el => el.remove());
    // Neutralize all links (prevent navigation/fetches)
    doc.querySelectorAll("a").forEach(a => {
      a.removeAttribute("href");
      a.removeAttribute("onclick");
    });
    // Remove event handlers from all elements
    doc.querySelectorAll("*").forEach(el => {
      for (const attr of Array.from(el.attributes)) {
        if (attr.name.startsWith("on")) el.removeAttribute(attr.name);
      }
    });
    // Clear srcset to prevent extra fetches
    doc.querySelectorAll("[srcset]").forEach(el => el.removeAttribute("srcset"));
    ref.current.textContent = "";
    ref.current.appendChild(doc.body);
  }, [html]);
  return <div ref={ref} className="hv-prose max-w-none epub-content" />;
}


/* ── Main Component ──────────────────────────────────────── */

export function ReaderShell({ isAdmin = false }: { isAdmin?: boolean } = {}) {
  const { resolvedTheme, setTheme } = useTheme();

  // State
  const [mode, setMode] = useState<ReaderMode>("novel");
  const [library, setLibrary] = useState<BookMeta[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [rawContent, setRawContent] = useState("");
  const [htmlContent, setHtmlContent] = useState("");
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [settings, setSettings] = useState<ReaderSettings>(DEFAULT_SETTINGS);
  const [bookmarks, setBookmarks] = useState<BookmarkEntry[]>([]);
  const [scrollPct, setScrollPct] = useState(0);
  const [curChTitle, setCurChTitle] = useState<string | null>(null);
  const [curChIdx, setCurChIdx] = useState(-1);
  const [tocOpen, setTocOpen] = useState(false);
  const [bmOpen, setBmOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [currentChapterHtml, setCurrentChapterHtml] = useState("");

  const contentRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const isDark = resolvedTheme !== "light";
  const isQuick = mode === "quick";
  const activeBook = library.find(b => b.id === activeId);
  const isEpubActive = activeBook?.isEpub === true;

  // ── Load persisted state ──
  useEffect(() => {
    try {
      const lib = localStorage.getItem(K_LIBRARY);
      if (lib) setLibrary(JSON.parse(lib));
      const st = localStorage.getItem(K_SETTINGS);
      if (st) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(st) });
      const md = localStorage.getItem(K_MODE) as ReaderMode | null;
      if (md === "quick" || md === "novel") setMode(md);
    } catch {}
  }, []);

  // ── Save settings/mode/library ──
  useEffect(() => { try { localStorage.setItem(K_SETTINGS, JSON.stringify(settings)); } catch {} }, [settings]);
  useEffect(() => { try { localStorage.setItem(K_LIBRARY, JSON.stringify(library)); } catch {} }, [library]);
  useEffect(() => { try { localStorage.setItem(K_MODE, mode); } catch {} }, [mode]);

  // ── Load book content (async — may come from IndexedDB) ──
  useEffect(() => {
    if (!activeId) { setRawContent(""); setHtmlContent(""); setCurrentChapterHtml(""); setChapters([]); return; }
    setLoading(true);
    let cancelled = false;

    (async () => {
      try {
        const book = library.find(b => b.id === activeId);

        if (book?.isEpub) {
          // Epub: try per-chapter storage first, fall back to old monolithic format
          const chData = loadChapters(activeId);
          const chapterList = (chData ?? []) as Chapter[];
          if (cancelled) return;

          if (chapterList.length === 0) {
            // No chapter metadata — book data is missing or corrupt
            setCurrentChapterHtml("");
            setChapters([]);
            setLoading(false);
            return;
          }

          setChapters(chapterList);
          setRawContent("");

          // Restore saved chapter index (or start at 0)
          const savedIdx = localStorage.getItem(K_POSITION + activeId);
          const idx = savedIdx ? Math.min(parseInt(savedIdx, 10) || 0, chapterList.length - 1) : 0;
          setCurrentChapterIndex(idx);

          // Try per-chapter storage first (new format)
          let chHtml = await Promise.race([
            loadChapterHtml(activeId, idx),
            new Promise<null>((resolve) => setTimeout(() => resolve(null), 10000)),
          ]);
          console.log(`[epub] initial loadChapterHtml(${idx}): ${chHtml ? chHtml.length + ' chars' : 'null'}, chapters: ${chapterList.length}`);

          // Fallback: old monolithic format (fullHtml stored as one string)
          if (!chHtml) {
            const fullHtml = await Promise.race([
              loadBookContent(activeId),
              new Promise<null>((resolve) => setTimeout(() => resolve(null), 15000)),
            ]);
            if (cancelled) return;
            if (fullHtml) {
              // Split old format by <hr class='epub-divider' /> or <section data-chapter=
              const parts = fullHtml.split(/<hr\s+class=['"]epub-divider['"]\s*\/?>/i);
              const sectionRe = /<section\s+data-chapter="(\d+)"[^>]*>/;
              chHtml = parts[idx] ?? parts[0] ?? "";
              // Extract just the section content (strip the outer section wrapper)
              const m = chHtml.match(sectionRe);
              if (m) {
                const start = chHtml.indexOf(">") + 1;
                const end = chHtml.lastIndexOf("</section>");
                if (end > start) chHtml = chHtml.substring(start, end);
              }
            }
          }

          if (cancelled) return;
          setCurrentChapterHtml(chHtml ?? "");
          setHtmlContent(""); // not used for epub
          setLoading(false);
        } else {
          // Non-epub: load full content from storage
          const content = await Promise.race([
            loadBookContent(activeId),
            new Promise<null>((resolve) => setTimeout(() => resolve(null), 30000)),
          ]);
          if (cancelled) return;
          if (!content) { setLoading(false); return; }
          setRawContent(content);
          setChapters([]);
          // Large text files (>5MB): skip markdown rendering, display as plain text
          const LARGE_TEXT = 5 * 1024 * 1024;
          if (content.length > LARGE_TEXT) {
            setChapters([]);
            // For large files, use a marker that the render logic recognizes
            // to display via <pre> + textContent (avoids expensive HTML escaping)
            if (!cancelled) { setHtmlContent("__LARGE_TEXT__"); setLoading(false); }
          } else {
            setChapters(extractMdChapters(content));
            try {
              const h = await Promise.race([
                renderMd(content),
                new Promise<string>((_, reject) => setTimeout(() => reject(new Error("渲染超时")), 10000)),
              ]);
              if (!cancelled) { setHtmlContent(h); setLoading(false); }
            } catch {
              if (!cancelled) {
                setHtmlContent(`<pre style="white-space:pre-wrap">${content.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</pre>`);
                setLoading(false);
              }
            }
          }
        }

        // Restore scroll position (non-epub only; epub uses chapter index)
        if (!book?.isEpub) {
          const pos = localStorage.getItem(K_POSITION + activeId);
          if (pos && contentRef.current) {
            requestAnimationFrame(() => { if (contentRef.current) contentRef.current.scrollTop = parseFloat(pos); });
          }
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [activeId]);

  // ── Bookmarks ──
  useEffect(() => {
    if (!activeId) { setBookmarks([]); return; }
    try { const s = localStorage.getItem(K_BOOKMARKS + activeId); setBookmarks(s ? JSON.parse(s) : []); } catch { setBookmarks([]); }
  }, [activeId]);

  const saveBms = useCallback((bms: BookmarkEntry[]) => {
    if (!activeId) return;
    setBookmarks(bms);
    try { localStorage.setItem(K_BOOKMARKS + activeId, JSON.stringify(bms)); } catch {}
  }, [activeId]);

  // ── Scroll tracking ──
  const onScroll = useCallback(() => {
    if (!activeId || !contentRef.current) return;
    const el = contentRef.current;
    const pct = el.scrollHeight > el.clientHeight ? el.scrollTop / (el.scrollHeight - el.clientHeight) : 0;
    setScrollPct(Math.round(pct * 100));
    try {
      if (isEpubActive) {
        // For epub: save chapter index as the "position"
        localStorage.setItem(K_POSITION + activeId, String(currentChapterIndex));
      } else {
        localStorage.setItem(K_POSITION + activeId, String(el.scrollTop));
      }
      setLibrary(p => p.map(b => b.id === activeId ? { ...b, lastReadAt: Date.now(), scrollPercent: Math.round(pct * 100) } : b));
    } catch {}
    // Current chapter
    for (let i = chapters.length - 1; i >= 0; i--) {
      const heading = el.querySelector(`[data-line="${chapters[i].startLine}"]`);
      if (heading instanceof HTMLElement && heading.offsetTop <= el.scrollTop + 60) {
        setCurChTitle(chapters[i].title); setCurChIdx(i); return;
      }
    }
    setCurChTitle(null); setCurChIdx(-1);
  }, [activeId, chapters]);

  // ── Chapter navigation ──
  const scrollToCh = useCallback((ch: Chapter) => {
    if (!contentRef.current) return;
    const el = contentRef.current.querySelector(`[data-line="${ch.startLine}"]`);
    if (el instanceof HTMLElement) contentRef.current.scrollTo({ top: el.offsetTop - 16, behavior: "smooth" });
  }, []);

  // Load a specific epub chapter from IndexedDB (with old-format fallback)
  const loadEpubChapter = useCallback(async (idx: number) => {
    if (!activeId || idx < 0 || idx >= chapters.length) return;
    setCurrentChapterIndex(idx);
    setCurrentChapterHtml("");
    setLoading(true);
    try {
      let chHtml = await Promise.race([
        loadChapterHtml(activeId, idx),
        new Promise<null>((r) => setTimeout(() => r(null), 10000)),
      ]);
      console.log(`[epub] loadChapterHtml(${idx}): ${chHtml ? chHtml.length + ' chars' : 'null'}`);

      // Fallback: old monolithic format
      if (!chHtml) {
        const fullHtml = await Promise.race([
          loadBookContent(activeId),
          new Promise<null>((r) => setTimeout(() => r(null), 15000)),
        ]);
        if (fullHtml) {
          const parts = fullHtml.split(/<hr\s+class=['"]epub-divider['"]\s*\/?>/i);
          chHtml = parts[idx] ?? parts[0] ?? "";
          const sectionRe = /<section\s+data-chapter="(\d+)"[^>]*>/;
          const m = chHtml.match(sectionRe);
          if (m) {
            const start = chHtml.indexOf(">") + 1;
            const end = chHtml.lastIndexOf("</section>");
            if (end > start) chHtml = chHtml.substring(start, end);
          }
        }
      }

      setCurrentChapterHtml(chHtml ?? "");
    } catch {
      setCurrentChapterHtml("");
    }
    setLoading(false);
    // Save chapter index as position
    try { localStorage.setItem(K_POSITION + activeId, String(idx)); } catch {}
    // Scroll to top
    contentRef.current?.scrollTo(0, 0);
  }, [activeId, chapters.length]);

  const navCh = useCallback((dir: number) => {
    if (chapters.length === 0) return;
    if (isEpubActive) {
      // Epub: switch chapter (loads from IndexedDB)
      const idx = Math.max(0, Math.min(chapters.length - 1, currentChapterIndex + dir));
      loadEpubChapter(idx);
    } else {
      // Non-epub: scroll to heading in the same page
      const idx = Math.max(0, Math.min(chapters.length - 1, curChIdx + dir));
      scrollToCh(chapters[idx]);
    }
  }, [chapters, curChIdx, scrollToCh, isEpubActive, currentChapterIndex, loadEpubChapter]);

  // ── File import ──
  const [importError, setImportError] = useState<string | null>(null);

  const importFiles = useCallback(async (files: FileList | File[]) => {
    setImportError(null);
    const newBooks: BookMeta[] = [];
    const errors: string[] = [];
    for (const file of Array.from(files)) {
      const isEpub = /\.epub$/i.test(file.name);
      const isText = /\.(md|markdown|txt|text|html|htm)$/i.test(file.name);
      if (!isEpub && !isText) continue;
      if (isEpub && !isAdmin) {
        errors.push(`${file.name}: epub 格式仅管理员可用`);
        continue;
      }

      const id = uid();

      if (isEpub) {
        try {
          const data = await parseEpubFile(file);
          console.log(`[epub] parsed ${data.chapters.length} chapters, saving...`);
          // Save chapter metadata to localStorage
          const chapterMeta = data.chapters.map((ch, i) => ({ id: ch.id, title: ch.title, level: ch.level, startLine: i }));
          saveChapters(id, chapterMeta);
          // Save all chapter HTML in a single IndexedDB transaction (fast + reliable)
          await saveAllChapterHtmls(id, data.chapters);
          console.log(`[epub] saved ${data.chapters.length} chapters to IndexedDB`);
          const meta: BookMeta = {
            id, name: data.meta.title || file.name.replace(/\.epub$/i, ""), size: file.size,
            addedAt: Date.now(), isEpub: true, mode: "novel",
            author: data.meta.author, cover: data.meta.cover,
          };
          newBooks.push(meta);
        } catch (e) {
          errors.push(`${file.name}: ${e instanceof Error ? e.message : "解析失败"}`);
        }
      } else {
        try {
          const text = await file.text();
          await saveBookContent(id, text);
          newBooks.push({
            id, name: file.name.replace(/\.[^.]+$/, ""), size: file.size,
            addedAt: Date.now(), mode: "quick",
          });
        } catch (e) {
          errors.push(`${file.name}: ${e instanceof Error ? e.message : "保存失败"}`);
        }
      }
    }
    if (newBooks.length > 0) {
      setLibrary(p => [...p, ...newBooks]);
      setActiveId(newBooks[newBooks.length - 1].id);
    }
    if (errors.length > 0) {
      setImportError(errors.join("; "));
    }
  }, []);

  // ── Delete book ──
  const deleteBook = useCallback(async (id: string) => {
    await deleteBookData(id);
    setLibrary(p => p.filter(b => b.id !== id));
    if (activeId === id) { setActiveId(null); setRawContent(""); setHtmlContent(""); setCurrentChapterHtml(""); setCurrentChapterIndex(0); setChapters([]); }
  }, [activeId]);

  // ── Add bookmark ──
  const addBm = useCallback(() => {
    if (!activeId || !contentRef.current) return;
    const st = contentRef.current.scrollTop;
    let label = "书签 " + (bookmarks.length + 1);
    for (let i = chapters.length - 1; i >= 0; i--) {
      const el = contentRef.current.querySelector(`[data-line="${chapters[i].startLine}"]`);
      if (el instanceof HTMLElement && el.offsetTop <= st + 60) { label = chapters[i].title; break; }
    }
    saveBms([...bookmarks, { id: uid(), label, scrollTop: st, createdAt: Date.now() }]);
  }, [activeId, bookmarks, chapters, saveBms]);

  // ── Search highlight ──
  const highlighted = useMemo(() => {
    if (!searchQ.trim() || !htmlContent) return htmlContent;
    try { return htmlContent.replace(new RegExp(`(${searchQ.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"), '<mark class="hv-search-hl">$1</mark>'); } catch { return htmlContent; }
  }, [htmlContent, searchQ]);

  // ── Keyboard shortcuts (novel mode) ──
  useEffect(() => {
    if (isQuick || !activeId) return;
    const h = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "f" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); setSearchOpen(true); setTimeout(() => searchRef.current?.focus(), 50); }
      if (e.key === "Escape") { setSearchOpen(false); setSettingsOpen(false); setBmOpen(false); setTocOpen(false); }
      if (e.key === "[") navCh(-1);
      if (e.key === "]") navCh(1);
      if (e.key === "b") addBm();
      if (contentRef.current) {
        const pg = contentRef.current.clientHeight * 0.85;
        if (e.key === "PageDown") { e.preventDefault(); contentRef.current.scrollBy({ top: pg, behavior: "smooth" }); }
        if (e.key === "PageUp") { e.preventDefault(); contentRef.current.scrollBy({ top: -pg, behavior: "smooth" }); }
        if (e.key === " ") { e.preventDefault(); contentRef.current.scrollBy({ top: pg, behavior: "smooth" }); }
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [isQuick, activeId, navCh, addBm]);

  // ── Theme classes ──
  const themeCls = settings.theme === "sepia"
    ? "bg-[#f8f0e3] text-[#5b4636] dark:bg-[#2b2520] dark:text-[#e3d3b8]"
    : settings.theme === "eye-care"
      ? "bg-[#cce8cf] text-[#1a3a1a] dark:bg-[#1a2e1a] dark:text-[#c8e0c8]"
      : "bg-background text-foreground";

  /* ══════════════════════════════════════════════════════════
     EMPTY STATE: mode selector + library
     ══════════════════════════════════════════════════════════ */

  if (!activeId) {
    return (
      <div className="mx-auto flex min-h-[80vh] max-w-4xl flex-col items-center gap-6 px-4 py-8 sm:p-6">
        <header className="text-center">
          <p className="hv-kicker">Reader / lightweight viewer</p>
          <h1 className="hv-title mt-2 flex items-center justify-center gap-3 text-3xl font-black sm:text-4xl">
            <BookOpen className="h-8 w-8 text-muted" aria-hidden />
            阅读器
          </h1>
        </header>

        {/* Mode switcher — novel mode is admin-only */}
        {isAdmin && (
        <div className="flex gap-2">
          {([["quick", Zap, "快速阅读", ".md / .txt"], ["novel", BookMarked, "小说模式", ".epub / .txt / .md"]] as const).map(([m, Icon, label, ext]) => (
            <button key={m} type="button" onClick={() => setMode(m)}
              className={`flex items-center gap-2 rounded-xl border px-5 py-3 text-sm font-medium transition ${mode === m ? "border-accent bg-accent/10 text-accent" : "border-border bg-card text-muted hover:border-accent/30 hover:text-foreground"}`}>
              <Icon className="h-4 w-4" aria-hidden />
              <div className="text-left">
                <p>{label}</p>
                <p className="text-[10px] text-muted-soft">{ext}</p>
              </div>
            </button>
          ))}
        </div>
        )}

        {/* Import error */}
        {importError && (
          <div className="w-full max-w-lg rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
            {importError}
          </div>
        )}

        {/* Features */}
        <div className="grid w-full max-w-lg grid-cols-2 gap-2 sm:grid-cols-4">
          {(isQuick || !isAdmin
            ? [{ l: "Markdown", d: "完整渲染" }, { l: "目录导航", d: "标题提取" }, { l: "进度记忆", d: "自动保存" }, { l: "字号调节", d: "A- / A+" }]
            : [{ l: "Epub 支持", d: "章节解析" }, { l: "书签标记", d: "按 B 添加" }, { l: "阅读主题", d: "默认/护眼/绿底" }, { l: "全文搜索", d: "Ctrl+F 搜索" }]
          ).map(f => (
            <div key={f.l} className="rounded-lg border border-border bg-card/50 p-3 text-center">
              <p className="text-xs font-medium text-foreground">{f.l}</p>
              <p className="mt-0.5 text-[10px] text-muted-soft">{f.d}</p>
            </div>
          ))}
        </div>

        {/* Drop zone */}
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); importFiles(e.dataTransfer.files); }}
          onClick={() => fileRef.current?.click()}
          className={`flex w-full max-w-lg cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed p-6 text-center transition sm:gap-4 sm:p-10 ${dragOver ? "border-accent/55 bg-accent/10" : "border-border hover:border-accent/40 hover:bg-card/50"}`}
        >
          <Upload className="h-10 w-10 text-muted" aria-hidden />
          <div>
            <p className="font-medium text-foreground">拖拽文件到此处</p>
            <p className="mt-1 text-xs text-muted">
              {isQuick || !isAdmin ? "支持 .md / .txt / .html 格式" : "支持 .epub (≤200MB) / .md / .txt / .html 格式"}
            </p>
          </div>
          <button type="button" className="hv-action px-4 py-2 text-sm font-medium">
            <FileText className="h-4 w-4" aria-hidden /> 选择文件
          </button>
          <input ref={fileRef} type="file" accept={isQuick || !isAdmin ? ".md,.markdown,.txt,.text,.html,.htm" : ".epub,.md,.markdown,.txt,.text,.html,.htm"} multiple hidden onChange={e => importFiles(e.target.files || [])} />
        </div>

        {/* Library */}
        {library.length > 0 && (
          <div className="w-full max-w-lg">
            <div className="mb-3 flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-muted" aria-hidden />
              <h2 className="text-sm font-semibold text-foreground">书库 <span className="ml-2 font-mono text-xs text-muted">{library.length}</span></h2>
            </div>
            <div className="flex flex-col gap-2">
              {library.sort((a, b) => (b.lastReadAt || b.addedAt) - (a.lastReadAt || a.addedAt)).map(book => (
                <div key={book.id} className="hv-panel group flex items-center gap-3 p-3">
                  <button type="button" onClick={() => { if (book.mode) setMode(book.mode); setActiveId(book.id); }}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left">
                    {book.cover ? (
                      <img src={book.cover} alt="" className="h-12 w-9 shrink-0 rounded object-cover" />
                    ) : (
                      <div className="grid h-12 w-9 shrink-0 place-items-center rounded border border-border bg-card text-muted">
                        {book.isEpub ? <BookMarked className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{book.name}</p>
                      <p className="mt-0.5 text-[11px] text-muted-soft">
                        {book.author ? book.author + " · " : ""}{fmtSize(book.size)}
                        {book.scrollPercent != null && book.scrollPercent > 0 ? ` · 已读 ${book.scrollPercent}%` : ""}
                        {book.isEpub ? " · EPUB" : ""}
                      </p>
                    </div>
                  </button>
                  <button type="button" onClick={() => deleteBook(book.id)}
                    className="hidden shrink-0 p-1 text-muted-soft hover:text-red-400 group-hover:block" title="移除">
                    <X className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════
     READING STATE
     ══════════════════════════════════════════════════════════ */

  return (
    <div className={`relative flex flex-col ${fullscreen ? "fixed inset-0 z-50" : ""} ${isQuick ? themeCls : themeCls}`}
      style={fullscreen ? undefined : { height: "calc(100svh - 4rem)", minHeight: "calc(100vh - 4rem)" }}
      onDragOver={e => { if (e.dataTransfer.types.includes("Files")) { e.preventDefault(); setDragOver(true); } }}
      onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver(false); }}
      onDrop={e => { e.preventDefault(); setDragOver(false); importFiles(e.dataTransfer.files); }}>

      {/* ── Toolbar ── */}
      <div className="flex shrink-0 items-center gap-0.5 border-b border-border px-1.5 py-1 sm:px-3 sm:py-1.5">
        <button type="button" onClick={() => setActiveId(null)} className="rdr-btn-text shrink-0" title="返回书库">
          <ChevronLeft className="h-4 w-4" /><span className="hidden sm:inline">书库</span>
        </button>

        <div className="mx-0.5 min-w-0 flex-1 truncate sm:mx-1">
          <span className="text-xs font-medium sm:text-sm">{activeBook?.name || "阅读中"}</span>
          {curChTitle && chapters.length > 1 && (
            <span className="ml-1.5 hidden max-w-[200px] truncate text-xs text-muted lg:inline">{curChTitle}</span>
          )}
        </div>

        {/* Quick mode: minimal controls */}
        {isQuick ? (
          <>
            <div className="flex items-center gap-0.5">
              <button type="button" onClick={() => setSettings(s => ({ ...s, fontSize: Math.max(12, s.fontSize - 1) }))} className="rdr-btn text-xs font-bold">A-</button>
              <span className="w-5 text-center font-mono text-[10px] text-muted">{settings.fontSize}</span>
              <button type="button" onClick={() => setSettings(s => ({ ...s, fontSize: Math.min(28, s.fontSize + 1) }))} className="rdr-btn text-sm font-bold">A+</button>
            </div>
            <button type="button" onClick={() => setTheme(isDark ? "light" : "dark")} className="rdr-btn">
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            {chapters.length > 0 && (
              <button type="button" onClick={() => setTocOpen(true)} className="rdr-btn"><List className="h-4 w-4" /></button>
            )}
          </>
        ) : (
          <>
            {/* Novel mode: full controls */}
            <span className="hidden shrink-0 text-[11px] text-muted-soft xl:inline">
              {rawContent.length > 0 && `${rawContent.length.toLocaleString()} 字 · ~${estimateMin(rawContent)} 分钟`}
            </span>
            <div className="hidden items-center gap-0.5 sm:flex">
              <button type="button" onClick={() => setSettings(s => ({ ...s, fontSize: Math.max(12, s.fontSize - 1) }))} className="rdr-btn text-xs font-bold">A</button>
              <span className="w-5 text-center font-mono text-[10px] text-muted">{settings.fontSize}</span>
              <button type="button" onClick={() => setSettings(s => ({ ...s, fontSize: Math.min(28, s.fontSize + 1) }))} className="rdr-btn text-sm font-bold">A</button>
            </div>
            <button type="button" onClick={() => { setSearchOpen(!searchOpen); setSearchQ(""); }} className={`rdr-btn ${searchOpen ? "active" : ""}`} title="搜索">
              <Search className="h-4 w-4" />
            </button>
            <button type="button" onClick={addBm} className="rdr-btn" title="书签"><Bookmark className="h-4 w-4" /></button>
            {bookmarks.length > 0 && (
              <button type="button" onClick={() => setBmOpen(!bmOpen)} className={`rdr-btn hidden sm:inline-flex ${bmOpen ? "active" : ""}`} title={`书签 (${bookmarks.length})`}>
                <span className="text-[10px] font-bold">{bookmarks.length}</span>
              </button>
            )}
            {chapters.length > 0 && (
              <>
                <button type="button" onClick={() => setTocOpen(!tocOpen)} className={`rdr-btn lg:hidden ${tocOpen ? "active" : ""}`} title="目录">
                  <List className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => setSettings(s => ({ ...s, tocOpen: !s.tocOpen }))} className={`rdr-btn hidden lg:inline-flex ${settings.tocOpen ? "active" : ""}`} title="目录侧栏">
                  <List className="h-4 w-4" />
                </button>
              </>
            )}
            <button type="button" onClick={() => setSettingsOpen(!settingsOpen)} className={`rdr-btn ${settingsOpen ? "active" : ""}`} title="设置">
              <Settings className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => setFullscreen(!fullscreen)} className="rdr-btn hidden sm:inline-flex" title="全屏">
              {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
          </>
        )}
      </div>

      {/* ── Search bar (novel only) ── */}
      {!isQuick && searchOpen && (
        <div className="flex shrink-0 items-center gap-2 border-b border-border bg-card/50 px-3 py-2">
          <Search className="h-4 w-4 text-muted" />
          <input ref={searchRef} type="text" value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="搜索当前文档…" className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-soft" />
          {searchQ && <button type="button" onClick={() => setSearchQ("")} className="text-muted hover:text-foreground"><X className="h-4 w-4" /></button>}
        </div>
      )}

      {/* ── Settings panel (novel only) ── */}
      {!isQuick && settingsOpen && (
        <div className="shrink-0 border-b border-border bg-card/80 p-3 backdrop-blur">
          <div className="mx-auto flex max-w-4xl flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-5 sm:gap-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted">字号</span>
              <button type="button" onClick={() => setSettings(s => ({ ...s, fontSize: Math.max(12, s.fontSize - 1) }))} className="rdr-btn text-xs font-bold sm:hidden">A-</button>
              <input type="range" min={12} max={28} value={settings.fontSize} onChange={e => setSettings(s => ({ ...s, fontSize: +e.target.value }))} className="accent-accent flex-1 sm:w-28 sm:flex-none" />
              <button type="button" onClick={() => setSettings(s => ({ ...s, fontSize: Math.min(28, s.fontSize + 1) }))} className="rdr-btn text-sm font-bold sm:hidden">A+</button>
              <span className="w-6 font-mono text-xs">{settings.fontSize}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted">行高</span>
              <input type="range" min={14} max={24} value={settings.lineHeight * 10} onChange={e => setSettings(s => ({ ...s, lineHeight: +e.target.value / 10 }))} className="accent-accent flex-1 sm:w-28 sm:flex-none" />
              <span className="w-6 font-mono text-xs">{settings.lineHeight.toFixed(1)}</span>
            </div>
            <label className="hidden items-center gap-2 sm:flex">
              <span className="text-xs text-muted">宽度</span>
              <input type="range" min={520} max={1100} step={40} value={settings.maxWidth} onChange={e => setSettings(s => ({ ...s, maxWidth: +e.target.value }))} className="accent-accent w-28" />
              <span className="w-10 font-mono text-xs">{settings.maxWidth}px</span>
            </label>
            <div className="flex items-center gap-1">
              {(["normal", "sepia", "eye-care"] as const).map(t => (
                <button key={t} type="button" onClick={() => setSettings(s => ({ ...s, theme: t }))}
                  className={`rounded-md px-2.5 py-1.5 text-xs transition ${settings.theme === t ? "bg-accent/15 text-accent" : "text-muted hover:text-foreground"}`}>
                  {t === "normal" ? "默认" : t === "sepia" ? "护眼" : "绿底"}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Progress bar ── */}
      <div className="relative h-0.5 shrink-0 bg-border">
        <div className="h-full bg-accent transition-[width] duration-200" style={{ width: `${scrollPct}%` }} />
        <span className="absolute right-2 top-1 font-mono text-[10px] text-muted-soft">{scrollPct}%</span>
      </div>

      {/* ── Bookmarks panel (novel only) ── */}
      {!isQuick && bmOpen && bookmarks.length > 0 && (
        <div className="shrink-0 border-b border-border bg-card/80 p-3 backdrop-blur">
          <div className="mx-auto max-w-3xl">
            <p className="mb-2 font-mono text-[11px] uppercase tracking-wider text-muted-soft">书签</p>
            <div className="flex flex-wrap gap-2">
              {bookmarks.map(bm => (
                <button key={bm.id} type="button" onClick={() => contentRef.current?.scrollTo({ top: bm.scrollTop, behavior: "smooth" })}
                  className="group flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1 text-xs text-muted transition hover:border-accent/40 hover:text-foreground">
                  <Bookmark className="h-3 w-3" />{bm.label}
                  <span role="button" tabIndex={0} onClick={e => { e.stopPropagation(); saveBms(bookmarks.filter(b => b.id !== bm.id)); }}
                    className="ml-0.5 hidden text-muted-soft hover:text-red-400 group-hover:inline"><X className="h-3 w-3" /></span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Mobile TOC drawer ── */}
      {tocOpen && chapters.length > 0 && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setTocOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 max-h-[60vh] overflow-y-auto rounded-t-2xl border-t border-border bg-background p-4">
            <p className="mb-3 font-mono text-[11px] uppercase tracking-wider text-muted-soft">目录</p>
            <nav className="flex flex-col gap-0.5">
              {chapters.map((ch, i) => (
                <button key={ch.id} type="button" onClick={() => {
                  if (isEpubActive) { loadEpubChapter(i); } else { scrollToCh(ch); }
                  setTocOpen(false);
                }}
                  className={`truncate rounded px-3 py-2.5 text-left text-sm transition ${i === (isEpubActive ? currentChapterIndex : curChIdx) ? "bg-accent/10 font-semibold text-accent" : "text-muted hover:bg-card-hover hover:text-foreground"}`}
                  style={{ paddingLeft: (ch.level - 1) * 16 + 12 }}>{ch.title}</button>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* ── Main content ── */}
      <div className="flex min-h-0 flex-1">
        {/* TOC sidebar (novel mode, desktop) */}
        {!isQuick && settings.tocOpen && chapters.length > 0 && (
          <aside className="hidden w-64 shrink-0 overflow-y-auto border-r border-border p-3 lg:block scrollbar-thin">
            <p className="mb-2 font-mono text-[11px] uppercase tracking-wider text-muted-soft">目录</p>
            <nav className="flex flex-col gap-0.5">
              {chapters.map((ch, i) => (
                <button key={ch.id} type="button" onClick={() => {
                  if (isEpubActive) { loadEpubChapter(i); } else { scrollToCh(ch); }
                }}
                  className={`truncate rounded px-2 py-1.5 text-left text-xs transition ${i === (isEpubActive ? currentChapterIndex : curChIdx) ? "bg-accent/10 font-semibold text-accent" : "text-muted hover:bg-card hover:text-foreground"}`}
                  style={{ paddingLeft: (ch.level - 1) * 14 + 8 }}
                  ref={el => { if (i === (isEpubActive ? currentChapterIndex : curChIdx) && el) el.scrollIntoView({ block: "nearest", behavior: "smooth" }); }}>
                  {ch.title}
                </button>
              ))}
            </nav>
          </aside>
        )}

        {/* Content */}
        <div ref={contentRef} onScroll={onScroll} className="flex-1 overflow-y-auto overscroll-contain">
          <div className={`${isQuick ? "px-4 py-5" : "reader-content mx-auto px-3 py-5 sm:px-8 sm:py-8"}`}
            style={{ fontSize: settings.fontSize, lineHeight: isQuick ? 1.8 : settings.lineHeight, ...(isQuick ? {} : { maxWidth: settings.maxWidth }) }}>
            {loading ? (
              <p className="py-20 text-center text-sm text-muted">渲染中…</p>
            ) : isEpubActive ? (
              // Epub: render current chapter HTML (lightweight sanitize, no DOMPurify)
              currentChapterHtml ? (
                <EpubChapterView html={currentChapterHtml} />
              ) : (
                <p className="py-20 text-center text-sm text-muted">无法加载内容</p>
              )
            ) : htmlContent === "__LARGE_TEXT__" ? (
              <LargeTextView content={rawContent} />
            ) : htmlContent ? (
              <div className="hv-prose max-w-none" dangerouslySetInnerHTML={{ __html: sanitizeHtml(highlighted) }} />
            ) : (
              <p className="py-20 text-center text-sm text-muted">无法加载内容</p>
            )}
          </div>

          {/* Bottom nav */}
          <div className="flex items-center justify-between border-t border-border px-4 py-4 sm:px-8">
            {chapters.length > 1 ? (
              <>
                <button type="button" onClick={() => navCh(-1)} disabled={isEpubActive && currentChapterIndex === 0}
                  className="flex h-10 items-center gap-1 rounded-md px-3 text-xs text-muted transition hover:text-foreground disabled:opacity-30">
                  <ChevronLeft className="h-3.5 w-3.5" /> {isEpubActive ? "上一章" : "上一章"}
                </button>
                {isEpubActive ? (
                  <span className="text-xs text-muted">{currentChapterIndex + 1} / {chapters.length}</span>
                ) : (
                  <button type="button" onClick={() => contentRef.current?.scrollTo({ top: 0, behavior: "smooth" })} className="text-xs text-muted hover:text-foreground">顶部</button>
                )}
                <button type="button" onClick={() => navCh(1)} disabled={isEpubActive && currentChapterIndex >= chapters.length - 1}
                  className="flex h-10 items-center gap-1 rounded-md px-3 text-xs text-muted transition hover:text-foreground disabled:opacity-30">
                  下一章 <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </>
            ) : (
              <button type="button" onClick={() => contentRef.current?.scrollTo({ top: 0, behavior: "smooth" })} className="mx-auto text-xs text-muted hover:text-foreground">回到顶部</button>
            )}
          </div>
        </div>
      </div>

      {/* ── Drag overlay ── */}
      {dragOver && (
        <div className="pointer-events-none absolute inset-4 z-30 flex items-center justify-center rounded-2xl border-2 border-dashed border-accent/55 bg-accent/10 backdrop-blur-sm">
          <div className="text-center">
            <Plus className="mx-auto h-10 w-10 text-accent" /><p className="mt-2 text-sm font-medium text-accent">松开以导入</p>
          </div>
        </div>
      )}

      <input ref={fileRef} type="file" accept={isQuick || !isAdmin ? ".md,.markdown,.txt,.text,.html,.htm" : ".epub,.md,.markdown,.txt,.text,.html,.htm"} multiple hidden onChange={e => importFiles(e.target.files || [])} />
    </div>
  );
}
