"use client";

import { recordLogoutTimestampAction } from "@/app/signout-action";

/**
 * Logout button.
 *
 * 1. Records the logout timestamp server-side (for proxy stale-JWT check).
 * 2. POSTs to NextAuth's /api/auth/signout endpoint directly — bypasses
 *    next-auth/react's signOut() which can throw stream errors.
 * 3. Hard-navigates to /sign-in.
 *
 * No startTransition — all operations fire-and-forget so nothing blocks
 * the hard navigation. The proxy's stale-JWT check is the safety net.
 */
export function SignOutButton({
  className = "",
  children = "退出登录",
  ...rest
}: {
  className?: string;
  children?: React.ReactNode;
} & React.HTMLAttributes<HTMLElement>) {
  function handleClick() {
    try {
      localStorage.removeItem("hypervoid:guest");
    } catch {
      // ignore
    }
    // Fire-and-forget: record timestamp + clear cookies.
    // Don't await — let the hard navigation proceed immediately.
    recordLogoutTimestampAction().catch(() => {});
    fetch("/api/auth/csrf")
      .then((r) => r.json())
      .then(({ csrfToken }) =>
        fetch("/api/auth/signout", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ csrfToken }),
        }),
      )
      .catch(() => {});
    // Hard navigation — proxy rejects stale JWTs even if cookies persist.
    window.location.href = "/sign-in";
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={className}
      {...rest}
    >
      {children}
    </button>
  );
}
