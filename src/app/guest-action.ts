"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Enter guest mode: clears any existing session cookie so the middleware
 * treats the user as unauthenticated, then redirects to /.
 */
export async function enterGuestAction(): Promise<never> {
  const store = await cookies();
  for (const name of [
    "authjs.session-token",
    "__Secure-authjs.session-token",
    "next-auth.session-token",
    "__Secure-next-auth.session-token",
  ]) {
    store.delete(name);
  }
  redirect("/");
}
