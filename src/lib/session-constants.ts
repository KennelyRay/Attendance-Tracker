/**
 * Session values that must be readable outside the Node runtime.
 *
 * The middleware runs on the edge and cannot import `session.ts`, which reaches for
 * `next/headers`. Keeping the cookie name and the unseal TTL here means both sides read
 * the same constants instead of repeating a magic string that could drift.
 */
export const SESSION_COOKIE_NAME = 'employee-attendance-session';

export const SESSION_TTL_SECONDS = {
  admin: 12 * 60 * 60, // 12 hours - roughly one working day
  employee: 30 * 24 * 60 * 60, // 30 days
} as const;

/** Longest TTL we ever issue; used when unsealing, before the role is known. */
export const MAX_SESSION_TTL_SECONDS = SESSION_TTL_SECONDS.employee;
