/**
 * Reader storage abstraction — uses IndexedDB for large files,
 * falls back to localStorage for small files.
 *
 * Files > 5MB always go to IndexedDB to avoid localStorage quota errors.
 */

const DB_NAME = "hv-reader";
const DB_VERSION = 1;
const STORE_BOOKS = "books";

const LS_PREFIX = "hv-reader-book-";
const LS_SIZE_THRESHOLD = 5 * 1024 * 1024; // 5MB

/** Check if IndexedDB is available. */
function hasIDB(): boolean {
  try {
    return typeof indexedDB !== "undefined";
  } catch {
    return false;
  }
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!hasIDB()) return reject(new Error("IndexedDB not available"));
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_BOOKS)) db.createObjectStore(STORE_BOOKS);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGet(key: string): Promise<string | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_BOOKS, "readonly");
    const req = tx.objectStore(STORE_BOOKS).get(key);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error);
  });
}

async function idbSet(key: string, value: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_BOOKS, "readwrite");
    tx.objectStore(STORE_BOOKS).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function idbDelete(key: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_BOOKS, "readwrite");
      tx.objectStore(STORE_BOOKS).delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // ignore
  }
}

/* ── Public API ──────────────────────────────────────────── */

/**
 * Save book content. Large files (>5MB) go directly to IndexedDB.
 * Small files try localStorage first, then fall back to IndexedDB.
 */
export async function saveBookContent(bookId: string, content: string): Promise<void> {
  const key = LS_PREFIX + bookId;

  // Large files: skip localStorage entirely
  if (content.length > LS_SIZE_THRESHOLD) {
    if (hasIDB()) {
      await idbSet(key, content);
      return;
    }
    throw new Error("文件过大且 IndexedDB 不可用");
  }

  // Small files: try localStorage first (synchronous, faster reads)
  try {
    localStorage.setItem(key, content);
    return;
  } catch {
    // localStorage full — use IndexedDB
  }
  if (hasIDB()) {
    await idbSet(key, content);
    return;
  }
  throw new Error("localStorage 已满且 IndexedDB 不可用");
}

/**
 * Load book content. Tries localStorage first (synchronous), then
 * IndexedDB (async). Returns null if not found in either.
 */
export async function loadBookContent(bookId: string): Promise<string | null> {
  const key = LS_PREFIX + bookId;
  // Try localStorage first (synchronous, instant)
  try {
    const ls = localStorage.getItem(key);
    if (ls) return ls;
  } catch {}
  // Fall back to IndexedDB
  if (hasIDB()) {
    try {
      return await idbGet(key);
    } catch {
      return null;
    }
  }
  return null;
}

/** Save chapter metadata (small JSON, always localStorage). */
export function saveChapters(bookId: string, chapters: unknown[]): void {
  try {
    localStorage.setItem(LS_PREFIX + bookId + "-chapters", JSON.stringify(chapters));
  } catch {}
}

/** Load chapter metadata. */
export function loadChapters(bookId: string): unknown[] | null {
  try {
    const raw = localStorage.getItem(LS_PREFIX + bookId + "-chapters");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** Delete all data for a book. */
export async function deleteBookData(bookId: string): Promise<void> {
  const key = LS_PREFIX + bookId;
  try { localStorage.removeItem(key); } catch {}
  try { localStorage.removeItem(key + "-chapters"); } catch {}
  try { localStorage.removeItem(`hv-reader-pos-${bookId}`); } catch {}
  try { localStorage.removeItem(`hv-reader-bm-${bookId}`); } catch {}
  if (hasIDB()) {
    try {
      const db = await openDB();
      // First pass: collect per-chapter keys
      const chapterKeys: string[] = [];
      const readTx = db.transaction(STORE_BOOKS, "readonly");
      const readStore = readTx.objectStore(STORE_BOOKS);
      const prefix = key + "-ch-";
      await new Promise<void>((resolve, reject) => {
        const req = readStore.openCursor();
        req.onsuccess = () => {
          const cursor = req.result;
          if (cursor) {
            if (typeof cursor.key === "string" && cursor.key.startsWith(prefix)) {
              chapterKeys.push(cursor.key);
            }
            cursor.continue();
          } else {
            resolve();
          }
        };
        req.onerror = () => reject(req.error);
      });
      // Second pass: delete everything in one transaction
      const writeTx = db.transaction(STORE_BOOKS, "readwrite");
      const writeStore = writeTx.objectStore(STORE_BOOKS);
      writeStore.delete(key);
      writeStore.delete(key + "-chapters");
      for (const k of chapterKeys) writeStore.delete(k);
      await new Promise<void>((resolve, reject) => {
        writeTx.oncomplete = () => resolve();
        writeTx.onerror = () => reject(writeTx.error);
      });
    } catch {
      // ignore
    }
  }
}

/* ── Per-chapter storage for epub ───────────────────────── */

/**
 * Save a single chapter's HTML to IndexedDB.
 */
export async function saveChapterHtml(bookId: string, index: number, html: string): Promise<void> {
  const key = `${LS_PREFIX}${bookId}-ch-${index}`;
  if (hasIDB()) {
    await idbSet(key, html);
  } else {
    try { localStorage.setItem(key, html); } catch {}
  }
}

/**
 * Save all chapters in a single IndexedDB transaction.
 * Much faster and more reliable than calling saveChapterHtml in a loop.
 */
export async function saveAllChapterHtmls(bookId: string, chapters: { html: string }[]): Promise<void> {
  if (!hasIDB()) {
    // Fallback: save each to localStorage (may fail for large chapters)
    for (let i = 0; i < chapters.length; i++) {
      try { localStorage.setItem(`${LS_PREFIX}${bookId}-ch-${i}`, chapters[i].html); } catch {}
    }
    return;
  }
  const db = await openDB();
  const tx = db.transaction(STORE_BOOKS, "readwrite");
  const store = tx.objectStore(STORE_BOOKS);
  for (let i = 0; i < chapters.length; i++) {
    store.put(chapters[i].html, `${LS_PREFIX}${bookId}-ch-${i}`);
  }
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Load a single chapter's HTML from IndexedDB.
 */
export async function loadChapterHtml(bookId: string, index: number): Promise<string | null> {
  const key = `${LS_PREFIX}${bookId}-ch-${index}`;
  try {
    const ls = localStorage.getItem(key);
    if (ls) return ls;
  } catch {}
  if (hasIDB()) {
    try { return await idbGet(key); } catch { return null; }
  }
  return null;
}
