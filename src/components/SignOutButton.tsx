"use client";

import { useTransition } from "react";
import { serverSignOutAction } from "@/app/signout-action";

/**
 * Logout button.
 *
 * Calls a server action that:
 * 1. Records the logout timestamp (for proxy stale-JWT protection).
 * 2. Calls NextAuth's server-side signOut() to clear all session cookies
 *    via Set-Cookie headers (handles __Secure- / __Host- prefixes).
 *
 * Then hard-navigates to /sign-in. Falls back to navigation if the
 * server action throws (proxy stale-JWT check is the safety net).
 */
export function SignOutButton({
  className = "",
  children = "退出登录",
  ...rest
}: {
  className?: string;
  children?: React.ReactNode;
} & React.HTMLAttributes<HTMLElement>) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    try {
      localStorage.removeItem("hypervoid:guest");
    } catch {
      // ignore
    }
    startTransition(async () => {
      try {
        await serverSignOutAction();
      } catch {
        // Server action may throw redirect error — ignore.
        // The hard navigation below ensures the user leaves the page;
        // stale JWTs are caught by the proxy.
      }
      window.location.href = "/sign-in";
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className={className}
      {...rest}
    >
      {children}
    </button>
  );
}
