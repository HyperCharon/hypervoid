"use client";

import { ThemeProvider } from "next-themes";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { LocaleProvider } from "@/components/LocaleProvider";
import { PlayerProvider } from "@/components/PlayerProvider";

export function Providers({
  children,
  nonce,
}: {
  children: ReactNode;
  nonce?: string;
}) {
  const pathname = usePathname();
  // Admin is a dark-first control panel; force dark there regardless of the
  // user's site theme (its light-on-dark UI is unreadable in light mode).
  // Reverts to the user's theme on leaving /admin; updates on client-side nav.
  const forcedTheme = pathname?.startsWith("/admin") ? "dark" : undefined;

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
