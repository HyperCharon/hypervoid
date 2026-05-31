"use client";

import Link from "next/link";
import { MobileNav } from "@/components/MobileNav";
import { NavGroups } from "@/components/NavGroups";
import { HypervoidWordmark } from "@/components/HypervoidWordmark";
import { HeaderDock } from "@/components/HeaderDock";
import { useT } from "@/components/LocaleProvider";

export function SiteHeader() {
  const t = useT();
  return (
    <header
      className="hv-site-header hv-grad-header sticky top-0 z-40 w-full text-foreground backdrop-blur-[24px] saturate-[1.4]"
      style={{ viewTransitionName: "site-header" }}
    >
      <div className="mx-auto flex h-14 max-w-[100rem] items-center gap-2 px-4 sm:gap-3 sm:px-6 lg:px-8">
        <div className="flex min-h-11 shrink-0 items-center gap-2 font-bold tracking-tight sm:gap-2.5">
          <Link
            href="/sign-in"
            aria-label={`${t.common.signIn} Hypervoid`}
            title={t.common.signIn}
            className="hv-brand-orbit group inline-flex h-9 w-9 items-center justify-center text-muted transition hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <span aria-hidden className="inline-flex h-7 w-7 items-center justify-center transition-transform group-hover:rotate-12">
              <svg
                viewBox="0 0 64 64"
                className="h-6 w-6"
                role="img"
                aria-label="Hypervoid"
              >
                <defs>
                  <radialGradient id="hv-core" cx="0.4" cy="0.35" r="0.8">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="60%" stopColor="currentColor" stopOpacity="0.95" />
                    <stop offset="100%" stopColor="currentColor" stopOpacity="0.7" />
                  </radialGradient>
                </defs>
                <rect width="64" height="64" rx="14" fill="currentColor" opacity="0.1" />
                <ellipse
                  cx="32"
                  cy="32"
                  rx="24"
                  ry="9"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  opacity="0.92"
                />
                <ellipse
                  cx="32"
                  cy="32"
                  rx="24"
                  ry="9"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  opacity="0.4"
                  transform="rotate(72 32 32)"
                />
                <circle cx="32" cy="32" r="4.5" fill="url(#hv-core)" />
              </svg>
            </span>
          </Link>
          <Link
            href="/"
            className="hidden min-h-10 items-center text-foreground transition-opacity hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:inline-flex"
            aria-label="返回 Hypervoid 主页"
          >
            <HypervoidWordmark className="h-5 w-auto" />
          </Link>
        </div>

        <div className="mx-auto min-w-0">
          <NavGroups />
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <HeaderDock />
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
