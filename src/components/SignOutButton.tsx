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
    // Clear guest flag immediately (client-side)
    try {
      localStorage.removeItem("hypervoid:guest");
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
