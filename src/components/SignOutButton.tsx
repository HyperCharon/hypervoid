"use client";

import { useCallback, useState } from "react";
import { recordLogoutTimestampAction } from "@/app/signout-action";

/**
 * Reliable logout. Uses fetch to POST to the NextAuth signout endpoint
 * with redirect:"manual" (don't follow the 302 — just let the browser
 * apply the Set-Cookie headers), then forces a full page reload.
 */
export function SignOutButton({
  redirectTo = "/sign-in",
  className = "",
  children = "退出登录",
  ...rest
}: {
  redirectTo?: string;
  className?: string;
  children?: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const [loading, setLoading] = useState(false);

  const handleClick = useCallback(async () => {
    setLoading(true);
    try {
      localStorage.removeItem("hypervoid:guest");
    } catch {
      // ignore
    }
    try {
      // 1. Record logout timestamp (for proxy stale-JWT check)
      await recordLogoutTimestampAction();
    } catch {
      // ignore
    }
    try {
      // 2. Get a fresh CSRF token
      const csrfRes = await fetch("/api/auth/csrf");
      const { csrfToken } = await csrfRes.json();

      // 3. POST to signout endpoint — redirect:"manual" prevents the
      //    browser from following the 302, avoiding the "Error in input
      //    stream" that happens when trying to parse a redirect response
      //    as JSON. Set-Cookie headers are still applied.
      await fetch("/api/auth/signout", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ csrfToken, callbackUrl: redirectTo }),
        redirect: "manual",
      });
    } catch {
      // Fallback: navigate anyway (proxy stale-JWT check is the safety net)
    }
    // 4. Force full page reload — clears all client state + picks up
    //    the cleared session cookie from the Set-Cookie header.
    window.location.href = redirectTo;
  }, [redirectTo]);

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={className}
      {...rest}
    >
      {children}
    </button>
  );
}
