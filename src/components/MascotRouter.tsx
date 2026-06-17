"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { fetchMascotPolicy } from "@/lib/mascot-policy-cache";

const CHAR_KEY = "hypervoid:mascot-char";
const CHAR_EVENT = "hypervoid:mascot-character-changed";

const Live2DMascot = dynamic(
  () => import("@/components/Live2DMascot").then((m) => m.Live2DMascot),
  { ssr: false },
);

const GifMascot = dynamic(
  () => import("@/components/GifMascot").then((m) => m.GifMascot),
  { ssr: false },
);

const RamMascot = dynamic(
  () => import("@/components/RamMascot").then((m) => m.RamMascot),
  { ssr: false },
);

type MascotChar = "kanna" | "rem" | "ram";

function isMascotChar(value: unknown): value is MascotChar {
  return value === "kanna" || value === "rem" || value === "ram";
}

function readStoredChar(): MascotChar | null {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem(CHAR_KEY);
    return isMascotChar(v) ? v : null;
  } catch {
    return null;
  }
}

export function MascotRouter() {
  const [character, setCharacter] = useState<MascotChar>(() =>
    readStoredChar() ?? "ram",
  );

  useEffect(() => {
    if (readStoredChar()) return;
    let cancelled = false;
    fetchMascotPolicy()
      .then((policy) => {
        if (!cancelled) setCharacter(policy.defaultCharacter);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const applyStored = () => {
      const stored = readStoredChar();
      if (stored) setCharacter(stored);
    };
    const onCharacterChanged = (e: Event) => {
      const detail = (e as CustomEvent<{ character?: unknown }>).detail;
      setCharacter(
        isMascotChar(detail?.character)
          ? detail.character
          : (readStoredChar() ?? "ram"),
      );
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === CHAR_KEY) applyStored();
    };
    window.addEventListener(CHAR_EVENT, onCharacterChanged);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(CHAR_EVENT, onCharacterChanged);
      window.removeEventListener("storage", onStorage);
    };
  }, []);


  if (character === "rem") return <GifMascot key="rem" />;
  if (character === "ram") return <RamMascot key="ram" />;
  return <Live2DMascot key="kanna" />;
}
