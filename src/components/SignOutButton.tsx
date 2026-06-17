"use client";

import { useCallback, useState, useTransition } from "react";

/**
 * Logout button. Calls the server-side signOut action to clear the
 * session cookie, then forces a full page reload to /sign-in.
 */
export function SignOutButton({
  className = "",
  children = "退出登录",
  signOutAction,
  ...rest
}: {
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
      } catch {
        // signOut may throw a redirect error — that's expected
      }
      // Force full page reload to /sign-in regardless of what signOut
      // returned. The server action clears the session cookie; the
      // reload ensures the browser picks up the cleared state.
      window.location.href = "/sign-in";
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
