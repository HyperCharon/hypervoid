"use client";

import { useTransition } from "react";
import { recordLogoutAction } from "@/app/signout-action";

/**
 * Logout button. Records the logout timestamp server-side (for stale-JWT
 * protection), then manually POSTs to NextAuth's signout endpoint to clear
 * all cookies (bypasses next-auth/react's signOut which can throw stream
 * errors in some environments), and finally hard-navigates to /sign-in.
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
    // Clear guest flag
    try {
      localStorage.removeItem("hypervoid:guest");
    } catch {
      // ignore
    }
    startTransition(async () => {
      // 1. Record logout timestamp (server-side, for proxy stale-JWT check)
      await recordLogoutAction();
      // 2. Clear NextAuth cookies via the signout endpoint directly
      try {
        const csrfRes = await fetch("/api/auth/csrf");
        const { csrfToken } = await csrfRes.json();
        await fetch("/api/auth/signout", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ csrfToken, callbackUrl: "/" }),
        });
      } catch {
        // ignore — cookies may already be cleared
      }
      // 3. Hard navigation so the server sees cleared cookies
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
