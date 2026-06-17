"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
} from "lucide-react";

/* ── Types ───────────────────────────────────────────────── */

interface Chapter {
  id: string;
  title: string;
  level: number;
  startLine: number;
}

interface BookMeta {
  id: string;
  name: string;
  size: number;
  addedAt: number;
  lastReadAt?: number;
  scrollPercent?: number;
}

interface Bookmark {
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

const STORAGE_KEY_SETTINGS = "hv-reader-settings";
const STORAGE_KEY_LIBRARY = "hv-reader-library";
const STORAGE_KEY_CONTENT_PREFIX = "hv-reader-book-";
const STORAGE_KEY_POSITION_PREFIX = "hv-reader-pos-";
const MAX_CONTENT_SIZE = 2 * 1024 * 1024; // 2MB per book

/* ── Helpers ─────────────────────────────────────────────── */

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function estimateReadingTime(text: string): number {
  // Chinese: ~400 chars/min, English: ~200 words/min
  const cjk = (text.match(/[一-鿿㐀-䶿]/g) || []).length;
  const nonCjk = text.replace(/[一-鿿㐀-䶿]/g, "").trim();
  const words = nonCjk.split(/\s+/).filter(Boolean).length;
  return Math.ceil(cjk / 400 + words / 200);
}

function extractChapters(text: string): Chapter[] {
  const chapters: Chapter[] = [];
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/^(#{1,4})\s+(.+)/);
    if (match) {
      chapters.push({
        id: "ch-" + i,
        title: match[2].replace(/[*_`~\[\]]/g, "").trim(),
        level: match[1].length,
        startLine: i,
      });
    }
  }
  return chapters;
}

function extractPlainText(md: string): string {
  return md
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[*_`~]/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/---/g, "")
    .trim();
}

/* ── Markdown renderer (lazy-loaded, with KaTeX + code highlight) ── */

let markedInstance: typeof import("marked").marked | null = null;
let katexModule: { renderToString: (s: string, o: { displayMode: boolean; throwOnError: boolean }) => string } | null = null;
let shikiHighlighter: { codeToHtml: (code: string, options: { lang: string; theme: string }) => string } | null = null;
let shikiFailed = false;
let katexFailed = false;

async function ensureKaTeX() {
  if (katexModule || katexFailed) return;
  try {
    const katex = await import("katex");
    katexModule = katex.default;
    try { await import("katex/dist/katex.min.css"); } catch {}
  } catch { katexFailed = true; }
}

async function ensureShiki() {
  if (shikiHighlighter || shikiFailed) return;
  try {
    const shiki = await import("shiki");
    shikiHighlighter = await shiki.createHighlighter({
      themes: ["github-dark"],
      langs: ["javascript", "typescript", "python", "html", "css", "json", "bash", "sql", "markdown"],
    });
  } catch { shikiFailed = true; }
}

function renderKaTeX(tex: string, displayMode: boolean): string {
  if (katexModule) {
    try {
      return katexModule.renderToString(tex, { displayMode, throwOnError: false });
    } catch {}
  }
  const escaped = tex.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return displayMode ? `<pre class="katex-fallback">${escaped}</pre>` : `<code>${escaped}</code>`;
}

async function renderMarkdown(src: string): Promise<string> {
  if (!markedInstance) {
    // Load marked first (essential), then try optional enhancements in parallel
    const _marked = await import("marked");
    await Promise.all([ensureShiki(), ensureKaTeX()]);

    const renderer = new _marked.Renderer();

    // Code blocks with syntax highlighting (shiki)
    renderer.code = function ({ text, lang }: { text: string; lang?: string }) {
      if (shikiHighlighter && lang) {
        try {
          const html = shikiHighlighter.codeToHtml(text, { lang, theme: "github-dark" });
          return `<div class="code-panel">${html}</div>`;
        } catch {}
      }
      // Fallback: plain code block
      const escaped = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      const langLabel = lang ? ` data-lang="${lang}"` : "";
      return `<div class="code-panel"><div class="code-header"${langLabel}><span>${lang || "code"}</span></div><pre><code>${escaped}</code></pre></div>`;
    };

    renderer.codespan = function ({ text }: { text: string }) {
      const escaped = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      return `<code>${escaped}</code>`;
    };

    _marked.setOptions({ gfm: true, breaks: false });
    _marked.use({ renderer });
    markedInstance = _marked.marked;
  }

  // Pre-process LaTeX: protect $...$ and $$...$$ from marked
  let processed = src;
  processed = processed.replace(/\$\$([\s\S]+?)\$\$/g, (_m, tex) => {
    return `<div class="katex-display-placeholder" data-tex="${encodeURIComponent(tex.trim())}"></div>`;
  });
  processed = processed.replace(/(?<!\$)\$(?!\$)(.+?)(?<!\$)\$(?!\$)/g, (_m, tex) => {
    return `<span class="katex-inline-placeholder" data-tex="${encodeURIComponent(tex.trim())}"></span>`;
  });

  const result = markedInstance(processed);
  let html = typeof result === "string" ? result : await result;

  // Post-process: replace KaTeX placeholders with rendered output
  html = html.replace(
    /<div class="katex-display-placeholder" data-tex="([^"]+)"><\/div>/g,
    (_m, encoded) => renderKaTeX(decodeURIComponent(encoded), true),
  );
  html = html.replace(
    /<span class="katex-inline-placeholder" data-tex="([^"]+)"><\/span>/g,
    (_m, encoded) => renderKaTeX(decodeURIComponent(encoded), false),
  );

  // Add data-line attributes to headings for chapter navigation
  let lineOffset = 0;
  html = html.replace(/<h([1-4])([^>]*)>/g, (match, level, attrs) => {
    const headingRegex = new RegExp(`^#{${level}}\\s+`, "gm");
    headingRegex.lastIndex = lineOffset;
    const headingMatch = headingRegex.exec(src);
    if (headingMatch) {
      const lineNum = src.substring(0, headingMatch.index).split("\n").length - 1;
      lineOffset = headingMatch.index + 1;
      return `<h${level}${attrs} data-line="${lineNum}">`;
    }
    return match;
  });

  return html;
}

/* ── Main Component ──────────────────────────────────────── */

export function NovelReader() {
  // ── State ──
  const [settings, setSettings] = useState<ReaderSettings>(DEFAULT_SETTINGS);
  const [library, setLibrary] = useState<BookMeta[]>([]);
  const [activeBookId, setActiveBookId] = useState<string | null>(null);
  const [rawContent, setRawContent] = useState<string>("");
  const [htmlContent, setHtmlContent] = useState<string>("");
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [loadingMd, setLoadingMd] = useState(false);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [bookmarksOpen, setBookmarksOpen] = useState(false);
  const [scrollPercent, setScrollPercent] = useState(0);
  const [tocDrawerOpen, setTocDrawerOpen] = useState(false);

  const contentRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Load settings from localStorage ──
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (saved) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) });
      const lib = localStorage.getItem(STORAGE_KEY_LIBRARY);
      if (lib) setLibrary(JSON.parse(lib));
    } catch {}
  }, []);

  // ── Save settings ──
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch {}
  }, [settings]);

  // ── Save library ──
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_LIBRARY, JSON.stringify(library));
    } catch {}
  }, [library]);

  // ── Load book content when activeBookId changes ──
  useEffect(() => {
    if (!activeBookId) {
      setRawContent("");
      setHtmlContent("");
      setChapters([]);
      return;
    }
    try {
      const content = localStorage.getItem(STORAGE_KEY_CONTENT_PREFIX + activeBookId);
      if (content) {
        setRawContent(content);
        const ch = extractChapters(content);
        setChapters(ch);
        renderMarkdown(content).then(setHtmlContent).catch(() => {
          // Fallback: show raw text if markdown rendering fails
          setHtmlContent(`<pre style="white-space:pre-wrap;word-break:break-word">${content.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</pre>`);
        });
        // Restore scroll position
        const pos = localStorage.getItem(STORAGE_KEY_POSITION_PREFIX + activeBookId);
        if (pos && contentRef.current) {
          requestAnimationFrame(() => {
            if (contentRef.current) {
              contentRef.current.scrollTop = parseFloat(pos);
            }
          });
        }
      }
    } catch {}
  }, [activeBookId]);

  // ── Save scroll position ──
  const saveScrollPosition = useCallback(() => {
    if (!activeBookId || !contentRef.current) return;
    const el = contentRef.current;
    const percent = el.scrollHeight > el.clientHeight
      ? el.scrollTop / (el.scrollHeight - el.clientHeight)
      : 0;
    setScrollPercent(Math.round(percent * 100));
    try {
      localStorage.setItem(STORAGE_KEY_POSITION_PREFIX + activeBookId, String(el.scrollTop));
      setLibrary((prev) =>
        prev.map((b) =>
          b.id === activeBookId
            ? { ...b, lastReadAt: Date.now(), scrollPercent: Math.round(percent * 100) }
            : b
        ),
      );
    } catch {}
  }, [activeBookId]);

  // ── Bookmarks ──
  const BM_KEY = "hv-reader-bm-";
  useEffect(() => {
    if (!activeBookId) { setBookmarks([]); return; }
    try {
      const saved = localStorage.getItem(BM_KEY + activeBookId);
      if (saved) setBookmarks(JSON.parse(saved));
      else setBookmarks([]);
    } catch { setBookmarks([]); }
  }, [activeBookId]);

  const saveBookmarks = useCallback((bms: Bookmark[]) => {
    if (!activeBookId) return;
    setBookmarks(bms);
    try { localStorage.setItem(BM_KEY + activeBookId, JSON.stringify(bms)); } catch {}
  }, [activeBookId]);

  const addBookmark = useCallback(() => {
    if (!activeBookId || !contentRef.current) return;
    const scrollTop = contentRef.current.scrollTop;
    // Find nearest chapter
    let label = "书签 " + (bookmarks.length + 1);
    for (let i = chapters.length - 1; i >= 0; i--) {
      const headingEl = contentRef.current.querySelector(`[data-line="${chapters[i].startLine}"]`);
      if (headingEl instanceof HTMLElement && headingEl.offsetTop <= scrollTop + 100) {
        label = chapters[i].title;
        break;
      }
    }
    const bm: Bookmark = { id: generateId(), label, scrollTop, createdAt: Date.now() };
    saveBookmarks([...bookmarks, bm]);
  }, [activeBookId, bookmarks, chapters, saveBookmarks]);

  const removeBookmark = useCallback((id: string) => {
    saveBookmarks(bookmarks.filter((b) => b.id !== id));
  }, [bookmarks, saveBookmarks]);

  // ── Keyboard shortcuts ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "f" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setSearchOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
        setSettingsOpen(false);
        setBookmarksOpen(false);
        setTocDrawerOpen(false);
      }
      if (e.key === "[" && !e.ctrlKey && !e.metaKey) navigateChapter(-1);
      if (e.key === "]" && !e.ctrlKey && !e.metaKey) navigateChapter(1);
      if (e.key === "b" && !e.ctrlKey && !e.metaKey) addBookmark();
      // Page scroll
      if (contentRef.current) {
        const pageH = contentRef.current.clientHeight * 0.85;
        if (e.key === "PageDown") { e.preventDefault(); contentRef.current.scrollBy({ top: pageH, behavior: "smooth" }); }
        if (e.key === "PageUp") { e.preventDefault(); contentRef.current.scrollBy({ top: -pageH, behavior: "smooth" }); }
        if (e.key === " ") { e.preventDefault(); contentRef.current.scrollBy({ top: pageH, behavior: "smooth" }); }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [chapters, activeBookId, addBookmark]);

  // ── File import ──
  const importFiles = useCallback(async (files: FileList | File[]) => {
    const arr = Array.from(files);
    const newBooks: BookMeta[] = [];

    for (const file of arr) {
      if (!/\.(md|markdown|txt|text|html|htm)$/i.test(file.name)) continue;

      const text = await file.text();
      const id = generateId();
      const meta: BookMeta = {
        id,
        name: file.name.replace(/\.[^.]+$/, ""),
        size: file.size,
        addedAt: Date.now(),
      };

      try {
        if (text.length <= MAX_CONTENT_SIZE) {
          localStorage.setItem(STORAGE_KEY_CONTENT_PREFIX + id, text);
        } else {
          // Store truncated content
          localStorage.setItem(STORAGE_KEY_CONTENT_PREFIX + id, text.slice(0, MAX_CONTENT_SIZE));
        }
        newBooks.push(meta);
      } catch {
        // localStorage full — skip
      }
    }

    if (newBooks.length > 0) {
      setLibrary((prev) => [...prev, ...newBooks]);
      setActiveBookId(newBooks[newBooks.length - 1].id);
    }
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      importFiles(e.dataTransfer.files);
    },
    [importFiles],
  );

  // ── Chapter navigation ──
  const navigateChapter = useCallback(
    (direction: number) => {
      if (chapters.length === 0 || !contentRef.current) return;
      const el = contentRef.current;
      const scrollTop = el.scrollTop;
      // Find current chapter
      let currentIdx = 0;
      for (let i = chapters.length - 1; i >= 0; i--) {
        const headingEl = el.querySelector(`[data-line="${chapters[i].startLine}"]`);
        if (headingEl && headingEl instanceof HTMLElement) {
          if (headingEl.offsetTop <= scrollTop + 100) {
            currentIdx = i;
            break;
          }
        }
      }
      const targetIdx = Math.max(0, Math.min(chapters.length - 1, currentIdx + direction));
      const targetChapter = chapters[targetIdx];
      const targetEl = el.querySelector(`[data-line="${targetChapter.startLine}"]`);
      if (targetEl && targetEl instanceof HTMLElement) {
        el.scrollTo({ top: targetEl.offsetTop - 20, behavior: "smooth" });
      }
    },
    [chapters],
  );

  // ── Scroll to chapter ──
  const scrollToChapter = useCallback((ch: Chapter) => {
    if (!contentRef.current) return;
    const el = contentRef.current.querySelector(`[data-line="${ch.startLine}"]`);
    if (el && el instanceof HTMLElement) {
      contentRef.current.scrollTo({ top: el.offsetTop - 20, behavior: "smooth" });
    }
  }, []);

  // ── Delete book ──
  const deleteBook = useCallback(
    (id: string) => {
      try {
        localStorage.removeItem(STORAGE_KEY_CONTENT_PREFIX + id);
        localStorage.removeItem(STORAGE_KEY_POSITION_PREFIX + id);
      } catch {}
      setLibrary((prev) => prev.filter((b) => b.id !== id));
      if (activeBookId === id) {
        setActiveBookId(null);
        setRawContent("");
        setHtmlContent("");
        setChapters([]);
      }
    },
    [activeBookId],
  );

  // ── Search highlight ──
  const highlightedHtml = useMemo(() => {
    if (!searchQuery.trim() || !htmlContent) return htmlContent;
    try {
      const escaped = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`(${escaped})`, "gi");
      return htmlContent.replace(regex, '<mark class="hv-search-hl">$1</mark>');
    } catch {
      return htmlContent;
    }
  }, [htmlContent, searchQuery]);

  // ── Plain text stats ──
  const stats = useMemo(() => {
    if (!rawContent) return null;
    const plain = extractPlainText(rawContent);
    const chars = plain.length;
    const minutes = estimateReadingTime(plain);
    return { chars, minutes };
  }, [rawContent]);

  // ── Current chapter index for nav ──
  const { currentChapterTitle, currentChapterIndex } = useMemo(() => {
    if (chapters.length === 0 || !contentRef.current) return { currentChapterTitle: null, currentChapterIndex: -1 };
    const scrollTop = contentRef.current.scrollTop;
    let title = chapters[0].title;
    let idx = 0;
    for (let i = chapters.length - 1; i >= 0; i--) {
      const headingEl = contentRef.current.querySelector(`[data-line="${chapters[i].startLine}"]`);
      if (headingEl && headingEl instanceof HTMLElement) {
        if (headingEl.offsetTop <= scrollTop + 100) {
          title = chapters[i].title;
          idx = i;
          break;
        }
      }
    }
    return { currentChapterTitle: title, currentChapterIndex: idx };
  }, [chapters, rawContent]);

  // ── Theme classes ──
  const themeClass = settings.theme === "sepia"
    ? "bg-[#f8f0e3] text-[#5b4636] dark:bg-[#2b2520] dark:text-[#e3d3b8]"
    : settings.theme === "eye-care"
      ? "bg-[#cce8cf] text-[#1a3a1a] dark:bg-[#1a2e1a] dark:text-[#c8e0c8]"
      : "bg-background text-foreground";

  // ── Empty state: import ──
  if (!activeBookId) {
    return (
      <div className="mx-auto flex min-h-[80vh] max-w-4xl flex-col items-center justify-center gap-6 px-4 py-8 sm:p-6">
        <header className="text-center">
          <p className="hv-kicker">Novel Reader / lightweight viewer</p>
          <h1 className="hv-title mt-2 flex items-center justify-center gap-3 text-3xl font-black sm:text-4xl">
            <BookOpen className="h-8 w-8 text-muted" aria-hidden />
            在线阅读器
          </h1>
          <p className="mt-3 text-sm text-muted">
            拖入 .md / .txt 文件开始阅读，或从已保存的书库中选择
          </p>
        </header>

        {/* Features */}
        <div className="grid w-full max-w-lg grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { label: "目录导航", desc: "标题自动提取" },
            { label: "书签标记", desc: "按 B 添加书签" },
            { label: "进度记忆", desc: "自动保存位置" },
            { label: "阅读主题", desc: "默认/护眼/绿底" },
          ].map((f) => (
            <div key={f.label} className="rounded-lg border border-border bg-card/50 p-3 text-center">
              <p className="text-xs font-medium text-foreground">{f.label}</p>
              <p className="mt-0.5 text-[10px] text-muted-soft">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={
            "flex w-full max-w-lg cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed p-6 text-center transition sm:gap-4 sm:p-10 " +
            (dragOver
              ? "border-accent/55 bg-accent/10"
              : "border-border hover:border-accent/40 hover:bg-card/50")
          }
        >
          <Upload className="h-10 w-10 text-muted" aria-hidden />
          <div>
            <p className="font-medium text-foreground">拖拽文件到此处</p>
            <p className="mt-1 text-xs text-muted">
              支持 .md / .markdown / .txt / .html 格式
            </p>
          </div>
          <button type="button" className="hv-action px-4 py-2 text-sm font-medium">
            <FileText className="h-4 w-4" aria-hidden />
            选择文件
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".md,.markdown,.txt,.text,.html,.htm"
            multiple
            hidden
            onChange={(e) => importFiles(e.target.files || [])}
          />
        </div>

        {/* Library */}
        {library.length > 0 && (
          <div className="w-full max-w-lg">
            <div className="mb-3 flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-muted" aria-hidden />
              <h2 className="text-sm font-semibold text-foreground">
                已保存的书库
                <span className="ml-2 font-mono text-xs text-muted">{library.length}</span>
              </h2>
            </div>
            <div className="flex flex-col gap-2">
              {library
                .sort((a, b) => (b.lastReadAt || b.addedAt) - (a.lastReadAt || a.addedAt))
                .map((book) => (
                  <div
                    key={book.id}
                    className="hv-panel group flex items-center gap-3 p-3"
                  >
                    <button
                      type="button"
                      onClick={() => setActiveBookId(book.id)}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    >
                      <FileText className="h-5 w-5 shrink-0 text-muted" aria-hidden />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {book.name}
                        </p>
                        <p className="mt-0.5 text-[11px] text-muted-soft">
                          {formatSize(book.size)}
                          {book.scrollPercent != null && book.scrollPercent > 0
                            ? ` · 已读 ${book.scrollPercent}%`
                            : ""}
                        </p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteBook(book.id)}
                      className="hidden shrink-0 p-1 text-muted-soft hover:text-red-400 group-hover:block"
                      title="移除"
                    >
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

  // ── Reading state ──
  return (
    <div
      className={`relative flex flex-col transition-colors ${fullscreen ? "fixed inset-0 z-50" : ""} ${themeClass}`}
      style={fullscreen ? undefined : { height: "calc(100svh - 4rem)", minHeight: "calc(100vh - 4rem)" }}
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes("Files")) {
          e.preventDefault();
          e.dataTransfer.dropEffect = "copy";
          setDragOver(true);
        }
      }}
      onDragLeave={(e) => {
        // Only set false if leaving the container entirely
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setDragOver(false);
        }
      }}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        importFiles(e.dataTransfer.files);
      }}
    >
      {/* Toolbar */}
      <div className="flex shrink-0 items-center gap-0.5 border-b border-border px-1.5 py-1 sm:px-3 sm:py-1.5">
        {/* Left: back + book name + chapter */}
        <button
          type="button"
          onClick={() => setActiveBookId(null)}
          className="rdr-btn-text shrink-0"
          title="返回书库"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          <span className="hidden sm:inline">书库</span>
        </button>

        <div className="mx-0.5 min-w-0 flex-1 truncate sm:mx-1">
          <span className="text-xs font-medium sm:text-sm">{library.find((b) => b.id === activeBookId)?.name || "阅读中"}</span>
          {currentChapterTitle && chapters.length > 1 && (
            <span className="ml-1.5 hidden max-w-[200px] truncate text-xs text-muted lg:inline">
              {currentChapterTitle}
            </span>
          )}
        </div>

        {/* Right: controls */}
        {stats && (
          <span className="hidden shrink-0 text-[11px] text-muted-soft xl:inline">
            {stats.chars.toLocaleString()} 字 · ~{stats.minutes} 分钟
          </span>
        )}

        {/* Font size — desktop inline, mobile via settings */}
        <div className="hidden items-center gap-0.5 sm:flex">
          <button type="button" onClick={() => setSettings((s) => ({ ...s, fontSize: Math.max(12, s.fontSize - 1) }))} className="rdr-btn text-xs font-bold" title="缩小字号">A</button>
          <span className="w-5 text-center font-mono text-[10px] text-muted">{settings.fontSize}</span>
          <button type="button" onClick={() => setSettings((s) => ({ ...s, fontSize: Math.min(28, s.fontSize + 1) }))} className="rdr-btn text-sm font-bold" title="放大字号">A</button>
        </div>

        <button
          type="button"
          onClick={() => { setSearchOpen(!searchOpen); setSearchQuery(""); }}
          className={`rdr-btn ${searchOpen ? "active" : ""}`}
          title="搜索"
        >
          <Search className="h-4 w-4" aria-hidden />
        </button>

        <button
          type="button"
          onClick={addBookmark}
          className="rdr-btn"
          title="书签"
        >
          <Bookmark className="h-4 w-4" aria-hidden />
        </button>

        {bookmarks.length > 0 && (
          <button
            type="button"
            onClick={() => setBookmarksOpen(!bookmarksOpen)}
            className={`rdr-btn hidden sm:inline-flex ${bookmarksOpen ? "active" : ""}`}
            title={`书签 (${bookmarks.length})`}
          >
            <span className="text-[10px] font-bold">{bookmarks.length}</span>
          </button>
        )}

        {chapters.length > 0 && (
          <>
            <button
              type="button"
              onClick={() => setTocDrawerOpen(!tocDrawerOpen)}
              className={`rdr-btn lg:hidden ${tocDrawerOpen ? "active" : ""}`}
              title="目录"
            >
              <List className="h-4 w-4" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => setSettings((s) => ({ ...s, tocOpen: !s.tocOpen }))}
              className={`rdr-btn hidden lg:inline-flex ${settings.tocOpen ? "active" : ""}`}
              title="目录侧栏"
            >
              <List className="h-4 w-4" aria-hidden />
            </button>
          </>
        )}

        <button
          type="button"
          onClick={() => setSettingsOpen(!settingsOpen)}
          className={`rdr-btn ${settingsOpen ? "active" : ""}`}
          title="设置"
        >
          <Settings className="h-4 w-4" aria-hidden />
        </button>

        <button type="button" onClick={() => setFullscreen(!fullscreen)} className="rdr-btn hidden sm:inline-flex" title="全屏">
          {fullscreen ? <Minimize2 className="h-4 w-4" aria-hidden /> : <Maximize2 className="h-4 w-4" aria-hidden />}
        </button>
      </div>

      {/* Search bar */}
      {searchOpen && (
        <div className="flex shrink-0 items-center gap-2 border-b border-border bg-card/50 px-3 py-2">
          <Search className="h-4 w-4 text-muted" aria-hidden />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索当前文档…"
            className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-soft"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="text-muted hover:text-foreground"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          )}
        </div>
      )}

      {/* Settings panel */}
      {settingsOpen && (
        <div className="shrink-0 border-b border-border bg-card/80 p-3 backdrop-blur">
          <div className="mx-auto flex max-w-4xl flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-5 sm:gap-y-2">
            {/* Font size — with +/- buttons for mobile */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted">字号</span>
              <button type="button" onClick={() => setSettings((s) => ({ ...s, fontSize: Math.max(12, s.fontSize - 1) }))} className="rdr-btn text-xs font-bold sm:hidden">A-</button>
              <input type="range" min={12} max={28} value={settings.fontSize}
                onChange={(e) => setSettings((s) => ({ ...s, fontSize: +e.target.value }))}
                className="accent-accent flex-1 sm:w-28 sm:flex-none" />
              <button type="button" onClick={() => setSettings((s) => ({ ...s, fontSize: Math.min(28, s.fontSize + 1) }))} className="rdr-btn text-sm font-bold sm:hidden">A+</button>
              <span className="w-6 font-mono text-xs">{settings.fontSize}</span>
            </div>
            {/* Line height */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted">行高</span>
              <input type="range" min={14} max={24} value={settings.lineHeight * 10}
                onChange={(e) => setSettings((s) => ({ ...s, lineHeight: +e.target.value / 10 }))}
                className="accent-accent flex-1 sm:w-28 sm:flex-none" />
              <span className="w-6 font-mono text-xs">{settings.lineHeight.toFixed(1)}</span>
            </div>
            {/* Width — desktop only */}
            <label className="hidden items-center gap-2 sm:flex">
              <span className="text-xs text-muted">宽度</span>
              <input type="range" min={520} max={1100} step={40} value={settings.maxWidth}
                onChange={(e) => setSettings((s) => ({ ...s, maxWidth: +e.target.value }))}
                className="accent-accent w-28" />
              <span className="w-10 font-mono text-xs">{settings.maxWidth}px</span>
            </label>
            {/* Theme */}
            <div className="flex items-center gap-1">
              {(["normal", "sepia", "eye-care"] as const).map((t) => (
                <button key={t} type="button"
                  onClick={() => setSettings((s) => ({ ...s, theme: t }))}
                  className={`rounded-md px-2.5 py-1.5 text-xs transition ${
                    settings.theme === t ? "bg-accent/15 text-accent" : "text-muted hover:text-foreground"
                  }`}
                >
                  {t === "normal" ? "默认" : t === "sepia" ? "护眼" : "绿底"}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Progress bar */}
      <div className="relative h-0.5 shrink-0 bg-border">
        <div
          className="h-full bg-accent transition-[width] duration-200"
          style={{ width: `${scrollPercent}%` }}
        />
        <span className="absolute right-2 top-1 font-mono text-[10px] text-muted-soft">
          {scrollPercent}%
        </span>
      </div>

      {/* Bookmarks panel */}
      {bookmarksOpen && bookmarks.length > 0 && (
        <div className="shrink-0 border-b border-border bg-card/80 p-3 backdrop-blur">
          <div className="mx-auto max-w-3xl">
            <p className="mb-2 font-mono text-[11px] uppercase tracking-wider text-muted-soft">书签</p>
            <div className="flex flex-wrap gap-2">
              {bookmarks.map((bm) => (
                <button
                  key={bm.id}
                  type="button"
                  onClick={() => contentRef.current?.scrollTo({ top: bm.scrollTop, behavior: "smooth" })}
                  className="group flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1 text-xs text-muted transition hover:border-accent/40 hover:text-foreground"
                >
                  <Bookmark className="h-3 w-3" aria-hidden />
                  {bm.label}
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => { e.stopPropagation(); removeBookmark(bm.id); }}
                    onKeyDown={(e) => { if (e.key === "Enter") removeBookmark(bm.id); }}
                    className="ml-0.5 hidden text-muted-soft hover:text-red-400 group-hover:inline"
                  >
                    <X className="h-3 w-3" aria-hidden />
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mobile TOC drawer */}
      {tocDrawerOpen && chapters.length > 0 && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setTocDrawerOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 max-h-[60vh] overflow-y-auto rounded-t-2xl border-t border-border bg-background p-4">
            <p className="mb-3 font-mono text-[11px] uppercase tracking-wider text-muted-soft">目录</p>
            <nav className="flex flex-col gap-0.5">
              {chapters.map((ch, i) => {
                const active = i === currentChapterIndex;
                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => { scrollToChapter(ch); setTocDrawerOpen(false); }}
                    className={`truncate rounded px-3 py-2 text-left text-sm transition ${
                      active
                        ? "rdr-toc-active font-semibold"
                        : "text-muted hover:bg-card hover:text-foreground"
                    }`}
                    style={{ paddingLeft: (ch.level - 1) * 16 + 12 }}
                  >
                    {ch.title}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* Main content area */}
      <div className="flex min-h-0 flex-1">
        {/* TOC sidebar */}
        {settings.tocOpen && chapters.length > 0 && (
          <aside className="hidden w-64 shrink-0 overflow-y-auto border-r border-border p-3 lg:block scrollbar-thin">
            <p className="mb-2 font-mono text-[11px] uppercase tracking-wider text-muted-soft">
              目录
            </p>
            <nav className="flex flex-col gap-0.5" id="rdr-toc-nav">
              {chapters.map((ch, i) => {
                const active = i === currentChapterIndex;
                return (
                  <button
                    key={ch.id}
                    type="button"
                    data-toc-active={active ? "true" : undefined}
                    onClick={() => scrollToChapter(ch)}
                    className={`truncate rounded px-2 py-1.5 text-left text-xs transition ${
                      active
                        ? "rdr-toc-active"
                        : "text-muted hover:bg-card hover:text-foreground"
                    }`}
                    style={{ paddingLeft: (ch.level - 1) * 14 + 8 }}
                    ref={(el) => {
                      // Auto-scroll the active TOC item into view
                      if (active && el) {
                        el.scrollIntoView({ block: "nearest", behavior: "smooth" });
                      }
                    }}
                  >
                    {ch.title}
                  </button>
                );
              })}
            </nav>
          </aside>
        )}

        {/* Content */}
        <div
          ref={contentRef}
          onScroll={saveScrollPosition}
          className="flex-1 overflow-y-auto"
        >
          <div
            className="reader-content mx-auto px-3 py-5 sm:px-8 sm:py-8"
            style={{
              maxWidth: settings.maxWidth,
              fontSize: settings.fontSize,
              lineHeight: settings.lineHeight,
            }}
          >
            {loadingMd ? (
              <p className="py-20 text-center text-muted">渲染中…</p>
            ) : htmlContent ? (
              <div
                className="hv-prose max-w-none"
                dangerouslySetInnerHTML={{ __html: highlightedHtml }}
              />
            ) : (
              <p className="py-20 text-center text-muted">无法加载内容</p>
            )}
          </div>

          {/* Bottom nav */}
          <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 border-t border-border px-4 py-6 sm:px-8">
            {chapters.length > 1 ? (
              <>
                <button type="button" onClick={() => navigateChapter(-1)} className="rdr-btn-text gap-1">
                  <ChevronLeft className="h-3.5 w-3.5" aria-hidden /> 上一章
                </button>
                <button type="button" onClick={() => contentRef.current?.scrollTo({ top: 0, behavior: "smooth" })} className="rdr-btn-text">
                  回到顶部
                </button>
                <button type="button" onClick={() => navigateChapter(1)} className="rdr-btn-text gap-1">
                  下一章 <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                </button>
              </>
            ) : (
              <button type="button" onClick={() => contentRef.current?.scrollTo({ top: 0, behavior: "smooth" })} className="rdr-btn-text mx-auto">
                回到顶部
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Drag overlay */}
      {dragOver && (
        <div className="pointer-events-none absolute inset-4 z-30 flex items-center justify-center rounded-2xl border-2 border-dashed border-accent/55 bg-accent/10 backdrop-blur-sm">
          <div className="text-center">
            <Plus className="mx-auto h-10 w-10 text-accent" aria-hidden />
            <p className="mt-2 text-sm font-medium text-accent">松开以导入</p>
          </div>
        </div>
      )}

      {/* Hidden file input for adding more */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".md,.markdown,.txt,.text,.html,.htm"
        multiple
        hidden
        onChange={(e) => importFiles(e.target.files || [])}
      />
    </div>
  );
}
