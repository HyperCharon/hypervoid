"use client";

import { signOut } from "next-auth/react";
import { useCallback, useTransition } from "react";

/**
 * Logout button. Calls client-side signOut to clear the session cookie,
 * then forces a full page reload to /sign-in.
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
      try {
        await signOut({ redirect: false });
      } catch {
        // signOut may throw — that's expected
      }
      window.location.href = "/sign-in";
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
