"use client";

import { useTransition } from "react";
import { signOut } from "next-auth/react";
import { recordLogoutAction } from "@/app/signout-action";

/**
 * Logout button. Records the logout timestamp server-side (for stale-JWT
 * protection), then calls next-auth/react's signOut() which properly clears
 * all cookies (including __Secure- / __Host- prefixed ones) via POST
 * /api/auth/signout, and finally hard-navigates to /sign-in.
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
    // Clear guest flag
    try {
      localStorage.removeItem("hypervoid:guest");
    } catch {
      // ignore
    }
    startTransition(async () => {
      // 1. Record logout timestamp (server-side, for proxy stale-JWT check)
      await recordLogoutAction();
      // 2. Clear NextAuth cookies via the proper endpoint
      await signOut({ redirect: false });
      // 3. Hard navigation so the server sees cleared cookies
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
