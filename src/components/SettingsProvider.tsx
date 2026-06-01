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
  | "particles";

export type FontKey = "geist" | "serif" | "handwriting";

export type FontSizeKey = "normal" | "large";

export type WallpaperKey = "none" | "custom";

/** 页面样式：简洁（默认） / 全屏 / 横幅 */
export type StyleKey = "simple" | "fullscreen" | "banner";

export const DEFAULT_HUE = 187;
export const DEFAULT_BACKGROUND: BackgroundKey = "cosmic";
export const DEFAULT_FONT: FontKey = "geist";
export const DEFAULT_FONT_SIZE: FontSizeKey = "normal";
export const DEFAULT_WALLPAPER: WallpaperKey = "none";
export const DEFAULT_STYLE: StyleKey = "simple";

export const FONT_SIZE_OPTIONS: { key: FontSizeKey; label: string; hint: string }[] = [
  { key: "normal", label: "标准", hint: "17.5px 基准（默认）" },
  { key: "large", label: "舒适", hint: "19.5px 基准，正文更宽敞" },
];

export const BACKGROUND_OPTIONS: { key: BackgroundKey; label: string; hint: string }[] = [
  { key: "cosmic", label: "星尘", hint: "轻量星点背景" },
  { key: "particles", label: "粒子", hint: "更密集的粒子背景" },
  { key: "plain", label: "纯黑", hint: "关闭动态背景" },
];

export const WALLPAPER_OPTIONS: { key: WallpaperKey; label: string; hint: string }[] = [
  { key: "none", label: "无", hint: "不使用壁纸（默认）" },
  { key: "custom", label: "自定义", hint: "使用自定义图片 URL" },
];

export const STYLE_OPTIONS: { key: StyleKey; label: string; hint: string }[] = [
  { key: "simple", label: "简洁", hint: "完全不透光，无动效（默认）" },
  { key: "fullscreen", label: "全屏", hint: "高透亮样式，全动效" },
  { key: "banner", label: "横幅", hint: "突出头部壁纸区域" },
];

const HUE_KEY = "hypervoid:hue";
const BG_KEY = "hypervoid:bg";
const FONT_KEY = "hypervoid:font";
const FONT_SIZE_KEY = "hypervoid:font-size";
const WALLPAPER_KEY = "hypervoid:wallpaper";
const WALLPAPER_CUSTOM_KEY = "hypervoid:wallpaper-custom";
const STYLE_KEY = "hypervoid:style";
const SETTINGS_SCHEMA_KEY = "hypervoid:settings-schema";
const SETTINGS_SCHEMA_VERSION = "4";

type SettingsValue = {
  hue: number;
  background: BackgroundKey;
  font: FontKey;
  fontSize: FontSizeKey;
  wallpaper: WallpaperKey;
  wallpaperCustomUrl: string;
  style: StyleKey;
  setHue: (v: number) => void;
  setBackground: (v: BackgroundKey) => void;
  setFont: (v: FontKey) => void;
  setFontSize: (v: FontSizeKey) => void;
  setWallpaper: (v: WallpaperKey) => void;
  setWallpaperCustomUrl: (v: string) => void;
  setStyle: (v: StyleKey) => void;
  reset: () => void;
};

const SettingsContext = createContext<SettingsValue>({
  hue: DEFAULT_HUE,
  background: DEFAULT_BACKGROUND,
  font: DEFAULT_FONT,
  fontSize: DEFAULT_FONT_SIZE,
  wallpaper: DEFAULT_WALLPAPER,
  wallpaperCustomUrl: "",
  style: DEFAULT_STYLE,
  setHue: () => {},
  setBackground: () => {},
  setFont: () => {},
  setFontSize: () => {},
  setWallpaper: () => {},
  setWallpaperCustomUrl: () => {},
  setStyle: () => {},
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
    root.dataset.wallpaper = "none";
    return;
  }
  if (wp === "custom" && customUrl) {
    root.style.setProperty("--wallpaper-url", `url("${customUrl}")`);
  } else {
    root.style.removeProperty("--wallpaper-url");
  }
  root.dataset.wallpaper = wp;
}

function applyStyle(style: StyleKey) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.style = style;
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
  const [style, setStyleState] = useState<StyleKey>(DEFAULT_STYLE);

  useEffect(() => {
    try {
      const migrated = localStorage.getItem(SETTINGS_SCHEMA_KEY) === SETTINGS_SCHEMA_VERSION;
      if (!migrated) {
        localStorage.removeItem(HUE_KEY);
        localStorage.removeItem(DISPLAY_MODE_KEY);
        // 清除旧壁纸选项
        localStorage.removeItem(WALLPAPER_KEY);
        localStorage.removeItem(WALLPAPER_CUSTOM_KEY);
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
      if (storedWallpaper === "custom" && storedCustomUrl) {
        setWallpaperState("custom");
        setWallpaperCustomUrlState(storedCustomUrl);
        applyWallpaper("custom", storedCustomUrl);
      } else {
        setWallpaperState(DEFAULT_WALLPAPER);
        applyWallpaper(DEFAULT_WALLPAPER, "");
      }

      const storedStyle = localStorage.getItem(STYLE_KEY) as StyleKey | null;
      if (storedStyle && STYLE_OPTIONS.some((o) => o.key === storedStyle)) {
        setStyleState(storedStyle);
        applyStyle(storedStyle);
      } else {
        setStyleState(DEFAULT_STYLE);
        applyStyle(DEFAULT_STYLE);
      }
    } catch {
      applyHue(DEFAULT_HUE);
      applyBackground(DEFAULT_BACKGROUND);
      applyFont(DEFAULT_FONT);
      applyFontSize(DEFAULT_FONT_SIZE);
      applyWallpaper(DEFAULT_WALLPAPER, "");
      applyStyle(DEFAULT_STYLE);
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

  const setStyle = useCallback((v: StyleKey) => {
    setStyleState(v);
    applyStyle(v);
    try {
      localStorage.setItem(STYLE_KEY, v);
    } catch {
      /* ignore */
    }
  }, []);

  const reset = useCallback(() => {
    setHue(DEFAULT_HUE);
    setBackground(DEFAULT_BACKGROUND);
    setFont(DEFAULT_FONT);
    setFontSize(DEFAULT_FONT_SIZE);
    setWallpaper(DEFAULT_WALLPAPER);
    setWallpaperCustomUrl("");
    setStyle(DEFAULT_STYLE);
  }, [setHue, setBackground, setFont, setFontSize, setWallpaper, setWallpaperCustomUrl, setStyle]);

  return (
    <SettingsContext.Provider
      value={{
        hue,
        background,
        font,
        fontSize,
        wallpaper,
        wallpaperCustomUrl,
        style,
        setHue,
        setBackground,
        setFont,
        setFontSize,
        setWallpaper,
        setWallpaperCustomUrl,
        setStyle,
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
