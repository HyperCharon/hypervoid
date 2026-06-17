"use client";

import { signOut } from "next-auth/react";
import { useState } from "react";

/**
 * Reliable logout button. Tries client-side signOut first; if it
 * doesn't redirect within 2s, falls back to a form POST to the
 * signout endpoint so the browser navigates regardless.
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
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const [fallingBack, setFallingBack] = useState(false);

  async function handleSignOut() {
    try {
      await signOut({ callbackUrl: redirectTo, redirect: true });
    } catch {
      // signOut threw — use form fallback
      setFallingBack(true);
    }
    // If signOut resolved but didn't navigate (happens in some NextAuth
    // beta builds), fall back after a short delay.
    setTimeout(() => setFallingBack(true), 2000);
  }

  // Form fallback — POSTs directly to the signout endpoint.
  if (fallingBack) {
    return (
      <form method="POST" action="/api/auth/signout" className="inline">
        <input type="hidden" name="callbackUrl" value={redirectTo} />
        <button type="submit" className={className} {...rest}>
          {children}
        </button>
      </form>
    );
  }

  return (
    <button type="button" onClick={handleSignOut} className={className} {...rest}>
      {children}
    </button>
  );
}
