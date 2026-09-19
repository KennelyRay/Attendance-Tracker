import { SessionOptions, sealData, unsealData } from 'iron-session';
import { cookies } from 'next/headers';
import {
  MAX_SESSION_TTL_SECONDS,
  SESSION_COOKIE_NAME,
  SESSION_TTL_SECONDS,
} from '@/lib/session-constants';

export { MAX_SESSION_TTL_SECONDS, SESSION_TTL_SECONDS };

export type SessionUser = {
  id: number;
  name: string;
  email: string;
  isAdmin: boolean;
  /** True for the portfolio test-mode account, which only ever sees sample data. */
  isDemo?: boolean;
};

export type SessionData = {
  user?: SessionUser;
};

const sessionSecret = process.env.SESSION_SECRET;

if (!sessionSecret || sessionSecret.length < 32) {
  throw new Error('SESSION_SECRET must be set to a random string with at least 32 characters.');
}

/**
 * How long a signed-in session stays valid, by role.
 *
 * Without these the cookie had no `maxAge`, making it a session cookie that died
 * whenever the browser closed. On a phone - where the OS evicts backgrounded apps
 * constantly - that meant signing in on almost every visit.
 *
 * Admins get a much shorter window than employees on purpose: an admin session can
 * read every employee's records and ban accounts, while an employee session can only
 * reach that employee's own data.
 */
export function sessionTtlSeconds(isAdmin: boolean) {
  return isAdmin ? SESSION_TTL_SECONDS.admin : SESSION_TTL_SECONDS.employee;
}

/** Matches iron-session's own rule: the cookie expires a minute before the seal does. */
export function sessionCookieMaxAge(isAdmin: boolean) {
  return sessionTtlSeconds(isAdmin) - 60;
}

export const sessionOptions: SessionOptions = {
  password: sessionSecret,
  cookieName: SESSION_COOKIE_NAME,
  ttl: MAX_SESSION_TTL_SECONDS,
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  },
};

declare module 'iron-session' {
  interface IronSessionData {
    user?: SessionUser;
  }
}

export async function getSessionData(): Promise<SessionData> {
  const cookieStore = await cookies();
  const sealed = cookieStore.get(sessionOptions.cookieName)?.value;
  if (!sealed) return {};
  try {
    const data = (await unsealData(sealed, {
      password: sessionOptions.password,
      ttl: MAX_SESSION_TTL_SECONDS,
    })) as unknown as {
      user?: {
        id: number;
        name: string;
        email: string;
        isAdmin?: boolean;
        role?: string;
      };
    };

    if (!data.user) return {};

    if (typeof data.user.isAdmin !== 'boolean') {
      data.user.isAdmin = data.user.role === 'admin';
    }

    const userWithRole = data.user as typeof data.user & { role?: string };
    delete userWithRole.role;

    return data as SessionData;
  } catch {
    return {};
  }
}

export { unsealData, sealData };
