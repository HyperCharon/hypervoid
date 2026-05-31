"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

const LEGACY_STORAGE_KEY = "hypervoid:mascot-chat";
const STORAGE_PREFIX = "hypervoid:mascot-chat:";
const SIZE_KEY = "hypervoid:mascot-chat-size";
const MAX_HISTORY = 12;

type MascotCharacter = "kanna" | "rem" | "ram";
export type ChatMessage = { role: "user" | "assistant"; content: string };

const CHARACTER_LABEL: Record<MascotCharacter, string> = {
  kanna: "康娜",
  rem: "雷姆",
  ram: "拉姆",
};

const EMPTY_HINT: Record<MascotCharacter, string> = {
  kanna: "康娜在偷瞄你……说点什么吧。",
  rem: "雷姆在等你开口呢……说点什么吧。",
  ram: "拉姆在这里。有什么事就说吧。",
};

const ERROR_REPLY: Record<MascotCharacter, string> = {
  kanna: "……（卡姆依走神了）",
  rem: "……（雷姆走神了）",
  ram: "……（拉姆暂时没有回应）",
};

/**
 * External store for mascot chat history.
 *
 * localStorage is the source of truth. Histories are keyed by character so
 * switching between Kanna, Rem and Ram never leaks previous conversations.
 */

function storageKey(character: MascotCharacter): string {
  return STORAGE_PREFIX + character;
}

function readFromStorage(character: MascotCharacter): ChatMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const key = storageKey(character);
    const raw = localStorage.getItem(key) ??
      (character === "kanna" ? localStorage.getItem(LEGACY_STORAGE_KEY) : null);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (m): m is ChatMessage =>
          m &&
          (m.role === "user" || m.role === "assistant") &&
          typeof m.content === "string",
      )
      .slice(-MAX_HISTORY);
  } catch {
    return [];
  }
}

const EMPTY_SNAPSHOT: ChatMessage[] = [];
const snapshots = new Map<MascotCharacter, ChatMessage[]>();
const initialized = new Set<MascotCharacter>();
const subscribers = new Map<MascotCharacter, Set<() => void>>();

function ensureInit(character: MascotCharacter) {
  if (initialized.has(character) || typeof window === "undefined") return;
  initialized.add(character);
  snapshots.set(character, readFromStorage(character));
}

function getSnapshot(character: MascotCharacter): ChatMessage[] {
  ensureInit(character);
  return snapshots.get(character) ?? EMPTY_SNAPSHOT;
}

function getServerSnapshot(): ChatMessage[] {
  return EMPTY_SNAPSHOT;
}

function notify(character: MascotCharacter) {
  subscribers.get(character)?.forEach((cb) => cb());
}

function subscribe(character: MascotCharacter, cb: () => void): () => void {
  const set = subscribers.get(character) ?? new Set<() => void>();
  set.add(cb);
  subscribers.set(character, set);
  const key = storageKey(character);
  const handler = (e: StorageEvent) => {
    if (e.key === key || (character === "kanna" && e.key === LEGACY_STORAGE_KEY)) {
      snapshots.set(character, readFromStorage(character));
      notify(character);
    }
  };
  window.addEventListener("storage", handler);
  return () => {
    set.delete(cb);
    window.removeEventListener("storage", handler);
  };
}

function writeMessages(
  character: MascotCharacter,
  messages: ChatMessage[],
): ChatMessage[] {
  const trimmed = messages.slice(-MAX_HISTORY);
  snapshots.set(character, trimmed);
  try {
    localStorage.setItem(storageKey(character), JSON.stringify(trimmed));
  } catch {
    /* noop */
  }
  notify(character);
  return trimmed;
}

export function MascotChat({
  character = "kanna",
  onClose,
}: {
  character?: MascotCharacter;
  onClose: () => void;
}) {
  const subscribeForCharacter = useCallback(
    (cb: () => void) => subscribe(character, cb),
    [character],
  );
  const getSnapshotForCharacter = useCallback(
    () => getSnapshot(character),
    [character],
  );
  const messages = useSyncExternalStore(
    subscribeForCharacter,
    getSnapshotForCharacter,
    getServerSnapshot,
  );
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [partial, setPartial] = useState("");
  const [expanded, setExpanded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      setExpanded(localStorage.getItem(SIZE_KEY) === "large");
    } catch {
      /* noop */
    }
  }, []);

  const toggleSize = () => {
    setExpanded((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIZE_KEY, next ? "large" : "small");
      } catch {
        /* noop */
      }
      return next;
    });
  };

  useEffect(() => {
    const id = window.setTimeout(() => inputRef.current?.focus(), 100);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, partial]);

  const send = async () => {
    const text = input.trim();
    if (!text || streaming) return;
    const next = writeMessages(character, [
      ...messages,
      { role: "user", content: text },
    ]);
    setInput("");
    setStreaming(true);
    setPartial("");

    try {
      const res = await fetch("/api/mascot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, character }),
      });
      if (!res.ok || !res.body) {
        const errBody = await res.text();
        const errMsg = errBody.startsWith("{")
          ? (() => {
              try {
                return JSON.parse(errBody).error ?? "出错了";
              } catch {
                return "出错了";
              }
            })()
          : errBody || "出错了";
        writeMessages(character, [
          ...next,
          { role: "assistant", content: `……（${errMsg}）` },
        ]);
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setPartial(acc);
      }
      writeMessages(character, [
        ...next,
        { role: "assistant", content: acc || "……" },
      ]);
      setPartial("");
    } catch (e) {
      console.error("[mascot-chat]", e);
      writeMessages(character, [
        ...next,
        { role: "assistant", content: ERROR_REPLY[character] },
      ]);
    } finally {
      setStreaming(false);
    }
  };

  const clear = () => {
    writeMessages(character, []);
    setPartial("");
  };

  return (
    <div
      className={`flex flex-col rounded-2xl border border-border bg-card text-foreground shadow-2xl transition-[width,height] duration-150 ${
        expanded ? "h-[520px] w-[420px]" : "h-[320px] w-[260px]"
      }`}
    >
      <header className="flex items-center justify-between gap-2 border-b border-border px-3 py-2 text-xs">
        <span className="font-semibold">和{CHARACTER_LABEL[character]}说话</span>
        <div className="flex items-center gap-1.5">
          {messages.length > 0 ? (
            <button
              type="button"
              onClick={clear}
              className="rounded-md px-1.5 py-0.5 text-xs text-muted hover:bg-background hover:text-foreground"
              title="清空对话"
            >
              清空
            </button>
          ) : null}
          <button
            type="button"
            onClick={toggleSize}
            aria-label={expanded ? "缩小窗口" : "放大窗口"}
            title={expanded ? "缩小窗口" : "放大窗口"}
            className="rounded-md p-1 text-muted hover:bg-background hover:text-foreground"
          >
            <svg
              className="h-3.5 w-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              {expanded ? (
                <>
                  <polyline points="4 14 10 14 10 20" />
                  <polyline points="20 10 14 10 14 4" />
                  <line x1="14" y1="10" x2="21" y2="3" />
                  <line x1="3" y1="21" x2="10" y2="14" />
                </>
              ) : (
                <>
                  <polyline points="15 3 21 3 21 9" />
                  <polyline points="9 21 3 21 3 15" />
                  <line x1="21" y1="3" x2="14" y2="10" />
                  <line x1="3" y1="21" x2="10" y2="14" />
                </>
              )}
            </svg>
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭对话"
            className="rounded-md p-1 text-muted hover:bg-background hover:text-foreground"
          >
            <svg
              className="h-3.5 w-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <line x1="6" y1="6" x2="18" y2="18" />
              <line x1="6" y1="18" x2="18" y2="6" />
            </svg>
          </button>
        </div>
      </header>

      <div
        ref={scrollRef}
        className={`flex-1 overflow-y-auto p-3 leading-relaxed ${
          expanded ? "text-sm" : "text-sm"
        }`}
      >
        {messages.length === 0 && !partial ? (
          <p className="text-xs text-muted">{EMPTY_HINT[character]}</p>
        ) : null}
        <ul className="flex flex-col gap-2.5">
          {messages.map((m, i) => (
            <li
              key={i}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <span
                className={`max-w-[80%] rounded-2xl px-2.5 py-1.5 leading-relaxed ${
                  expanded ? "text-sm" : "text-xs"
                } ${
                  m.role === "user"
                    ? "bg-primary/15 text-foreground"
                    : "bg-background text-foreground"
                }`}
              >
                {m.role === "assistant" ? renderInline(m.content) : m.content}
              </span>
            </li>
          ))}
          {partial ? (
            <li className="flex justify-start">
              <span
                className={`max-w-[80%] rounded-2xl bg-background px-2.5 py-1.5 leading-relaxed text-foreground ${
                  expanded ? "text-sm" : "text-xs"
                }`}
              >
                {renderInline(partial)}
                <span className="ml-0.5 inline-block h-2 w-1 animate-pulse bg-primary align-middle" />
              </span>
            </li>
          ) : null}
        </ul>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="flex items-center gap-1.5 border-t border-border p-2"
      >
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={streaming}
          placeholder="说点什么…"
          maxLength={400}
          className={`min-w-0 flex-1 rounded-md border border-border bg-background px-2 py-1.5 outline-none transition focus:border-primary disabled:opacity-60 ${
            expanded ? "text-sm" : "text-xs"
          }`}
        />
        <button
          type="submit"
          disabled={streaming || !input.trim()}
          className={`shrink-0 whitespace-nowrap rounded-md bg-primary px-3 py-1.5 font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-40 ${
            expanded ? "text-sm" : "text-xs"
          }`}
        >
          {streaming ? "…" : "发送"}
        </button>
      </form>
    </div>
  );
}

/**
 * Minimal inline renderer for Kanna's replies — turns
 * `[label](/path)` and `[label](https://…)` into safe <a> tags.
 * Anything else passes through as plain text.
 */
function renderInline(text: string): ReactNode {
  const out: ReactNode[] = [];
  const re = /\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const label = m[1];
    const href = m[2];
    const safe =
      href.startsWith("/") ||
      href.startsWith("https://") ||
      href.startsWith("http://");
    if (safe) {
      const external = /^https?:\/\//.test(href);
      out.push(
        <a
          key={`l${key++}`}
          href={href}
          target={external ? "_blank" : undefined}
          rel={external ? "noreferrer noopener" : undefined}
          className="text-primary underline decoration-primary/40 underline-offset-2 hover:decoration-primary"
        >
          {label}
        </a>,
      );
    } else {
      out.push(m[0]);
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}
