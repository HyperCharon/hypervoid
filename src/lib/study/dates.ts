// Small pure date helpers for the study tools. Day boundaries use the server's
// local time (UTC on Vercel) — accurate enough for countdowns, due-queues and
// streaks here; not worth a full TZ library for a single-user tool.

export function startOfDay(d: Date = new Date()): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function addDays(d: Date, days: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

/** Whole days from `now` until `target` (can be negative once past). */
export function daysUntil(target: Date, now: Date = new Date()): number {
  const ms = startOfDay(target).getTime() - startOfDay(now).getTime();
  return Math.round(ms / 86_400_000);
}

/** YYYY-MM-DD key in local time, for grouping reviews by day. */
export function dayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
