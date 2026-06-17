"use client";

import { useCallback, useState } from "react";

/**
 * Reliable logout. Uses fetch to POST to the NextAuth signout endpoint,
 * then forces a full page reload to clear client state.
 */
export function SignOutButton({
  redirectTo = "/",
  className = "",
  children = "退出登录",
  ...rest
}: {
  redirectTo?: string;
  className?: string;
  children?: React.ReactNode;
} & React.HTMLAttributes<HTMLElement>) {
  const [loading, setLoading] = useState(false);

  const handleClick = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Get a fresh CSRF token
      const csrfRes = await fetch("/api/auth/csrf");
      const { csrfToken } = await csrfRes.json();

      // 2. POST to signout endpoint
      await fetch("/api/auth/signout", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ csrfToken, callbackUrl: redirectTo }),
        redirect: "manual", // don't follow the redirect automatically
      });

      // 3. Force full page reload — clears all client state + picks up
      //    the cleared session cookie from the Set-Cookie header.
      window.location.href = redirectTo;
    } catch {
      // Fallback: just navigate (session cookie might still be set,
      // but at least the user isn't stuck)
      window.location.href = redirectTo;
    }
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
