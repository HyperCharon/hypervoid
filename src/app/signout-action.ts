"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Server action that clears ALL NextAuth cookies and redirects to /sign-in.
 * Covers current config names + legacy __Secure-/__Host- prefixed variants
 * that may still exist in the browser.
 */
export async function signOutAction(): Promise<never> {
  const store = await cookies();

  const names = [
    // Current config (plain names)
    "authjs.session-token",
    "authjs.csrf-token",
    "authjs.callback-url",
    // Legacy __Secure- variants
    "__Secure-authjs.session-token",
    "__Secure-next-auth.session-token",
    "__Secure-authjs.callback-url",
    // Legacy __Host- variant
    "__Host-authjs.csrf-token",
    // Legacy next-auth names
    "next-auth.session-token",
    "next-auth.csrf-token",
    "next-auth.callback-url",
  ];

  for (const name of names) {
    store.delete(name);
  }

  redirect("/sign-in");
}
