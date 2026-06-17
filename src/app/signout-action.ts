"use server";

import { signOut } from "@/auth";

/**
 * Server-side signout action. Called from SignOutButton client component.
 * Uses the server-side signOut from NextAuth which properly handles
 * CSRF tokens, session cookies, and redirect.
 */
export async function signOutAction(): Promise<void> {
  await signOut({ redirectTo: "/" });
}
