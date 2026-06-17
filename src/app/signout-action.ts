"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Server action that clears ALL NextAuth cookies and redirects to /sign-in.
 * Uses both delete() and set("", maxAge=0) to ensure cookies are
 * removed regardless of how they were originally set (domain, Secure flag, etc).
 */
export async function signOutAction(): Promise<never> {
  const store = await cookies();

  const names = [
    "authjs.session-token",
    "authjs.csrf-token",
    "authjs.callback-url",
    "__Secure-authjs.session-token",
    "__Secure-next-auth.session-token",
    "__Secure-authjs.callback-url",
    "__Host-authjs.csrf-token",
    "next-auth.session-token",
    "next-auth.csrf-token",
    "next-auth.callback-url",
  ];

  for (const name of names) {
    store.delete(name);
    store.set(name, "", { maxAge: 0, path: "/" });
  }

  redirect("/sign-in");
}
