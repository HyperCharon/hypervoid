"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { useTheme } from "next-themes";
import { useEffect, useState, type ReactNode } from "react";
import { Languages, LogOut, Moon, Search, Settings2, Sun } from "lucide-react";
import { useLocale } from "@/components/LocaleProvider";
import { LOCALES, LOCALE_LABEL } from "@/lib/i18n";
import { SiteSettings } from "@/components/SiteSettings";
import { NotificationBell } from "@/components/NotificationBell";
import { signOut } from "@/auth.client";

function DockIcon({ children }: { children: ReactNode }) {
  return <span className="hv-dock-icon">{children}</span>;
}

function DockSlot({ label, className = "", children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <motion.div
      className={["hv-dock-item", className].filter(Boolean).join(" ")}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.16, ease: "easeOut" }}
    >
      {children}
      <span className="hv-dock-label" role="tooltip">{label}</span>
    </motion.div>
  );
}


function ThemeDockButton() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted ? resolvedTheme !== "light" : true;
  const nextTheme = isDark ? "light" : "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(nextTheme)}
      className="hv-dock-trigger"
      aria-label={isDark ? "切换到浅色主题" : "切换到深色主题"}
      title={isDark ? "切换到浅色主题" : "切换到深色主题"}
    >
      <DockIcon>{isDark ? <Moon className="h-4 w-4" aria-hidden /> : <Sun className="h-4 w-4" aria-hidden />}</DockIcon>
    </button>
  );
}

export function HeaderDock() {
  const { locale, setLocale, t } = useLocale();
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/session")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (active) setHasSession(Boolean(data?.user));
      })
      .catch(() => {
        if (active) setHasSession(false);
      });
    return () => {
      active = false;
    };
  }, []);
  const nextLocale = LOCALES[(LOCALES.indexOf(locale) + 1) % LOCALES.length];

  return (
    <div className="hidden items-center xl:flex">
      <div className="hv-dock-panel" role="toolbar" aria-label="快捷操作">
        <DockSlot label={t.common.search}>
          <Link href="/search" className="hv-dock-trigger" aria-label={t.common.search} title={t.common.search}>
            <DockIcon><Search className="h-4 w-4" aria-hidden /></DockIcon>
          </Link>
        </DockSlot>

        <DockSlot label={t.common.toggleLocale} className="hv-dock-item-language">
          <button type="button" onClick={() => setLocale(nextLocale)} className="hv-dock-trigger" aria-label={t.common.toggleLocale} title={t.common.toggleLocale}>
            <DockIcon><Languages className="h-4 w-4" aria-hidden /></DockIcon>
          </button>
        </DockSlot>

        <DockSlot label="主题">
          <ThemeDockButton />
        </DockSlot>

        <DockSlot label="界面控制">
          <SiteSettings
            triggerClassName="hv-dock-trigger"
            triggerChildren={<DockIcon><Settings2 className="h-4 w-4" aria-hidden /></DockIcon>}
          />
        </DockSlot>

        <DockSlot label="消息">
          <NotificationBell triggerClassName="hv-dock-trigger" />
        </DockSlot>

        {hasSession ? (
          <DockSlot label="退出登录" className="hv-dock-item-danger">
            <button type="button" onClick={() => signOut({ redirectTo: "/" })} className="hv-dock-trigger" aria-label="退出登录" title="退出登录">
              <DockIcon><LogOut className="h-4 w-4" aria-hidden /></DockIcon>
            </button>
          </DockSlot>
        ) : null}
      </div>
      <span className="sr-only" aria-live="polite">当前语言 {LOCALE_LABEL[locale]}</span>
    </div>
  );
}
