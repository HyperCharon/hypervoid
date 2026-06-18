"use client";

import { useTransition } from "react";
import { signOut } from "next-auth/react";
import { recordLogoutTimestampAction } from "@/app/signout-action";

/**
 * Logout button. Calls next-auth/react's signOut() with redirect:false
 * to properly clear all cookies (including __Secure- / __Host- prefixed
 * ones) via POST /api/auth/signout, then hard-navigates to /sign-in.
 *
 * Falls back to hard navigation if signOut throws (e.g. stream errors).
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
        // signOut can throw stream errors in some environments —
        // the hard navigation below ensures the user still lands
        // on /sign-in; stale JWTs are caught by the proxy.
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
