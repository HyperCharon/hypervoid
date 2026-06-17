"use client";

import { useCallback, useState } from "react";

/**
 * Minimal logout: fetch CSRF + POST signout + force reload.
 * No dependency on next-auth/react at all.
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
    if (loading) return;
    setLoading(true);
    try {
      // 1. Get CSRF token
      const csrfRes = await fetch("/api/auth/csrf");
      const { csrfToken } = await csrfRes.json();

      // 2. POST signout — use redirect:"follow" so the browser
      //    processes the 302 + Set-Cookie header naturally.
      await fetch("/api/auth/signout", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ csrfToken, callbackUrl: redirectTo }),
        redirect: "follow",
      });
    } catch {
      // ignore
    }
    // 3. Force reload — the Set-Cookie from signout should have
    //    cleared the session cookie by now.
    window.location.href = redirectTo;
  }, [loading, redirectTo]);

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
