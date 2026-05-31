"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type BackgroundKey =
  | "cosmic"
  | "plain"
  | "paper"
  | "waves"
  | "particles"
  | "acg"
  | "medieval"
  | "cyberpunk";

export type FontKey = "geist" | "serif" | "handwriting";

export type FontSizeKey = "normal" | "large";

export type WallpaperKey = "none" | "1" | "cyberpunk" | "medieval" | "custom";

export const DEFAULT_HUE = 187;
export const DEFAULT_BACKGROUND: BackgroundKey = "cosmic";
export const DEFAULT_FONT: FontKey = "geist";
export const DEFAULT_FONT_SIZE: FontSizeKey = "normal";
export const DEFAULT_WALLPAPER: WallpaperKey = "none";

export const FONT_SIZE_OPTIONS: { key: FontSizeKey; label: string; hint: string }[] = [
  { key: "normal", label: "标准", hint: "17.5px 基准（默认）" },
  { key: "large", label: "舒适", hint: "19.5px 基准，正文更宽敞" },
];

export const BACKGROUND_OPTIONS: { key: BackgroundKey; label: string; hint: string }[] = [
  { key: "cosmic", label: "星尘", hint: "轻量星点背景" },
  { key: "particles", label: "粒子", hint: "更密集的粒子背景" },
  { key: "plain", label: "纯黑", hint: "关闭动态背景" },
];

export const WALLPAPER_OPTIONS: { key: WallpaperKey; label: string; hint: string; preview?: string }[] = [
  { key: "none", label: "无", hint: "不使用壁纸（默认）" },
  { key: "1", label: "风景", hint: "暖色调风景壁纸", preview: "/wallpapers/1.webp" },
  { key: "cyberpunk", label: "赛博", hint: "赛博朋克风格壁纸", preview: "/wallpapers/cyberpunk.webp" },
  { key: "medieval", label: "中世纪", hint: "中世纪风格壁纸", preview: "/wallpapers/medieval.webp" },
  { key: "custom", label: "自定义", hint: "使用自定义图片 URL" },
];

const HUE_KEY = "hypervoid:hue";
const BG_KEY = "hypervoid:bg";
const FONT_KEY = "hypervoid:font";
const FONT_SIZE_KEY = "hypervoid:font-size";
const WALLPAPER_KEY = "hypervoid:wallpaper";
const WALLPAPER_CUSTOM_KEY = "hypervoid:wallpaper-custom";
const SETTINGS_SCHEMA_KEY = "hypervoid:settings-schema";
const SETTINGS_SCHEMA_VERSION = "3";

type SettingsValue = {
  hue: number;
  background: BackgroundKey;
  font: FontKey;
  fontSize: FontSizeKey;
  wallpaper: WallpaperKey;
  wallpaperCustomUrl: string;
  setHue: (v: number) => void;
  setBackground: (v: BackgroundKey) => void;
  setFont: (v: FontKey) => void;
  setFontSize: (v: FontSizeKey) => void;
  setWallpaper: (v: WallpaperKey) => void;
  setWallpaperCustomUrl: (v: string) => void;
  reset: () => void;
};

const SettingsContext = createContext<SettingsValue>({
  hue: DEFAULT_HUE,
  background: DEFAULT_BACKGROUND,
  font: DEFAULT_FONT,
  fontSize: DEFAULT_FONT_SIZE,
  wallpaper: DEFAULT_WALLPAPER,
  wallpaperCustomUrl: "",
  setHue: () => {},
  setBackground: () => {},
  setFont: () => {},
  setFontSize: () => {},
  setWallpaper: () => {},
  setWallpaperCustomUrl: () => {},
  reset: () => {},
});

function applyHue(hue: number) {
  if (typeof document === "undefined") return;
  if (hue === DEFAULT_HUE) {
    document.documentElement.style.removeProperty("--accent");
    document.documentElement.style.removeProperty("--primary");
  } else {
    const color = `hsl(${hue} 70% 60%)`;
    document.documentElement.style.setProperty("--accent", color);
    document.documentElement.style.setProperty("--primary", color);
  }
}

function applyBackground(bg: BackgroundKey) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.bg = bg;
}

function applyFont(font: FontKey) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.font = font;
}

function applyFontSize(size: FontSizeKey) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.fontSize = size;
}

function applyWallpaper(wp: WallpaperKey, customUrl: string) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (wp === "none") {
    root.style.removeProperty("--wallpaper-url");
    root.style.removeProperty("--wallpaper-overlay");
    root.dataset.wallpaper = "none";
    return;
  }
  let url = "";
  if (wp === "custom" && customUrl) {
    url = customUrl;
  } else if (wp !== "custom") {
    url = `/bg/${wp}.webp`;
  }
  root.style.setProperty("--wallpaper-url", url ? `url("${url}")` : "none");
  root.dataset.wallpaper = wp;
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [hue, setHueState] = useState<number>(DEFAULT_HUE);
  const [background, setBackgroundState] =
    useState<BackgroundKey>(DEFAULT_BACKGROUND);
  const [font, setFontState] = useState<FontKey>(DEFAULT_FONT);
  const [fontSize, setFontSizeState] =
    useState<FontSizeKey>(DEFAULT_FONT_SIZE);
  const [wallpaper, setWallpaperState] =
    useState<WallpaperKey>(DEFAULT_WALLPAPER);
  const [wallpaperCustomUrl, setWallpaperCustomUrlState] = useState("");

  useEffect(() => {
    try {
      const migrated = localStorage.getItem(SETTINGS_SCHEMA_KEY) === SETTINGS_SCHEMA_VERSION;
      if (!migrated) {
        localStorage.removeItem(HUE_KEY);
        localStorage.removeItem(DISPLAY_MODE_KEY);
        localStorage.setItem(SETTINGS_SCHEMA_KEY, SETTINGS_SCHEMA_VERSION);
      }

      setHueState(DEFAULT_HUE);
      applyHue(DEFAULT_HUE);
      setFontState(DEFAULT_FONT);
      applyFont(DEFAULT_FONT);

      const storedBackground = localStorage.getItem(BG_KEY) as BackgroundKey | null;
      if (storedBackground && BACKGROUND_OPTIONS.some((o) => o.key === storedBackground)) {
        setBackgroundState(storedBackground);
        applyBackground(storedBackground);
      } else {
        setBackgroundState(DEFAULT_BACKGROUND);
        applyBackground(DEFAULT_BACKGROUND);
      }

      const storedFontSize = localStorage.getItem(
        FONT_SIZE_KEY,
      ) as FontSizeKey | null;
      if (
        storedFontSize &&
        FONT_SIZE_OPTIONS.some((o) => o.key === storedFontSize)
      ) {
        setFontSizeState(storedFontSize);
        applyFontSize(storedFontSize);
      } else {
        applyFontSize(DEFAULT_FONT_SIZE);
      }

      const storedWallpaper = localStorage.getItem(
        WALLPAPER_KEY,
      ) as WallpaperKey | null;
      const storedCustomUrl = localStorage.getItem(WALLPAPER_CUSTOM_KEY) ?? "";
      if (
        storedWallpaper &&
        WALLPAPER_OPTIONS.some((o) => o.key === storedWallpaper)
      ) {
        setWallpaperState(storedWallpaper);
        setWallpaperCustomUrlState(storedCustomUrl);
        applyWallpaper(storedWallpaper, storedCustomUrl);
      } else {
        applyWallpaper(DEFAULT_WALLPAPER, "");
      }
    } catch {
      applyHue(DEFAULT_HUE);
      applyBackground(DEFAULT_BACKGROUND);
      applyFont(DEFAULT_FONT);
      applyFontSize(DEFAULT_FONT_SIZE);
      applyWallpaper(DEFAULT_WALLPAPER, "");
    }
  }, []);

  const setHue = useCallback((v: number) => {
    setHueState(v);
    applyHue(v);
    try {
      localStorage.setItem(HUE_KEY, String(v));
    } catch {
      /* ignore */
    }
  }, []);

  const setBackground = useCallback(
    (v: BackgroundKey) => {
      setBackgroundState(v);
      applyBackground(v);
      try {
        localStorage.setItem(BG_KEY, v);
      } catch {
        /* ignore */
      }
    },
    [],
  );

  const setFont = useCallback((v: FontKey) => {
    setFontState(v);
    applyFont(v);
    try {
      localStorage.setItem(FONT_KEY, v);
    } catch {
      /* ignore */
    }
  }, []);

  const setFontSize = useCallback((v: FontSizeKey) => {
    setFontSizeState(v);
    applyFontSize(v);
    try {
      localStorage.setItem(FONT_SIZE_KEY, v);
    } catch {
      /* ignore */
    }
  }, []);

  const setWallpaper = useCallback((v: WallpaperKey) => {
    setWallpaperState(v);
    try {
      localStorage.setItem(WALLPAPER_KEY, v);
    } catch {
      /* ignore */
    }
    // Read current custom url from storage to avoid stale closure
    const customUrl = localStorage.getItem(WALLPAPER_CUSTOM_KEY) ?? "";
    applyWallpaper(v, customUrl);
  }, []);

  const setWallpaperCustomUrl = useCallback((v: string) => {
    setWallpaperCustomUrlState(v);
    try {
      localStorage.setItem(WALLPAPER_CUSTOM_KEY, v);
    } catch {
      /* ignore */
    }
    applyWallpaper("custom", v);
  }, []);

  const reset = useCallback(() => {
    setHue(DEFAULT_HUE);
    setBackground(DEFAULT_BACKGROUND);
    setFont(DEFAULT_FONT);
    setFontSize(DEFAULT_FONT_SIZE);
    setWallpaper(DEFAULT_WALLPAPER);
    setWallpaperCustomUrl("");
  }, [setHue, setBackground, setFont, setFontSize, setWallpaper, setWallpaperCustomUrl]);

  return (
    <SettingsContext.Provider
      value={{
        hue,
        background,
        font,
        fontSize,
        wallpaper,
        wallpaperCustomUrl,
        setHue,
        setBackground,
        setFont,
        setFontSize,
        setWallpaper,
        setWallpaperCustomUrl,
        reset,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}

// Keep DISPLAY_MODE_KEY reference for migration
const DISPLAY_MODE_KEY = "hypervoid:display";
