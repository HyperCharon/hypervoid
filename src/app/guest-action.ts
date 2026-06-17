"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { recordLogout } from "@/lib/session-invalidate";

/**
 * Enter guest mode: records logout timestamp, clears ALL NextAuth
 * cookies, then redirects to /.
 */
export async function enterGuestAction(): Promise<never> {
  const store = await cookies();

  // Record logout timestamp BEFORE clearing cookies
  await recordLogout();

  const names = [
    "__Secure-authjs.session-token",
    "__Host-authjs.csrf-token",
    "__Secure-authjs.callback-url",
    "__Secure-authjs.pkce.code_verifier",
    "__Secure-authjs.state",
    "__Secure-authjs.nonce",
    "authjs.session-token",
    "authjs.csrf-token",
    "authjs.callback-url",
    "authjs.pkce.code_verifier",
    "authjs.state",
    "authjs.nonce",
    "next-auth.session-token",
    "__Secure-next-auth.session-token",
    "next-auth.csrf-token",
    "next-auth.callback-url",
  ];

  for (const name of names) {
    store.delete(name);
    store.set(name, "", { maxAge: 0, path: "/" });
  }

  redirect("/");
}
