"use client";

import { useSession } from "next-auth/react";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Reliable logout button. Fetches the CSRF token from NextAuth, then
 * submits a form POST to the signout endpoint. Falls back to
 * window.location if the redirect doesn't happen within 3s.
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
  const { data: session, status } = useSession();
  const [csrfToken, setCsrfToken] = useState<string>("");
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Fetch CSRF token on mount so it's ready when the user clicks.
  useEffect(() => {
    fetch("/api/auth/csrf")
      .then((r) => r.json())
      .then((data) => setCsrfToken(data?.csrfToken ?? ""))
      .catch(() => {});
  }, []);

  const onSubmit = useCallback(() => {
    // Safety net: if the POST redirect doesn't fire within 3s, force nav.
    timerRef.current = setTimeout(() => {
      window.location.href = redirectTo;
    }, 3000);
    return () => clearTimeout(timerRef.current);
  }, [redirectTo]);

  // Don't render while loading or when not authenticated.
  if (status !== "authenticated" || !session?.user) return null;

  return (
    <form
      method="POST"
      action="/api/auth/signout"
      className="inline"
      onSubmit={onSubmit}
    >
      <input type="hidden" name="csrfToken" value={csrfToken} />
      <input type="hidden" name="callbackUrl" value={redirectTo} />
      <button type="submit" className={className} {...rest}>
        {children}
      </button>
    </form>
  );
}
