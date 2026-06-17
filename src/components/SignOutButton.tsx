"use client";

import { signOut } from "next-auth/react";
import { useCallback, useTransition } from "react";

/**
 * Logout button. Calls client-side signOut which POSTs to /api/auth/signout,
 * clears the session cookie, and redirects to /sign-in.
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

  const handleClick = useCallback(() => {
    startTransition(async () => {
      await signOut({ callbackUrl: "/sign-in" });
    });
  }, []);

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
