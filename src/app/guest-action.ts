"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Enter guest mode: clears ALL NextAuth cookies so the middleware
 * treats the user as unauthenticated, then redirects to /.
 * Uses both delete() and set("", maxAge=0) to ensure cookies are
 * removed regardless of how they were originally set.
 */
export async function enterGuestAction(): Promise<never> {
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
  ];

  for (const name of names) {
    store.delete(name);
    // Belt-and-suspenders: also set empty with maxAge=0
    store.set(name, "", { maxAge: 0, path: "/" });
  }

  redirect("/");
}
