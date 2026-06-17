"use client";

import { useEffect, useState } from "react";

/**
 * Zero-dependency logout button. No useSession, no SessionProvider.
 * Fetches CSRF token from NextAuth, then submits a form POST.
 * Renders unconditionally — parent controls visibility via server-side session.
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
  const [csrfToken, setCsrfToken] = useState("");

  useEffect(() => {
    fetch("/api/auth/csrf")
      .then((r) => r.json())
      .then((data) => setCsrfToken(data?.csrfToken ?? ""))
      .catch(() => {});
  }, []);

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
