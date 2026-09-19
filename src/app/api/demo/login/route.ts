import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { sealData, sessionOptions, sessionCookieMaxAge, sessionTtlSeconds } from '@/lib/session';
import { DEMO_ADMIN, DEMO_EMPLOYEE } from '@/lib/demo/dataset';
import { DEMO_STATE_COOKIE } from '@/lib/demo/api';

/**
 * Opens a test-mode session for the portfolio demo.
 *
 * There is no password and no database call here on purpose: the account does not exist
 * in the database, it is a shape carried in the session cookie. Everything it can reach
 * is the sample dataset, served by the middleware, so signing in this way can never read
 * a real employee's records.
 */
export async function POST(request: NextRequest) {
  const { role } = (await request.json().catch(() => ({}))) as { role?: string };

  if (role !== 'admin' && role !== 'employee') {
    return NextResponse.json({ error: 'Choose the admin or employee demo.' }, { status: 400 });
  }

  const user = role === 'admin' ? DEMO_ADMIN : DEMO_EMPLOYEE;

  const sealed = await sealData(
    { user },
    { password: sessionOptions.password, ttl: sessionTtlSeconds(user.isAdmin) }
  );

  const cookieStore = await cookies();
  cookieStore.set(sessionOptions.cookieName, sealed, {
    ...sessionOptions.cookieOptions,
    maxAge: sessionCookieMaxAge(user.isAdmin),
  });
  // Each visit starts from the sample data, not from whatever the last visit left behind.
  cookieStore.delete(DEMO_STATE_COOKIE);

  return NextResponse.json({ user });
}
