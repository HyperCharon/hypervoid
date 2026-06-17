"use client";

import { useEffect, useState } from "react";
import { BookOpenText } from "lucide-react";

type Mode = "normal" | "sepia" | "large";

const KEY = "hypervoid:reading-mode";

function apply(mode: Mode) {
  document.documentElement.dataset.reading = mode;
}

export function ReadingMode() {
  const [mode, setMode] = useState<Mode>("normal");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY) as Mode | null;
      if (saved === "sepia" || saved === "large") {
        setMode(saved);
        apply(saved);
      } else {
        apply("normal");
      }
    } catch {
      // ignore
    }
    return () => {
      document.documentElement.removeAttribute("data-reading");
    };
  }, []);

  function pick(next: Mode) {
    setMode(next);
    apply(next);
    setOpen(false);
    try {
      if (next === "normal") localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, next);
    } catch {
      // ignore
    }
  }

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="阅读模式"
        title="阅读模式"
        className="hv-action h-9 w-9 p-0 touch-manipulation"
      >
        <BookOpenText aria-hidden className="h-4 w-4" />
      </button>
      {open ? (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="hv-panel absolute right-0 top-full mt-1 z-40 flex w-44 flex-col gap-0.5 p-1 shadow-2xl">
            {(
              [
                ["normal", "默认"],
                ["sepia", "护眼 (Sepia)"],
                ["large", "护眼 / 大号"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => pick(key)}
                className={"px-3 py-2 text-left text-xs transition " + (
                  mode === key
                    ? "bg-foreground/5 text-accent"
                    : "text-muted hover:bg-card hover:text-foreground"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
