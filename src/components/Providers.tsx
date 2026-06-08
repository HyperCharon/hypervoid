"use client";

import { ThemeProvider } from "next-themes";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { LocaleProvider } from "@/components/LocaleProvider";
import { PlayerProvider } from "@/components/PlayerProvider";
import { isCvContext } from "@/lib/fullscreen-routes";

export function Providers({
  children,
  nonce,
}: {
  children: ReactNode;
  nonce?: string;
}) {
  const pathname = usePathname();
  // Admin is a dark-first control panel and /cv is a dark-by-design résumé;
  // force dark on both regardless of the user's site theme (their light-on-dark
  // UI is unreadable / leaky in light mode). isCvContext also covers the cv
  // subdomain root, where the path is "/" after a rewrite. Reverts on leaving.
  const forcedTheme =
    pathname?.startsWith("/admin") || isCvContext(pathname ?? "") ? "dark" : undefined;

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      themes={["dark", "light"]}
      enableSystem
      disableTransitionOnChange
      nonce={nonce}
      forcedTheme={forcedTheme}
    >
      <LocaleProvider>
        <PlayerProvider>{children}</PlayerProvider>
      </LocaleProvider>
    </ThemeProvider>
  );
}
