"use server";

import { recordLogout } from "@/lib/session-invalidate";

/**
 * Record the logout timestamp for the proxy stale-JWT check.
 * Cookie clearing is handled client-side by next-auth/react's signOut().
 */
export async function recordLogoutTimestampAction(): Promise<void> {
  await recordLogout();
}
