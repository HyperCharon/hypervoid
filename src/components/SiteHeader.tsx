"use client";

import Link from "next/link";
import Image from "next/image";
import { Home, ArrowUpRight } from "lucide-react";
import { NavGroups } from "@/components/NavGroups";
import { HypervoidWordmark } from "@/components/HypervoidWordmark";
import { HeaderDock } from "@/components/HeaderDock";
import { MobileDock } from "@/components/MobileDock";
import { useT, useLocale } from "@/components/LocaleProvider";

export function SiteHeader({ cvVisible = false, hasSession = false }: { cvVisible?: boolean; hasSession?: boolean }) {
  const t = useT();
  const { locale } = useLocale();
  return (
    <header
      className="hv-site-header hv-grad-header sticky top-0 z-40 w-full text-foreground"
      style={{ viewTransitionName: "site-header" }}
    >
      <div className="mx-auto flex max-w-[120rem] items-center px-3 sm:px-6 lg:px-10 xl:px-12" style={{ height: "56px" }}>
        {/* Left: Logo + Home */}
        <div className="flex min-h-9 shrink-0 items-center gap-1 font-bold tracking-tight sm:gap-2.5 sm:min-h-11">
          <Link
            href="/sign-in"
            aria-label="Hypervoid"
            className="hv-brand-orbit group inline-flex h-8 w-8 items-center justify-center text-muted transition hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:h-9 sm:w-9"
          >
            <span aria-hidden className="inline-flex h-6 w-6 items-center justify-center transition-transform group-hover:rotate-12 sm:h-7 sm:w-7">
              <svg viewBox="0 0 64 64" className="h-6 w-6" role="img" aria-label="Hypervoid">
                <defs>
                  <radialGradient id="hv-core" cx="0.4" cy="0.35" r="0.8">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="60%" stopColor="currentColor" stopOpacity="0.95" />
                    <stop offset="100%" stopColor="currentColor" stopOpacity="0.7" />
                  </radialGradient>
                </defs>
                <rect width="64" height="64" rx="14" fill="currentColor" opacity="0.1" />
                <ellipse cx="32" cy="32" rx="24" ry="9" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.92" />
                <ellipse cx="32" cy="32" rx="24" ry="9" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.4" transform="rotate(72 32 32)" />
                <circle cx="32" cy="32" r="4.5" fill="url(#hv-core)" />
              </svg>
            </span>
          </Link>
          <Link
            href="/"
            className="grid h-8 w-8 place-items-center rounded-lg text-muted-soft transition hover:bg-card-hover hover:text-foreground sm:hidden"
            aria-label="首页"
          >
            <Home className="h-4 w-4" />
          </Link>
          <Link
            href="/"
            className="hidden min-h-8 items-center text-foreground transition-opacity hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:inline-flex"
            aria-label="返回 Hypervoid 主页"
          >
            <HypervoidWordmark className="h-5 w-auto" />
          </Link>
          {cvVisible ? (
            <Link
              href="/cv"
              className="hv-cv-chip group ml-1 hidden items-center gap-2 rounded-full border border-border bg-card py-1 pl-1 pr-2.5 transition hover:border-accent/60 hover:bg-card-hover xl:inline-flex"
              aria-label={locale === "en" ? "View résumé" : "查看简历"}
            >
              <span className="relative inline-flex h-6 w-6 shrink-0">
                <Image
                  src="/avatar.jpg"
                  alt=""
                  width={24}
                  height={24}
                  className="h-6 w-6 rounded-full object-cover ring-1 ring-border"
                />
                <span className="absolute -bottom-px -right-px h-2 w-2 rounded-full border border-card bg-[#3ddc97]" />
              </span>
              <span className="text-xs font-semibold text-foreground transition group-hover:text-accent">
                {locale === "en" ? "Résumé" : "简历"}
              </span>
              <ArrowUpRight className="h-3.5 w-3.5 text-muted-soft transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent" />
            </Link>
          ) : null}
        </div>

        {/* Center: Desktop nav — flex-1 on both sides to truly center */}
        <div className="mx-auto hidden min-w-0 flex-1 justify-center xl:flex">
          <NavGroups />
        </div>

        {/* Right: Desktop dock / Mobile dock */}
        <div className="ml-auto flex shrink-0 items-center xl:ml-0">
          <HeaderDock hasSession={hasSession} />
          <MobileDock hasSession={hasSession} />
        </div>
      </div>
    </header>
  );
}
