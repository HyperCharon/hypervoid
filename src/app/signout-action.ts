"use server";

import { cookies } from "next/headers";
import { signOut } from "@/auth";
import { recordLogout } from "@/lib/session-invalidate";

/**
 * Complete server-side logout:
 * 1. Record the logout timestamp (for proxy stale-JWT check).
 * 2. Call NextAuth's server-side signOut() to clear session cookies.
 * 3. Belt-and-suspenders: manually delete the session cookie too,
 *    in case signOut() fails silently.
 */
export async function serverSignOutAction(): Promise<void> {
  await recordLogout();
  try {
    await signOut({ redirect: false });
  } catch {
    // signOut may throw — fall through to manual cookie cleanup.
  }
  // Manual cleanup: delete every possible session cookie name.
  const store = await cookies();
  const names = [
    "authjs.session-token",
    "__Secure-authjs.session-token",
    "next-auth.session-token",
    "__Secure-next-auth.session-token",
  ];
  for (const name of names) {
    try {
      store.delete(name);
    } catch {
      // ignore — cookie may not exist
    }
  }
}
