"use server";

import { signOut } from "@/auth";
import { redirect } from "next/navigation";

/**
 * Server-side signout action. Called from SignOutButton client component.
 * Uses the server-side signOut from NextAuth which properly handles
 * CSRF tokens and session cookies. Then uses Next.js redirect() to
 * navigate — signOut's own redirect doesn't work from server actions.
 */
export async function signOutAction(): Promise<never> {
  await signOut({ redirectTo: "/sign-in" });
  redirect("/sign-in");
}
