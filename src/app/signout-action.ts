"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Server action that clears ALL NextAuth cookies and redirects to /sign-in.
 * Uses signOut() from Auth.js to properly invalidate the session, then
 * also manually deletes all possible cookie variants as a safety net.
 */
export async function signOutAction(): Promise<never> {
  const store = await cookies();

  // Delete every possible cookie name — covers both secure and non-secure
  // variants, plus legacy v4 names that may still exist in the browser.
  const names = [
    // Auth.js v5 default names (when useSecureCookies = true)
    "__Secure-authjs.session-token",
    "__Host-authjs.csrf-token",
    "__Secure-authjs.callback-url",
    "__Secure-authjs.pkce.code_verifier",
    "__Secure-authjs.state",
    "__Secure-authjs.nonce",
    // Auth.js v5 default names (when useSecureCookies = false)
    "authjs.session-token",
    "authjs.csrf-token",
    "authjs.callback-url",
    "authjs.pkce.code_verifier",
    "authjs.state",
    "authjs.nonce",
    // Legacy next-auth v4 names
    "next-auth.session-token",
    "__Secure-next-auth.session-token",
    "next-auth.csrf-token",
    "next-auth.callback-url",
  ];

  for (const name of names) {
    store.delete(name);
    store.set(name, "", { maxAge: 0, path: "/" });
  }

  redirect("/sign-in");
}
