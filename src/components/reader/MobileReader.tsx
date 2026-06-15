"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  List,
  Moon,
  Sun,
  Upload,
  X,
} from "lucide-react";
import { useTheme } from "next-themes";

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

const STORAGE_KEY_LIBRARY = "hv-reader-library";
const STORAGE_KEY_CONTENT_PREFIX = "hv-reader-book-";
const STORAGE_KEY_POSITION_PREFIX = "hv-reader-pos-";
const STORAGE_KEY_FONT_SIZE = "hv-reader-font-size";
const MAX_CONTENT_SIZE = 2 * 1024 * 1024;

/* ── Helpers ─────────────────────────────────────────────── */

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
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

/* ── Lightweight markdown renderer ───────────────────────── */

let markedFn: ((src: string) => string | Promise<string>) | null = null;

async function renderMd(src: string): Promise<string> {
  if (!markedFn) {
    const { marked } = await import("marked");
    marked.setOptions({ gfm: true, breaks: false });
    const r = new marked.Renderer();
    r.code = ({ text, lang }: { text: string; lang?: string }) => {
      const escaped = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      const label = lang ? ` data-lang="${lang}"` : "";
      return `<div class="mcode"><div class="mcode-hd"${label}><span>${lang || "code"}</span></div><pre><code>${escaped}</code></pre></div>`;
    };
    r.codespan = ({ text }: { text: string }) => `<code>${text}</code>`;
    marked.use({ renderer: r });
    markedFn = (s) => {
      const result = marked(s);
      return typeof result === "string" ? result : result;
    };
  }
  // Add data-line to headings
  let html = await markedFn(src);
  let lineOffset = 0;
  html = html.replace(/<h([1-4])([^>]*)>/g, (match, level, attrs) => {
    const re = new RegExp(`^#{${level}}\\s+`, "gm");
    re.lastIndex = lineOffset;
    const m = re.exec(src);
    if (m) {
      const lineNum = src.substring(0, m.index).split("\n").length - 1;
      lineOffset = m.index + 1;
      return `<h${level}${attrs} data-line="${lineNum}">`;
    }
    return match;
  });
  return html;
}

/* ── Main Component ──────────────────────────────────────── */

export function MobileReader() {
  const { resolvedTheme, setTheme } = useTheme();
  const [library, setLibrary] = useState<BookMeta[]>([]);
  const [activeBookId, setActiveBookId] = useState<string | null>(null);
  const [rawContent, setRawContent] = useState("");
  const [htmlContent, setHtmlContent] = useState("");
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [fontSize, setFontSize] = useState(16);
  const [tocOpen, setTocOpen] = useState(false);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [scrollPercent, setScrollPercent] = useState(0);
  const [currentChapterTitle, setCurrentChapterTitle] = useState<string | null>(null);
  const [currentChapterIdx, setCurrentChapterIdx] = useState(-1);
  const [dragOver, setDragOver] = useState(false);

  const contentRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load library + font size
  useEffect(() => {
    try {
      const lib = localStorage.getItem(STORAGE_KEY_LIBRARY);
      if (lib) setLibrary(JSON.parse(lib));
      const fs = localStorage.getItem(STORAGE_KEY_FONT_SIZE);
      if (fs) setFontSize(Number(fs) || 16);
    } catch {}
  }, []);

  // Save library
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY_LIBRARY, JSON.stringify(library)); } catch {}
  }, [library]);

  // Save font size
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY_FONT_SIZE, String(fontSize)); } catch {}
  }, [fontSize]);

  // Load book content
  useEffect(() => {
    if (!activeBookId) {
      setRawContent(""); setHtmlContent(""); setChapters([]);
      return;
    }
    try {
      const content = localStorage.getItem(STORAGE_KEY_CONTENT_PREFIX + activeBookId);
      if (content) {
        setRawContent(content);
        setChapters(extractChapters(content));
        renderMd(content).then(setHtmlContent).catch(() => {
          setHtmlContent(`<pre style="white-space:pre-wrap">${content.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</pre>`);
        });
        const pos = localStorage.getItem(STORAGE_KEY_POSITION_PREFIX + activeBookId);
        if (pos && contentRef.current) {
          requestAnimationFrame(() => {
            if (contentRef.current) contentRef.current.scrollTop = parseFloat(pos);
          });
        }
      }
    } catch {}
  }, [activeBookId]);

  // Bookmarks
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

  // Scroll tracking
  const saveScrollPosition = useCallback(() => {
    if (!activeBookId || !contentRef.current) return;
    const el = contentRef.current;
    const pct = el.scrollHeight > el.clientHeight ? el.scrollTop / (el.scrollHeight - el.clientHeight) : 0;
    setScrollPercent(Math.round(pct * 100));
    try {
      localStorage.setItem(STORAGE_KEY_POSITION_PREFIX + activeBookId, String(el.scrollTop));
      setLibrary(prev => prev.map(b => b.id === activeBookId ? { ...b, lastReadAt: Date.now(), scrollPercent: Math.round(pct * 100) } : b));
    } catch {}
    // Track current chapter
    let title: string | null = null;
    let idx = -1;
    for (let i = chapters.length - 1; i >= 0; i--) {
      const headingEl = el.querySelector(`[data-line="${chapters[i].startLine}"]`);
      if (headingEl instanceof HTMLElement && headingEl.offsetTop <= el.scrollTop + 60) {
        title = chapters[i].title;
        idx = i;
        break;
      }
    }
    setCurrentChapterTitle(title);
    setCurrentChapterIdx(idx);
  }, [activeBookId, chapters, setLibrary]);

  // Scroll to chapter
  const scrollToChapter = useCallback((ch: Chapter) => {
    if (!contentRef.current) return;
    const el = contentRef.current.querySelector(`[data-line="${ch.startLine}"]`);
    if (el instanceof HTMLElement) contentRef.current.scrollTo({ top: el.offsetTop - 16, behavior: "smooth" });
  }, []);

  // Navigate chapter
  const navigateChapter = useCallback((dir: number) => {
    if (chapters.length === 0 || !contentRef.current) return;
    const targetIdx = Math.max(0, Math.min(chapters.length - 1, currentChapterIdx + dir));
    scrollToChapter(chapters[targetIdx]);
  }, [chapters, currentChapterIdx, scrollToChapter]);

  // File import
  const importFiles = useCallback(async (files: FileList | File[]) => {
    const newBooks: BookMeta[] = [];
    for (const file of Array.from(files)) {
      if (!/\.(md|markdown|txt|text|html|htm)$/i.test(file.name)) continue;
      const text = await file.text();
      const id = generateId();
      const meta: BookMeta = { id, name: file.name.replace(/\.[^.]+$/, ""), size: file.size, addedAt: Date.now() };
      try {
        localStorage.setItem(STORAGE_KEY_CONTENT_PREFIX + id, text.length <= MAX_CONTENT_SIZE ? text : text.slice(0, MAX_CONTENT_SIZE));
        newBooks.push(meta);
      } catch {}
    }
    if (newBooks.length > 0) {
      setLibrary(prev => [...prev, ...newBooks]);
      setActiveBookId(newBooks[newBooks.length - 1].id);
    }
  }, []);

  // Delete book
  const deleteBook = useCallback((id: string) => {
    try {
      localStorage.removeItem(STORAGE_KEY_CONTENT_PREFIX + id);
      localStorage.removeItem(STORAGE_KEY_POSITION_PREFIX + id);
    } catch {}
    setLibrary(prev => prev.filter(b => b.id !== id));
    if (activeBookId === id) { setActiveBookId(null); setRawContent(""); setHtmlContent(""); setChapters([]); }
  }, [activeBookId]);

  // Add bookmark
  const addBookmark = useCallback(() => {
    if (!activeBookId || !contentRef.current) return;
    const scrollTop = contentRef.current.scrollTop;
    let label = "书签 " + (bookmarks.length + 1);
    for (let i = chapters.length - 1; i >= 0; i--) {
      const el = contentRef.current.querySelector(`[data-line="${chapters[i].startLine}"]`);
      if (el instanceof HTMLElement && el.offsetTop <= scrollTop + 60) { label = chapters[i].title; break; }
    }
    saveBookmarks([...bookmarks, { id: generateId(), label, scrollTop, createdAt: Date.now() }]);
  }, [activeBookId, bookmarks, chapters, saveBookmarks]);

  // Close TOC on route-like actions
  useEffect(() => { setTocOpen(false); }, [activeBookId]);

  const isDark = resolvedTheme !== "light";

  /* ── Empty state: library ── */
  if (!activeBookId) {
    return (
      <div className="flex min-h-[100svh] flex-col px-4 py-6">
        <header className="mb-6 text-center">
          <p className="text-[11px] font-medium uppercase tracking-widest text-muted-soft">Reader</p>
          <h1 className="mt-1 text-xl font-bold text-foreground">阅读器</h1>
          <p className="mt-1 text-xs text-muted-soft">拖入或选择 .md / .txt 文件</p>
        </header>

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); importFiles(e.dataTransfer.files); }}
          onClick={() => fileInputRef.current?.click()}
          className={`mb-6 flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed p-6 text-center transition ${dragOver ? "border-accent/50 bg-accent/10" : "border-border hover:border-accent/30"}`}
        >
          <Upload className="h-8 w-8 text-muted" />
          <p className="text-sm font-medium text-foreground">点击选择或拖入文件</p>
          <p className="text-[11px] text-muted-soft">.md / .txt / .html</p>
          <input ref={fileInputRef} type="file" accept=".md,.markdown,.txt,.text,.html,.htm" multiple hidden onChange={(e) => importFiles(e.target.files || [])} />
        </div>

        {/* Library */}
        {library.length > 0 && (
          <div>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-soft">书库 <span className="font-mono">{library.length}</span></h2>
            <div className="flex flex-col gap-1.5">
              {library.sort((a, b) => (b.lastReadAt || b.addedAt) - (a.lastReadAt || a.addedAt)).map(book => (
                <div key={book.id} className="group flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5">
                  <button type="button" onClick={() => setActiveBookId(book.id)} className="flex min-w-0 flex-1 items-center gap-2.5 text-left">
                    <FileText className="h-4 w-4 shrink-0 text-muted" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{book.name}</p>
                      <p className="text-[10px] text-muted-soft">{formatSize(book.size)}{book.scrollPercent != null && book.scrollPercent > 0 ? ` · ${book.scrollPercent}%` : ""}</p>
                    </div>
                  </button>
                  <button type="button" onClick={() => deleteBook(book.id)} className="p-1 text-muted-soft opacity-0 transition hover:text-red-400 group-hover:opacity-100">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ── Reading state ── */
  return (
    <div className="relative flex h-[100svh] flex-col bg-background text-foreground">
      {/* Toolbar */}
      <div className="flex shrink-0 items-center border-b border-border px-2 py-1.5">
        <button type="button" onClick={() => setActiveBookId(null)} className="flex h-9 w-9 items-center justify-center rounded-md text-muted transition hover:text-foreground" title="返回">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="mx-1 min-w-0 flex-1 truncate text-xs font-medium">{library.find(b => b.id === activeBookId)?.name || ""}</div>
        {currentChapterTitle && chapters.length > 1 && (
          <span className="mr-1 max-w-[120px] truncate text-[10px] text-muted-soft">{currentChapterTitle}</span>
        )}
        <button type="button" onClick={() => setTheme(isDark ? "light" : "dark")} className="flex h-9 w-9 items-center justify-center rounded-md text-muted transition hover:text-foreground">
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
        <button type="button" onClick={addBookmark} className="flex h-9 w-9 items-center justify-center rounded-md text-muted transition hover:text-foreground" title="书签">
          <span className="text-[10px] font-bold">B</span>
        </button>
        {chapters.length > 0 && (
          <button type="button" onClick={() => setTocOpen(true)} className="flex h-9 w-9 items-center justify-center rounded-md text-muted transition hover:text-foreground" title="目录">
            <List className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Progress bar */}
      <div className="relative h-0.5 shrink-0 bg-border">
        <div className="h-full bg-accent transition-[width] duration-200" style={{ width: `${scrollPercent}%` }} />
      </div>

      {/* Content */}
      <div ref={contentRef} onScroll={saveScrollPosition} className="flex-1 overflow-y-auto overscroll-contain">
        <div className="px-4 py-5" style={{ fontSize, lineHeight: 1.8 }}>
          {htmlContent ? (
            <div className="hv-prose max-w-none" dangerouslySetInnerHTML={{ __html: htmlContent }} />
          ) : (
            <p className="py-20 text-center text-sm text-muted">加载中…</p>
          )}
        </div>

        {/* Bottom nav */}
        <div className="flex items-center justify-between border-t border-border px-4 py-4">
          {chapters.length > 1 ? (
            <>
              <button type="button" onClick={() => navigateChapter(-1)} className="flex h-10 items-center gap-1 rounded-md px-3 text-xs text-muted transition hover:text-foreground">
                <ChevronLeft className="h-3.5 w-3.5" /> 上一章
              </button>
              <button type="button" onClick={() => contentRef.current?.scrollTo({ top: 0, behavior: "smooth" })} className="text-xs text-muted hover:text-foreground">顶部</button>
              <button type="button" onClick={() => navigateChapter(1)} className="flex h-10 items-center gap-1 rounded-md px-3 text-xs text-muted transition hover:text-foreground">
                下一章 <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </>
          ) : (
            <button type="button" onClick={() => contentRef.current?.scrollTo({ top: 0, behavior: "smooth" })} className="mx-auto text-xs text-muted hover:text-foreground">回到顶部</button>
          )}
        </div>
      </div>

      {/* Font size bar */}
      <div className="flex shrink-0 items-center justify-center gap-3 border-t border-border px-4 py-2">
        <button type="button" onClick={() => setFontSize(s => Math.max(12, s - 1))} className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-xs font-bold text-muted">A-</button>
        <span className="w-6 text-center font-mono text-[10px] text-muted">{fontSize}</span>
        <button type="button" onClick={() => setFontSize(s => Math.min(28, s + 1))} className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-sm font-bold text-muted">A+</button>
      </div>

      {/* TOC drawer */}
      {tocOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setTocOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 max-h-[60vh] overflow-y-auto rounded-t-2xl border-t border-border bg-card p-4">
            <p className="mb-3 text-[11px] font-medium uppercase tracking-wider text-muted-soft">目录</p>
            <nav className="flex flex-col gap-0.5">
              {chapters.map((ch, i) => (
                <button key={ch.id} type="button" onClick={() => { scrollToChapter(ch); setTocOpen(false); }}
                  className={`truncate rounded px-3 py-2.5 text-left text-sm transition ${i === currentChapterIdx ? "bg-accent/10 font-semibold text-accent" : "text-muted hover:bg-card-hover hover:text-foreground"}`}
                  style={{ paddingLeft: (ch.level - 1) * 16 + 12 }}>
                  {ch.title}
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Drag overlay */}
      {dragOver && (
        <div className="pointer-events-none absolute inset-4 z-30 flex items-center justify-center rounded-2xl border-2 border-dashed border-accent/50 bg-accent/10">
          <p className="text-sm font-medium text-accent">松开导入</p>
        </div>
      )}

      <input ref={fileInputRef} type="file" accept=".md,.markdown,.txt,.text,.html,.htm" multiple hidden onChange={(e) => importFiles(e.target.files || [])} />
    </div>
  );
}
