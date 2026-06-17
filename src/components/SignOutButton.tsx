"use client";

import { useCallback, useState, useTransition } from "react";

/**
 * Logout via server action. Calls the server-side signOut from @/auth
 * which properly handles CSRF, cookies, and session invalidation.
 */
export function SignOutButton({
  redirectTo = "/",
  className = "",
  children = "退出登录",
  signOutAction,
  ...rest
}: {
  redirectTo?: string;
  className?: string;
  children?: React.ReactNode;
  signOutAction: () => Promise<void>;
} & React.HTMLAttributes<HTMLElement>) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleClick = useCallback(() => {
    setError(null);
    startTransition(async () => {
      try {
        await signOutAction();
      } catch (e) {
        setError(e instanceof Error ? e.message : "退出失败");
      }
    });
  }, [signOutAction]);

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className={className}
        {...rest}
      >
        {children}
      </button>
      {error && (
        <span className="ml-2 text-xs text-red-400">{error}</span>
      )}
    </>
  );
}
