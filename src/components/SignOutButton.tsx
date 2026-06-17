"use client";

import { useTransition } from "react";
import { signOutAction } from "@/app/signout-action";

/**
 * Logout button. Calls a server action that deletes the NextAuth session
 * cookie directly via cookies().delete() and redirects to /sign-in.
 * Also clears the guest flag from localStorage.
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
    // Clear ALL auth cookies client-side as well (belt-and-suspenders —
    // the server action also deletes them, but the browser may have
    // legacy __Secure- cookies that server-side delete can't reach if
    // the domain doesn't match).
    try {
      const cookieNames = [
        "authjs.session-token",
        "authjs.csrf-token",
        "authjs.callback-url",
        "__Secure-authjs.session-token",
        "__Secure-next-auth.session-token",
        "__Secure-authjs.callback-url",
        "__Host-authjs.csrf-token",
        "next-auth.session-token",
      ];
      const host = location.hostname;
      const root = host.split(".").slice(-2).join(".");
      for (const name of cookieNames) {
        for (const d of [host, root, `.${root}`, ""]) {
          const suffix = d ? `; domain=${d}` : "";
          document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT${suffix}`;
        }
      }
    } catch {
      // ignore
    }
    // Call server action to clear cookie + redirect
    startTransition(async () => {
      await signOutAction();
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
