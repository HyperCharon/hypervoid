"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { isFullScreenContext } from "@/lib/fullscreen-routes";

export function RouteChromeState() {
  const pathname = usePathname();

  useEffect(() => {
    document.documentElement.dataset.fullscreenRoute = isFullScreenContext(pathname) ? "true" : "false";
  }, [pathname]);

  return null;
}
