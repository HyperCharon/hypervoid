"use client";

import { useEffect, useRef, useState } from "react";
import { fetchMascotPolicy, type MascotPolicy } from "@/lib/mascot-policy-cache";

export type MascotCharacter = "kanna" | "rem" | "ram";

const CHAR_KEY = "hypervoid:mascot-char";
const CHAR_EVENT = "hypervoid:mascot-character-changed";
const ENABLED_KEY = "hypervoid:mascot";
const ENABLED_EVENT = "hypervoid:mascot-changed";

const OPTIONS: { key: MascotCharacter; label: string }[] = [
  { key: "ram", label: "拉姆" },
  { key: "rem", label: "雷姆" },
  { key: "kanna", label: "康娜" },
];

type Props = {
  current: MascotCharacter;
  className?: string;
  menuClassName?: string;
};

export function MascotCharacterSwitcher({
  current,
  className = "",
  menuClassName = "left-full top-0 ml-2",
}: Props) {
  const [open, setOpen] = useState(false);
  const [policy, setPolicy] = useState<MascotPolicy | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetchMascotPolicy()
      .then((p) => {
        if (!cancelled) setPolicy(p);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const choose = (character: MascotCharacter) => {
    if (!policy?.allowUserSwitch) {
      setOpen(false);
      return;
    }
    try {
      localStorage.setItem(ENABLED_KEY, "true");
      localStorage.setItem(CHAR_KEY, character);
      window.dispatchEvent(
        new CustomEvent(CHAR_EVENT, { detail: { character } }),
      );
      window.dispatchEvent(new CustomEvent(ENABLED_EVENT, { detail: true }));
      window.setTimeout(() => {
        window.dispatchEvent(new CustomEvent(ENABLED_EVENT, { detail: true }));
      }, 80);
    } catch {
      /* noop */
    }
    setOpen(false);
  };

  if (!policy?.showSwitchButton) return null;

  return (
    <div ref={rootRef} data-no-drag className={"absolute z-20 " + className}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="切换看板娘"
        title={policy.allowUserSwitch ? "切换看板娘" : "后台已禁止切换看板娘"}
        className={
          "flex h-7 w-7 items-center justify-center rounded-full border border-border bg-card shadow-md transition-all duration-150 " +
          (open
            ? "opacity-100 "
            : "opacity-0 group-hover/mascot:opacity-100 focus-visible:opacity-100 ") +
          (policy.allowUserSwitch
            ? "text-muted hover:border-primary hover:text-primary"
            : "cursor-not-allowed text-muted/45")
        }
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
          <path d="M8 6h13" />
          <path d="M8 12h13" />
          <path d="M8 18h13" />
          <circle cx="3" cy="6" r="1" fill="currentColor" stroke="none" />
          <circle cx="3" cy="12" r="1" fill="currentColor" stroke="none" />
          <circle cx="3" cy="18" r="1" fill="currentColor" stroke="none" />
        </svg>
      </button>

      {open ? (
        <div
          className={
            "absolute z-30 min-w-24 overflow-hidden rounded-lg border border-border bg-card py-1 text-xs text-foreground shadow-lg " +
            menuClassName
          }
        >
          {OPTIONS.map((option) => {
            const active = option.key === current;
            return (
              <button
                key={option.key}
                type="button"
                onClick={() => choose(option.key)}
                disabled={!policy.allowUserSwitch}
                className={
                  "flex w-full items-center justify-between gap-3 px-3 py-2 text-left transition hover:bg-background disabled:cursor-not-allowed disabled:opacity-50 " +
                  (active ? "text-primary" : "text-muted hover:text-foreground")
                }
              >
                <span>{option.label}</span>
                {active ? <span aria-hidden>•</span> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
