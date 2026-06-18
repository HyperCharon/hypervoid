"use server";

import { signOut } from "@/auth";
import { recordLogout } from "@/lib/session-invalidate";

/**
 * Complete server-side logout:
 * 1. Record the logout timestamp (for proxy stale-JWT check).
 * 2. Call NextAuth's server-side signOut() which directly clears all
 *    session cookies via Set-Cookie headers (bypasses HTTP fetch,
 *    bypasses CSRF, handles __Secure- / __Host- prefixes correctly).
 *
 * Does NOT redirect — the client handles navigation after this returns.
 */
export async function serverSignOutAction(): Promise<void> {
  await recordLogout();
  await signOut({ redirect: false });
}
