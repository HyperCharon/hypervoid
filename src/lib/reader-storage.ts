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
    await idbDelete(key);
    await idbDelete(key + "-chapters");
  }
}
