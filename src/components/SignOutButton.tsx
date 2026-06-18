"use client";

import { useEffect, useState } from "react";

/**
 * Logout button. Uses a native <form method="POST"> to the NextAuth
 * signout endpoint — no fetch, no signOut(), no server actions.
 * The browser handles the 302 redirect + Set-Cookie headers natively.
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
    <form method="POST" action="/api/auth/signout" className="inline">
      <input type="hidden" name="csrfToken" value={csrfToken} />
      <input type="hidden" name="callbackUrl" value={redirectTo} />
      <button type="submit" className={className} {...rest}>
        {children}
      </button>
    </form>
  );
}
