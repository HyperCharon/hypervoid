"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Server action that clears the NextAuth session cookie and redirects
 * to /sign-in. Deletes ALL possible cookie name variants and also
 * sets them to empty with maxAge=0 as a fallback.
 */
export async function signOutAction(): Promise<never> {
  const store = await cookies();

  // Delete every possible session cookie name — the current config uses
  // "authjs.session-token", but browsers may still have legacy __Secure-
  // prefixed cookies from before the fix.
  const names = [
    "authjs.session-token",
    "__Secure-authjs.session-token",
    "next-auth.session-token",
    "__Secure-next-auth.session-token",
    // Auth.js v5 may also set these depending on internal state
    "authjs.csrf-token",
    "__Host-authjs.csrf-token",
    "authjs.callback-url",
    "__Secure-authjs.callback-url",
  ];

  for (const name of names) {
    // Standard delete
    store.delete(name);
    // Fallback: set empty value with past expiry — this works even if
    // the cookie was set on a different domain or with different flags.
    store.set(name, "", { maxAge: 0, path: "/" });
  }

  redirect("/sign-in");
}
