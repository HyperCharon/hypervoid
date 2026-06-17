"use client";

import { signOut } from "next-auth/react";
import { useCallback, useState } from "react";

/**
 * Logout button using signOut from next-auth/react with forced reload.
 * The forced reload ensures the server picks up the cleared session cookie.
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
      // signOut clears the session cookie server-side.
      // redirect: false so we can force a full reload instead of
      // NextAuth's client-side navigation (which sometimes doesn't
      // pick up the cleared cookie).
      await signOut({ redirect: false });
    } catch {
      // ignore — the cookie might already be cleared
    }
    // Force full page reload to pick up the cleared session cookie.
    window.location.href = redirectTo;
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
