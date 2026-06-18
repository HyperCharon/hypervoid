"use client";

import { useTransition } from "react";
import { signOut } from "next-auth/react";
import { recordLogoutTimestampAction } from "@/app/signout-action";

/**
 * Logout button.
 *
 * 1. Records the logout timestamp (for proxy stale-JWT check).
 * 2. Calls next-auth/react's signOut({ redirect: false }) which POSTs
 *    to /api/auth/signout with the X-Auth-Return-Redirect header,
 *    causing the server to return JSON instead of a 302.
 * 3. Hard-navigates to /sign-in.
 *
 * Falls back to navigation if signOut throws.
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
        await recordLogoutTimestampAction();
        await signOut({ redirect: false });
      } catch {
        // signOut can throw — the hard navigation below still works;
        // proxy stale-JWT check is the safety net.
      }
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
