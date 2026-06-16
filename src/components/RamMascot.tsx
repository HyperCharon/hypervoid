"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { applySpineWidgetFocus } from "@/lib/spine-widget-focus";
import { MascotChat } from "@/components/MascotChat";
import { MascotCharacterSwitcher } from "@/components/MascotCharacterSwitcher";

const STORAGE_KEY = "hypervoid:mascot";
const MASCOT_W = 300;
const MASCOT_H = 380;

const RUNTIME_SRC = "/vendor/spine-3.6/spine-widget.js";
const RAM_JSON = "/mascot/ram/ram.json";
const RAM_ATLAS = "/mascot/ram/ram.atlas";
const RAM_PNG = "/mascot/ram/ram.png";
const PREFERRED_ANIMATION = "24_idle";
const RAM_FOCUS = {
  centerX: -25,
  centerY: 165,
  width: 470,
  height: 590,
  padding: 1.02,
};

type SpineWidgetConfig = {
  jsonContent: unknown;
  atlasContent: string;
  atlasPages: string[];
  animation: string;
  loop: boolean;
  fitToCanvas: boolean;
  alpha: boolean;
  backgroundColor: string;
  premultipliedAlpha: boolean;
};

type SpineWidget = {
  pause?: () => void;
  resize?: () => void;
  canvas?: HTMLCanvasElement;
  config?: { fitToCanvas?: boolean };
  context?: { gl?: WebGLRenderingContext | WebGL2RenderingContext };
  mvp?: { ortho2d: (x: number, y: number, width: number, height: number) => void };
  skeleton?: { x?: number; y?: number };
};

type SpineGlobal = {
  SpineWidget: new (element: HTMLElement, config: SpineWidgetConfig & {
    success?: (widget: SpineWidget) => void;
    error?: (_widget: SpineWidget, message: string) => void;
  }) => SpineWidget;
};

type WindowWithSpine36 = Window & {
  spine?: SpineGlobal;
  __hypervoidSpine36?: Promise<SpineGlobal>;
};

type Pos = { x: number; y: number };

const MESSAGES = {
  tap: [
    "有什么事？拉姆在听。",
    "别戳了，拉姆会自己看。",
    "主人又在折腾网站吗？",
    "需要拉姆帮你检查一下吗？",
    "雷姆不在的时候，就由拉姆看着这里。",
    "你的操作还算可以。",
  ],
  idle: [
    "休息一下。效率不是靠硬撑出来的。",
    "拉姆在。网站没有乱跑。",
    "主人最好记得保存。",
    "如果找不到东西，就去搜索。别硬猜。",
  ],
} as const;

function isMobileViewport(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 767px)").matches;
}

function isMascotEnabled(): boolean {
  if (typeof window === "undefined") return false;
  if (isMobileViewport()) return false;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw !== null) return raw === "true";
    return false;
  } catch {
    return false;
  }
}

function setMascotEnabled(enabled: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, String(enabled));
    window.dispatchEvent(
      new CustomEvent("hypervoid:mascot-changed", { detail: enabled }),
    );
  } catch {
    /* noop */
  }
}

function clampPos(p: Pos): Pos {
  if (typeof window === "undefined") return p;
  const maxX = Math.max(0, window.innerWidth - MASCOT_W);
  const maxY = Math.max(0, window.innerHeight - MASCOT_H);
  return {
    x: Math.min(Math.max(0, p.x), maxX),
    y: Math.min(Math.max(0, p.y), maxY),
  };
}

function defaultPos(): Pos {
  if (typeof window === "undefined") return { x: 0, y: 0 };
  return clampPos({
    x: 16,
    y: window.innerHeight - MASCOT_H - 16,
  });
}

async function readText(src: string): Promise<string> {
  const res = await fetch(src, { cache: "force-cache" });
  if (!res.ok) throw new Error("failed to load " + src + ": " + res.status);
  return res.text();
}

async function readJson(src: string): Promise<unknown> {
  const res = await fetch(src, { cache: "force-cache" });
  if (!res.ok) throw new Error("failed to load " + src + ": " + res.status);
  return res.json();
}

function normalizeAtlasPage(atlasText: string): string {
  return atlasText.replace(/^(\s*)ram\.png/m, "$1" + RAM_PNG);
}

function selectAnimation(json: unknown): string {
  const animations =
    json && typeof json === "object" && "animations" in json
      ? (json as { animations?: unknown }).animations
      : null;
  if (animations && typeof animations === "object") {
    const names = Object.keys(animations);
    return names.includes(PREFERRED_ANIMATION)
      ? PREFERRED_ANIMATION
      : names[0] ?? PREFERRED_ANIMATION;
  }
  return PREFERRED_ANIMATION;
}

function loadSpine36(): Promise<SpineGlobal> {
  const w = window as WindowWithSpine36;
  if (w.spine?.SpineWidget) return Promise.resolve(w.spine);
  if (w.__hypervoidSpine36) return w.__hypervoidSpine36;

  w.__hypervoidSpine36 = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${RUNTIME_SRC}"]`,
    );
    const script = existing ?? document.createElement("script");
    script.src = RUNTIME_SRC;
    script.async = true;
    script.onload = () => {
      if (w.spine?.SpineWidget) resolve(w.spine);
      else reject(new Error("Spine 3.6 runtime loaded without SpineWidget"));
    };
    script.onerror = () => reject(new Error("failed to load " + RUNTIME_SRC));
    if (!existing) document.head.appendChild(script);
  });

  return w.__hypervoidSpine36;
}

export function RamMascot() {
  const pathname = usePathname();
  const onStrictRoute =
    pathname?.startsWith("/admin") || pathname === "/search";

  const hostRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<SpineWidget | null>(null);
  const dialogTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragOffsetRef = useRef<Pos>({ x: 0, y: 0 });
  const dragStartRef = useRef<Pos>({ x: 0, y: 0 });
  const draggedRef = useRef(false);

  const [mounted, setMounted] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState<Pos | null>(null);
  const [dragging, setDragging] = useState(false);
  const [dialog, setDialog] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const hasPos = pos !== null;

  useEffect(() => {
    setMounted(true);
    const mql = window.matchMedia("(max-width: 767px)");
    const sync = () => setMobile(mql.matches);
    sync();
    mql.addEventListener("change", sync);
    if (isMascotEnabled()) setVisible(true);
    return () => mql.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (visible && pos === null) setPos(defaultPos());
  }, [visible, pos]);

  useEffect(() => {
    function onResize() {
      setPos((p) => (p ? clampPos(p) : p));
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const enabled = (e as CustomEvent<boolean>).detail;
      setVisible(typeof enabled === "boolean" ? enabled : isMascotEnabled());
      if (!enabled) setDialog(null);
    };
    window.addEventListener("hypervoid:mascot-changed", handler);
    return () =>
      window.removeEventListener("hypervoid:mascot-changed", handler);
  }, []);

  useEffect(() => {
    setVisible(isMascotEnabled());
  }, [pathname]);

  const showDialog = useCallback((msg: string) => {
    setDialog(msg);
    if (dialogTimerRef.current) clearTimeout(dialogTimerRef.current);
    dialogTimerRef.current = setTimeout(() => setDialog(null), 3500);
  }, []);

  const scheduleIdle = useCallback(function queueIdle() {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(
      () => {
        const msgs = MESSAGES.idle;
        showDialog(msgs[Math.floor(Math.random() * msgs.length)]);
        queueIdle();
      },
      30000 + Math.random() * 60000,
    );
  }, [showDialog]);

  useEffect(() => {
    if (!visible || mobile || onStrictRoute || !hasPos || !hostRef.current)
      return;
    let disposed = false;
    const host = hostRef.current;
    setLoadError(null);
    host.replaceChildren();
    scheduleIdle();

    (async () => {
      try {
        const [spine, jsonContent, atlasText] = await Promise.all([
          loadSpine36(),
          readJson(RAM_JSON),
          readText(RAM_ATLAS),
        ]);
        if (disposed) return;
        const animation = selectAnimation(jsonContent);
        widgetRef.current = new spine.SpineWidget(host, {
          jsonContent,
          atlasContent: normalizeAtlasPage(atlasText),
          atlasPages: [RAM_PNG],
          animation,
          loop: true,
          fitToCanvas: true,
          alpha: true,
          backgroundColor: "#00000000",
          premultipliedAlpha: false,
          success: (widget) => {
            applySpineWidgetFocus(widget, RAM_FOCUS);
            widgetRef.current = widget;
          },
          error: (_widget, message) => {
            if (!disposed) setLoadError(message);
          },
        });
      } catch (e) {
        if (!disposed) {
          console.warn("[mascot/ram-spine36] load failed:", e);
          setLoadError("拉姆模型加载失败");
        }
      }
    })();

    return () => {
      disposed = true;
      widgetRef.current?.pause?.();
      widgetRef.current = null;
      host.replaceChildren();
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (dialogTimerRef.current) clearTimeout(dialogTimerRef.current);
    };
  }, [visible, mobile, onStrictRoute, hasPos, scheduleIdle]);

  const show = useCallback(() => {
    setMascotEnabled(true);
    setVisible(true);
  }, []);

  const close = useCallback(() => {
    setMascotEnabled(false);
    setVisible(false);
    setDialog(null);
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!pos) return;
      const target = e.target as HTMLElement;
      if (target.closest("button, a, input, textarea, select, [data-no-drag]"))
        return;
      dragOffsetRef.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
      dragStartRef.current = { x: e.clientX, y: e.clientY };
      draggedRef.current = false;
      setDragging(true);
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [pos],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!dragging) return;
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      if (!draggedRef.current && dx * dx + dy * dy > 16) {
        draggedRef.current = true;
      }
      setPos(
        clampPos({
          x: e.clientX - dragOffsetRef.current.x,
          y: e.clientY - dragOffsetRef.current.y,
        }),
      );
    },
    [dragging],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!dragging) return;
      setDragging(false);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* noop */
      }
      if (!draggedRef.current) {
        const target = e.target as HTMLElement;
        if (!target.closest("button, a, input, textarea, select, [data-no-drag]")) {
          const msgs = MESSAGES.tap;
          showDialog(msgs[Math.floor(Math.random() * msgs.length)]);
        }
      }
    },
    [dragging, showDialog],
  );

  if (!mounted || mobile || onStrictRoute) return null;

  return (
    <>
      {!visible && (
        <button
          type="button"
          onClick={show}
          aria-label="呼出看板娘"
          title="呼出看板娘"
          style={{
            bottom: "max(5.25rem, env(safe-area-inset-bottom, 0px) + 4.75rem)",
            left: "max(1.5rem, env(safe-area-inset-left, 0px) + 1rem)",
          }}
          className="group fixed z-40 inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card/90 text-muted shadow-lg backdrop-blur transition-all duration-200 hover:scale-110 hover:border-primary/60 hover:text-primary hover:shadow-xl"
        >
          <span
            aria-hidden
            className="absolute inset-0 rounded-full bg-primary/0 transition group-hover:bg-primary/5"
          />
          <svg
            className="relative h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M5 11a7 7 0 1 1 14 0v3.5a2.5 2.5 0 0 1-5 0V12" />
            <path d="M5 11v3.5a2.5 2.5 0 0 0 5 0V12" />
            <circle cx="9" cy="11" r="0.6" fill="currentColor" stroke="none" />
            <circle cx="15" cy="11" r="0.6" fill="currentColor" stroke="none" />
            <path d="M10.5 14.5c.4.4 1 .6 1.5.6s1.1-.2 1.5-.6" />
          </svg>
        </button>
      )}

      {visible && pos && (
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className="group/mascot fixed z-[999] touch-none select-none"
          style={{
            left: pos.x,
            top: pos.y,
            width: MASCOT_W,
            height: MASCOT_H,
            cursor: dragging ? "grabbing" : "grab",
          }}
        >
          <button
            type="button"
            onClick={close}
            aria-label="收起看板娘"
            title="收起 · 还可在站点设置中重新打开"
            className="absolute -right-8 top-1 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-border bg-card text-base font-medium text-muted opacity-0 shadow-md transition-all duration-150 hover:border-primary hover:text-primary group-hover/mascot:opacity-100 focus-visible:opacity-100"
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

          <button
            type="button"
            onClick={() => setChatOpen((v) => !v)}
            aria-label={chatOpen ? "收起对话" : "和拉姆说话"}
            title={chatOpen ? "收起对话" : "和拉姆说话"}
            className={`absolute -right-8 top-9 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-border bg-card text-muted opacity-0 shadow-md transition-all duration-150 hover:border-primary hover:text-primary group-hover/mascot:opacity-100 focus-visible:opacity-100 ${
              chatOpen ? "!opacity-100" : ""
            }`}
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
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </svg>
          </button>


          <MascotCharacterSwitcher
            current="ram"
            className="-right-8 top-[4.25rem]"
            menuClassName="left-full top-0 ml-2"
          />

          {chatOpen ? (
            <div
              data-no-drag
              className="absolute left-full top-[0.5rem] z-10 ml-10 max-w-[calc(100vw-4rem)]"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <MascotChat
                character="ram"
                onClose={() => setChatOpen(false)}
              />
            </div>
          ) : null}

          {!chatOpen && dialog ? (
            <div className="hv-mascot-dialog absolute -top-4 left-[56%] z-10 max-w-[220px] -translate-x-1/2 -translate-y-full rounded-lg border border-border bg-card px-3 py-2 text-xs leading-relaxed text-foreground shadow-lg">
              {dialog}
              <span
                aria-hidden
                className="hv-mascot-dialog absolute left-1/2 top-full -ml-1.5 h-3 w-3 -translate-y-1/2 rotate-45 border-b border-r border-border bg-card"
              />
            </div>
          ) : null}

          <div
            ref={hostRef}
            aria-label="拉姆"
            role="img"
            className={`pointer-events-none h-full w-full overflow-hidden transition-transform duration-200 [&_canvas]:block ${
              dragging ? "scale-[0.98]" : ""
            } ${loadError ? "hidden" : ""}`}
          />

          {loadError ? (
            <div className="pointer-events-none absolute left-full top-8 ml-2 flex w-44 max-w-[calc(100vw-4rem)] items-center justify-center rounded-lg border border-dashed border-border bg-card/80 px-4 py-3 text-center text-xs leading-relaxed text-muted shadow-lg backdrop-blur">
              {loadError}
            </div>
          ) : null}
        </div>
      )}
    </>
  );
}
