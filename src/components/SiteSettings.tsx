"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  Bot,
  Download,
  ImageIcon,
  Moon,
  RotateCcw,
  Settings2,
  Sun,
  Type,
  X,
} from "lucide-react";
import { useTheme } from "next-themes";
import {
  FONT_SIZE_OPTIONS,
  STYLE_OPTIONS,
  useSettings,
} from "@/components/SettingsProvider";
import { isMascotEnabled, setMascotEnabled } from "@/components/Live2DMascot";
import { useInstallPrompt } from "@/components/PwaInstallController";

const MASCOT_ENABLED_KEY = "hypervoid:mascot";
const MASCOT_ENABLED_EVENT = "hypervoid:mascot-changed";

const THEME_OPTIONS = [
  { key: "dark", icon: Moon, label: "暗色", labelEn: "Dark" },
  { key: "light", icon: Sun, label: "亮色", labelEn: "Light" },
] as const;

function ThemeSelector({
  optionBase,
  active,
  idle,
}: {
  optionBase: string;
  active: string;
  idle: string;
}) {
  const { resolvedTheme, setTheme } = useTheme();
  const current = resolvedTheme ?? "dark";
  return (
    <div className="grid grid-cols-2 gap-2">
      {THEME_OPTIONS.map((o) => {
        const isActive = current === o.key;
        const Icon = o.icon;
        return (
          <button
            key={o.key}
            type="button"
            onClick={() => setTheme(o.key)}
            aria-pressed={isActive}
            className={[optionBase, "flex-col items-center gap-1", isActive ? active : idle].join(" ")}
          >
            <Icon className="h-4 w-4" aria-hidden />
            <span className="text-xs font-medium">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function SettingSection({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="hv-settings-option p-3">
      <div className="mb-3 flex items-center gap-2 font-mono text-[11px] uppercase text-muted-soft">
        <span className="grid h-6 w-6 place-items-center border border-border bg-card text-accent">
          {icon}
        </span>
        {title}
      </div>
      {children}
    </section>
  );
}

export function SiteSettings({
  triggerClassName,
  triggerChildren,
  triggerStyle,
}: {
  triggerClassName?: string;
  triggerChildren?: ReactNode;
  triggerStyle?: React.CSSProperties;
} = {}) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mascot, setMascot] = useState(false);
  const { available: installAvailable, install } = useInstallPrompt();
  const { fontSize, style, setFontSize, setStyle, reset } = useSettings();

  useEffect(() => {
    setMounted(true);
    setMascot(isMascotEnabled());
    const mql = window.matchMedia("(max-width: 767px)");
    const sync = () => setIsMobile(mql.matches);
    sync();
    mql.addEventListener("change", sync);
    const syncMascotEnabled = () => setMascot(isMascotEnabled());
    const onMascotChanged = (e: Event) => {
      const enabled = (e as CustomEvent<boolean>).detail;
      setMascot(typeof enabled === "boolean" ? enabled : isMascotEnabled());
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === MASCOT_ENABLED_KEY) syncMascotEnabled();
    };
    window.addEventListener(MASCOT_ENABLED_EVENT, onMascotChanged);
    window.addEventListener("storage", onStorage);
    return () => {
      mql.removeEventListener("change", sync);
      window.removeEventListener(MASCOT_ENABLED_EVENT, onMascotChanged);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  useEffect(() => {
    if (!open || !isMobile) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, isMobile]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === ",") {
        e.preventDefault();
        setOpen((v) => !v);
        return;
      }
      if (e.key === "Escape" && open) setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Click outside to close
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    // Delay to avoid closing from the same click that opened
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", onClick);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  const optionBase =
    "relative flex min-h-11 items-center justify-between gap-3 border px-3 py-2 text-left text-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent";
  const active = "hv-settings-option-active";
  const idle = "hv-settings-option";

  const panel = open ? (
    <div
      ref={panelRef}
      role="dialog"
      aria-label="界面控制"
      className="hv-settings-panel fixed inset-x-3 bottom-3 z-[55] max-h-[86dvh] overflow-y-auto md:absolute md:inset-x-auto md:bottom-auto md:right-0 md:top-12 md:w-[21rem]"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom, 0px))" }}
    >
        <div className="hv-settings-header sticky top-0 z-10 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="hv-settings-label font-mono text-xs uppercase">Interface Console</p>
              <h2 className="hv-settings-title mt-1 text-base font-black tracking-normal">界面控制</h2>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={reset}
                aria-label="重置界面控制"
                title="重置"
                className="hv-settings-btn grid h-9 w-9 place-items-center transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <RotateCcw className="h-4 w-4" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="关闭界面控制"
                className="hv-settings-btn grid h-9 w-9 place-items-center transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent md:hidden"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-3 p-4">
          <SettingSection icon={<Moon className="h-3.5 w-3.5" aria-hidden />} title="主题">
            <ThemeSelector optionBase={optionBase} active={active} idle={idle} />
          </SettingSection>
          <SettingSection icon={<ImageIcon className="h-3.5 w-3.5" aria-hidden />} title="页面样式">
            <div className="grid grid-cols-3 gap-2">
              {STYLE_OPTIONS.map((o) => {
                const isActive = style === o.key;
                return (
                  <button
                    key={o.key}
                    type="button"
                    onClick={() => setStyle(o.key)}
                    aria-pressed={isActive}
                    title={o.hint}
                    className={[optionBase, "flex-col items-center gap-1 p-2", isActive ? active : idle].join(" ")}
                  >
                    <span className="text-xs font-medium">{o.label}</span>
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-muted-soft">
              {STYLE_OPTIONS.find((o) => o.key === style)?.hint}
            </p>
          </SettingSection>

          <SettingSection icon={<Type className="h-3.5 w-3.5" aria-hidden />} title="阅读字号">
            <div className="grid grid-cols-2 gap-2">
              {FONT_SIZE_OPTIONS.map((o) => {
                const isActive = fontSize === o.key;
                return (
                  <button
                    key={o.key}
                    type="button"
                    onClick={() => setFontSize(o.key)}
                    aria-pressed={isActive}
                    title={o.hint}
                    className={[optionBase, "flex-col items-start justify-center", isActive ? active : idle].join(" ")}
                  >
                    <span className="font-semibold">{o.label}</span>
                    <span className="text-xs hv-settings-hint">{o.hint}</span>
                  </button>
                );
              })}
            </div>
          </SettingSection>

          {!isMobile ? (
            <SettingSection icon={<Bot className="h-3.5 w-3.5" aria-hidden />} title="看板娘">
              <button
                type="button"
                onClick={() => {
                  const nextMascot = !mascot;
                  setMascot(nextMascot);
                  setMascotEnabled(nextMascot);
                }}
                aria-pressed={mascot}
                className={[optionBase, "w-full", mascot ? active : idle].join(" ")}
              >
                <span>
                  <span className="block font-semibold">{mascot ? "已开启" : "已关闭"}</span>
                  <span className="mt-0.5 block text-xs hv-settings-hint">右下角交互角色，仅桌面显示。</span>
                </span>
                <span
                  aria-hidden
                  className={["relative h-5 w-9 border transition rounded-full", mascot ? "border-accent bg-accent" : "border-border bg-card"].join(" ")}
                >
                  <span className={["absolute top-0.5 h-3.5 w-3.5 rounded-full bg-background transition-transform", mascot ? "translate-x-[1.125rem]" : "translate-x-0.5"].join(" ")} />
                </span>
              </button>
            </SettingSection>
          ) : null}

          {installAvailable ? (
            <SettingSection icon={<Download className="h-3.5 w-3.5" aria-hidden />} title="安装">
              <button type="button" onClick={install} className={[optionBase, "w-full", idle].join(" ")}>
                <span>
                  <span className="block font-semibold">安装 Hypervoid</span>
                  <span className="mt-0.5 block text-xs hv-settings-hint">添加到桌面或主屏，使用离线缓存。</span>
                </span>
                <Download className="h-4 w-4 shrink-0 text-accent" aria-hidden />
              </button>
            </SettingSection>
          ) : null}

          <p className="hv-settings-footer hv-settings-divider hidden pt-3 font-mono text-xs uppercase md:block">
            Cmd/Ctrl + , open · Esc close
          </p>
        </div>
    </div>
  ) : null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="界面控制"
        aria-expanded={open}
        title="界面控制 (Cmd/Ctrl+,)"
        className={triggerClassName ?? "hv-settings-btn grid h-10 w-10 place-items-center backdrop-blur-xl transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"}
        style={triggerStyle}
      >
        {triggerChildren ?? <Settings2 className="h-4 w-4" aria-hidden />}
      </button>
      {mounted && isMobile && panel ? createPortal(panel, document.body) : panel}
    </div>
  );
}
