"use server";

import { signOut } from "@/auth";

/**
 * Server-side signout action. signOut() from NextAuth returns a redirect
 * response that includes the Set-Cookie header to clear the session.
 * The `redirect` option tells NextAuth where to redirect after signout.
 */
export async function signOutAction(): Promise<void> {
  await signOut({ redirect: false });
}
