"use client";

import { ThemeProvider } from "next-themes";
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
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      themes={["dark", "light"]}
      enableSystem
      disableTransitionOnChange
      nonce={nonce}
    >
      <LocaleProvider>
        <PlayerProvider>{children}</PlayerProvider>
      </LocaleProvider>
    </ThemeProvider>
  );
}
