"use server";

import { recordLogout } from "@/lib/session-invalidate";

/**
 * Record the logout timestamp so the proxy can reject stale JWTs.
 * Does NOT clear cookies — the client calls next-auth/react's signOut()
 * which properly handles __Secure- / __Host- prefixed cookies.
 */
export async function recordLogoutTimestampAction(): Promise<void> {
  await recordLogout();
}
