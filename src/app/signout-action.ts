"use server";

import { recordLogout } from "@/lib/session-invalidate";

/**
 * Record the logout timestamp. The proxy reads hv-logout-at and rejects
 * any JWT whose iat is older than this timestamp. No cookie clearing,
 * no signOut() call — those are unreliable in server actions.
 */
export async function recordLogoutTimestampAction(): Promise<void> {
  await recordLogout();
}
