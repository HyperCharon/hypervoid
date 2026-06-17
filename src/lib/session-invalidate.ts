/**
 * Server-side session invalidation via cookie timestamp.
 *
 * When a user logs out, we record the current timestamp in a cookie.
 * The middleware checks if the JWT was issued before this timestamp
 * and rejects it if so. This handles the case where the browser
 * still sends a stale JWT cookie that couldn't be deleted.
 */

import { cookies } from "next/headers";

const LOGOUT_COOKIE = "hv-logout-at";

/** Record the current time as the logout timestamp. */
export async function recordLogout(): Promise<void> {
  const store = await cookies();
  store.set(LOGOUT_COOKIE, String(Date.now()), {
    path: "/",
    httpOnly: false, // middleware needs to read it
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

/**
 * Check if the given JWT issued-at time is before the last logout.
 * Returns true if the session is still valid (no logout recorded,
 * or JWT is newer than the logout).
 */
export async function isSessionValid(iat: number | undefined): Promise<boolean> {
  if (!iat) return true; // no issued-at — can't validate, allow
  try {
    const store = await cookies();
    const logoutAt = store.get(LOGOUT_COOKIE)?.value;
    if (!logoutAt) return true; // no logout recorded — allow
    // JWT iat is in seconds, logout timestamp is in milliseconds
    return iat * 1000 > Number(logoutAt);
  } catch {
    return true; // cookie read error — allow (fail-open)
  }
}
