"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { MascotChat } from "@/components/MascotChat";
import { MascotCharacterSwitcher } from "@/components/MascotCharacterSwitcher";

const STORAGE_KEY = "hypervoid:mascot";
const DEFAULT_MODEL = "/live2d/kobayaxi/Kobayaxi.model.json";
const CUBISM2_RUNTIME = "/live2d/live2d.min.js";
const MASCOT_W = 280;
const MASCOT_H = 340;
const CANVAS_W = 260;
const CANVAS_H = 320;

function loadCubism2Runtime(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("no window"));
  }
  const w = window as unknown as { Live2D?: unknown };
  if (w.Live2D) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      "script[data-cubism2-runtime]",
    );
    if (existing) {
      if ((window as unknown as { Live2D?: unknown }).Live2D) {
        resolve();
      } else {
        existing.addEventListener("load", () => resolve(), { once: true });
        existing.addEventListener(
          "error",
          () => reject(new Error("script error")),
          { once: true },
        );
      }
      return;
    }
    const s = document.createElement("script");
    s.src = CUBISM2_RUNTIME;
    s.async = true;
    s.dataset.cubism2Runtime = "true";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("script error"));
    document.head.appendChild(s);
  });
}

const MESSAGES = {
  tap: [
    "呀！别碰我~",
    "有什么事吗？",
    "欢迎来到 Hypervoid~",
    "今天过得怎么样？",
    "你戳到我了！",
    "在看文章吗？",
  ],
  idle: [
    "好久不见~",
    "今天也要开心哦",
    "记得常来看看",
    "这里有很多有趣的文章",
  ],
} as const;

function isMobileViewport(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 767px)").matches;
}

export function isMascotEnabled(): boolean {
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

export function setMascotEnabled(enabled: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, String(enabled));
    window.dispatchEvent(
      new CustomEvent("hypervoid:mascot-changed", { detail: enabled }),
    );
  } catch {
    /* noop */
  }
}

type Pos = { x: number; y: number };

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

export function Live2DMascot() {
  const pathname = usePathname();
  // Strict-CSP routes (no 'unsafe-eval') can't run pixi.js's batch renderer —
  // mounting the mascot there would just surface a load error. Skip entirely.
  const onStrictRoute =
    pathname?.startsWith("/admin") || pathname === "/search";

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const appRef = useRef<unknown>(null);
  const dialogTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragOffsetRef = useRef<Pos>({ x: 0, y: 0 });

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
    if (!visible || mobile || onStrictRoute || !hasPos || !canvasRef.current)
      return;
    let disposed = false;
    setLoadError(null);

    (async () => {
      try {
        const PIXI = await import("pixi.js");
        const w = window as unknown as { PIXI?: unknown };
        if (!w.PIXI) w.PIXI = PIXI;

        await loadCubism2Runtime();

        const { Live2DModel } = await import("pixi-live2d-display/cubism2");

        if (disposed || !canvasRef.current) return;

        const app = new PIXI.Application({
          view: canvasRef.current,
          width: CANVAS_W,
          height: CANVAS_H,
          backgroundAlpha: 0,
          antialias: true,
          resolution: Math.min(window.devicePixelRatio || 1, 2),
          autoDensity: true,
        });
        appRef.current = app;

        try {
          const model = await Live2DModel.from(DEFAULT_MODEL, {
            autoInteract: false,
          });
          if (disposed) return;

          const scale =
            Math.min(CANVAS_W / model.width, CANVAS_H / model.height) * 0.98;
          model.scale.set(scale);
          model.anchor.set(0.5, 0.5);
          model.x = CANVAS_W / 2;
          model.y = CANVAS_H * 0.56;

          model.on("pointertap", () => {
            const msgs = MESSAGES.tap;
            showDialog(msgs[Math.floor(Math.random() * msgs.length)]);
          });
          model.eventMode = "static";
          model.cursor = "grab";

          app.stage.addChild(model);
          scheduleIdle();
        } catch (e) {
          console.warn("[mascot] model load failed:", e);
          setLoadError("看板娘模型加载失败");
        }
      } catch (e) {
        console.warn("[mascot] init failed:", e);
        setLoadError("看板娘初始化失败");
      }
    })();

    return () => {
      disposed = true;
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (dialogTimerRef.current) clearTimeout(dialogTimerRef.current);
      const app = appRef.current as {
        destroy?: (removeView: boolean, stageOptions: unknown) => void;
      } | null;
      try {
        app?.destroy?.(true, { children: true, texture: true });
      } catch {
        /* noop */
      }
      appRef.current = null;
    };
  }, [visible, mobile, onStrictRoute, hasPos, scheduleIdle, showDialog]);

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
      // Don't start a drag when the user is interacting with anything
      // clickable inside the mascot — buttons, links (康娜's chat replies
      // contain markdown links), form fields. Otherwise setPointerCapture
      // swallows the click that would have navigated.
      if (target.closest("button, a, input, textarea, select, [data-no-drag]"))
        return;
      dragOffsetRef.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
      setDragging(true);
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [pos],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!dragging) return;
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
    },
    [dragging],
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
            aria-label={chatOpen ? "收起对话" : "和康娜说话"}
            title={chatOpen ? "收起对话" : "和康娜说话"}
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
            current="kanna"
            className="-right-8 top-[4.25rem]"
            menuClassName="left-full top-0 ml-2"
          />

          {chatOpen ? (
            <div
              data-no-drag
              className="absolute left-full top-[0.5rem] z-10 ml-10"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <MascotChat onClose={() => setChatOpen(false)} />
            </div>
          ) : null}

          {!chatOpen && (dialog || loadError) ? (
            <div className="absolute -top-4 left-[56%] max-w-[200px] -translate-x-1/2 -translate-y-full rounded-lg border border-border bg-card px-3 py-2 text-xs leading-relaxed text-foreground shadow-lg">
              {loadError ?? dialog}
              <span
                aria-hidden
                className="absolute left-1/2 top-full -ml-1.5 h-3 w-3 -translate-y-1/2 rotate-45 border-b border-r border-border bg-card"
              />
            </div>
          ) : null}

          <canvas
            ref={canvasRef}
            className="block"
            style={{
              width: CANVAS_W,
              height: CANVAS_H,
              marginLeft: (MASCOT_W - CANVAS_W) / 2,
              marginTop: (MASCOT_H - CANVAS_H) / 2,
            }}
          />
        </div>
      )}
    </>
  );
}
