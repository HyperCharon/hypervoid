"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Server action that clears the NextAuth session cookie directly and
 * redirects to /sign-in. We delete all possible cookie name variants
 * (secure/non-secure, with/without domain) to cover every environment.
 * Works reliably because cookies().delete() is a server-side operation
 * that doesn't depend on client-side auth state, CSRF tokens, or
 * NextAuth's internal fetch mechanism.
 */
export async function signOutAction(): Promise<never> {
  const store = await cookies();

  // NextAuth session cookie names — covers v4 and v5 naming conventions.
  // The actual cookie used depends on NEXTAUTH_URL protocol and version.
  for (const name of [
    "authjs.session-token",
    "__Secure-authjs.session-token",
    "next-auth.session-token",
    "__Secure-next-auth.session-token",
  ]) {
    store.delete(name);
  }

  redirect("/sign-in");
}
