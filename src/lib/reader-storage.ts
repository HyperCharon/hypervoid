/**
 * Reader storage abstraction — uses IndexedDB for large files,
 * falls back to localStorage for small files.
 *
 * IndexedDB has no practical size limit (hundreds of MBs).
 * localStorage caps at ~5-10MB depending on browser.
 */

const DB_NAME = "hv-reader";
const DB_VERSION = 1;
const STORE_BOOKS = "books";
const STORE_CHAPTERS = "chapters";

const LS_THRESHOLD = 2 * 1024 * 1024; // 2MB — below this, use localStorage

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_BOOKS)) db.createObjectStore(STORE_BOOKS);
      if (!db.objectStoreNames.contains(STORE_CHAPTERS)) db.createObjectStore(STORE_CHAPTERS);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGet(store: string, key: string): Promise<string | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(store, "readonly");
      const req = tx.objectStore(store).get(key);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

async function idbSet(store: string, key: string, value: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function idbDelete(store: string, key: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(store, "readwrite");
      tx.objectStore(store).delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // ignore
  }
}

/* ── Public API ──────────────────────────────────────────── */

/** Save book content. Uses IndexedDB for large files, localStorage for small. */
export async function saveBookContent(bookId: string, content: string): Promise<void> {
  const key = `hv-reader-book-${bookId}`;
  if (content.length > LS_THRESHOLD) {
    // Use IndexedDB for large files
    await idbSet(STORE_BOOKS, key, content);
    // Clear any old localStorage entry
    try { localStorage.removeItem(key); } catch {}
  } else {
    // Use localStorage for small files
    try {
      localStorage.setItem(key, content);
    } catch {
      // localStorage full — fall back to IndexedDB
      await idbSet(STORE_BOOKS, key, content);
    }
  }
}

/** Load book content. Tries localStorage first, then IndexedDB. */
export async function loadBookContent(bookId: string): Promise<string | null> {
  const key = `hv-reader-book-${bookId}`;
  // Try localStorage first (faster)
  try {
    const ls = localStorage.getItem(key);
    if (ls) return ls;
  } catch {}
  // Fall back to IndexedDB
  return idbGet(STORE_BOOKS, key);
}

/** Save chapter metadata (small JSON, always localStorage). */
export function saveChapters(bookId: string, chapters: unknown[]): void {
  try {
    localStorage.setItem(`hv-reader-book-${bookId}-chapters`, JSON.stringify(chapters));
  } catch {}
}

/** Load chapter metadata. */
export function loadChapters(bookId: string): unknown[] | null {
  try {
    const raw = localStorage.getItem(`hv-reader-book-${bookId}-chapters`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** Delete all data for a book. */
export async function deleteBookData(bookId: string): Promise<void> {
  const key = `hv-reader-book-${bookId}`;
  try { localStorage.removeItem(key); } catch {}
  try { localStorage.removeItem(key + "-chapters"); } catch {}
  try { localStorage.removeItem(`hv-reader-pos-${bookId}`); } catch {}
  try { localStorage.removeItem(`hv-reader-bm-${bookId}`); } catch {}
  await idbDelete(STORE_BOOKS, key);
  await idbDelete(STORE_CHAPTERS, key + "-chapters");
}
