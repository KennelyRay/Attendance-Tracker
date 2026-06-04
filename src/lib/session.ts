import { SessionOptions, sealData, unsealData } from 'iron-session';
import { cookies } from 'next/headers';

export type SessionUser = {
  id: number;
  name: string;
  email: string;
  isAdmin: boolean;
};

export type SessionData = {
  user?: SessionUser;
};

const sessionSecret = process.env.SESSION_SECRET;

if (!sessionSecret || sessionSecret.length < 32) {
  throw new Error('SESSION_SECRET must be set to a random string with at least 32 characters.');
}

export const sessionOptions: SessionOptions = {
  password: sessionSecret,
  cookieName: 'employee-attendance-session',
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
