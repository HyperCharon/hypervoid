"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Enter guest mode: clears ALL NextAuth cookies so the middleware
 * treats the user as unauthenticated, then redirects to /.
 */
export async function enterGuestAction(): Promise<never> {
  const store = await cookies();
  for (const name of [
    "authjs.session-token",
    "authjs.csrf-token",
    "authjs.callback-url",
    "__Secure-authjs.session-token",
    "__Secure-next-auth.session-token",
    "__Secure-authjs.callback-url",
    "__Host-authjs.csrf-token",
    "next-auth.session-token",
  ]) {
    store.delete(name);
  }
  redirect("/");
}
