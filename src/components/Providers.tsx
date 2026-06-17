"use client";

import { ThemeProvider } from "next-themes";
import { SessionProvider } from "next-auth/react";
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
  // /cv is a dark-by-design résumé — force dark regardless of user theme.
  // Admin now follows the user's theme preference (supports light/dark).
  const forcedTheme = isCvContext(pathname ?? "") ? "dark" : undefined;

  return (
    <SessionProvider>
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
    </SessionProvider>
  );
}
