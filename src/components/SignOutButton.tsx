"use client";

import { useSession } from "next-auth/react";
import { useCallback, useRef } from "react";

/**
 * Reliable logout button. Uses a plain form POST to the NextAuth signout
 * endpoint. If the redirect doesn't happen within 3s, forces navigation
 * via window.location.
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
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const onSubmit = useCallback(() => {
    // Safety net: if the POST redirect doesn't fire within 3s, force nav.
    timerRef.current = setTimeout(() => {
      window.location.href = redirectTo;
    }, 3000);
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
      <input type="hidden" name="callbackUrl" value={redirectTo} />
      <button type="submit" className={className} {...rest}>
        {children}
      </button>
    </form>
  );
}
