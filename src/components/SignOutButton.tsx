"use client";

import { useEffect, useState } from "react";

/**
 * Logout button. Uses a native <form method="POST"> to the NextAuth
 * signout endpoint — no fetch, no signOut(), no server actions.
 * The browser handles the 302 redirect + Set-Cookie headers natively.
 *
 * Also clears all possible session cookie names client-side to handle
 * stale cookies left by previous configurations (__Secure- prefix, etc.).
 */

const SESSION_COOKIE_NAMES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
];

function clearAllSessionCookies() {
  for (const name of SESSION_COOKIE_NAMES) {
    // Try with and without Secure flag to cover both HTTP and HTTPS
    document.cookie = `${name}=; path=/; max-age=0`;
    document.cookie = `${name}=; path=/; max-age=0; secure`;
    // Also try with domain variants
    try {
      const host = location.hostname;
      const parts = host.split(".");
      if (parts.length >= 2) {
        const root = parts.slice(-2).join(".");
        document.cookie = `${name}=; path=/; domain=${root}; max-age=0`;
        document.cookie = `${name}=; path=/; domain=${root}; max-age=0; secure`;
        document.cookie = `${name}=; path=/; domain=.${root}; max-age=0`;
        document.cookie = `${name}=; path=/; domain=.${root}; max-age=0; secure`;
      }
    } catch {
      // ignore
    }
  }
}

export function SignOutButton({
  redirectTo = "/sign-in",
  className = "",
  children = "退出登录",
  ...rest
}: {
  redirectTo?: string;
  className?: string;
  children?: React.ReactNode;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "type">) {
  const [csrfToken, setCsrfToken] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/csrf")
      .then((r) => r.json())
      .then((d) => setCsrfToken(d.csrfToken))
      .catch(() => {});
  }, []);

  if (!csrfToken) {
    return (
      <button type="button" disabled className={className} {...rest}>
        {children}
      </button>
    );
  }

  return (
    <form
      method="POST"
      action="/api/auth/signout"
      className="inline"
      onSubmit={clearAllSessionCookies}
    >
      <input type="hidden" name="csrfToken" value={csrfToken} />
      <input type="hidden" name="callbackUrl" value={redirectTo} />
      <button type="submit" className={className} {...rest}>
        {children}
      </button>
    </form>
  );
}
