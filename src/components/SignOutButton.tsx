"use client";

import { recordLogoutTimestampAction } from "@/app/signout-action";

/**
 * Logout button. Records the logout timestamp so the proxy can reject
 * stale JWTs, then navigates to /sign-in. No signOut(), no fetch,
 * no cookie clearing — those are unreliable. The proxy's stale-JWT
 * check is the actual security gate.
 */
export function SignOutButton({
  className = "",
  children = "退出登录",
  ...rest
}: {
  className?: string;
  children?: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  function handleClick() {
    try {
      localStorage.removeItem("hypervoid:guest");
    } catch {
      // ignore
    }
    // Fire-and-forget: record the logout timestamp.
    // Don't await — navigate immediately so the page doesn't stall.
    recordLogoutTimestampAction().catch(() => {});
    window.location.href = "/sign-in";
  }

  return (
    <button type="button" onClick={handleClick} className={className} {...rest}>
      {children}
    </button>
  );
}
