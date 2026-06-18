"use client";

import { useTransition } from "react";
import { recordLogoutTimestampAction } from "@/app/signout-action";

/**
 * Logout button.
 *
 * 1. Records the logout timestamp server-side (for proxy stale-JWT check).
 * 2. POSTs to NextAuth's /api/auth/signout endpoint directly — bypasses
 *    next-auth/react's signOut() which can throw stream errors.
 * 3. Hard-navigates to /sign-in.
 *
 * The proxy's stale-JWT check is the safety net: even if cookie clearing
 * fails (e.g. __Secure- prefix on HTTP), the hv-logout-at timestamp
 * ensures the old session is rejected.
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
        // 1. Record logout timestamp (server action)
        await recordLogoutTimestampAction();
        // 2. Clear NextAuth cookies via signout endpoint
        const { csrfToken } = await fetch("/api/auth/csrf").then((r) => r.json());
        await fetch("/api/auth/signout", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ csrfToken }),
        });
      } catch {
        // ignore — proxy stale-JWT check is the safety net
      }
      // 3. Hard navigation
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
