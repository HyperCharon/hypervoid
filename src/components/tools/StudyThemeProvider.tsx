"use client";

import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";

/**
 * Minimal theme context for the study subdomain — deliberately independent of
 * the main site's Providers (no Settings/Locale/Player, no Backdrop, no command
 * palette, no analytics). next-themes keeps its own per-origin localStorage key,
 * so study's light/dark choice is separate from the blog's.
 */
export function StudyThemeProvider({
  children,
  nonce,
}: {
  children: ReactNode;
  nonce?: string;
}) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      themes={["dark", "light"]}
      enableSystem
      disableTransitionOnChange
      nonce={nonce}
    >
      {children}
    </ThemeProvider>
  );
}
