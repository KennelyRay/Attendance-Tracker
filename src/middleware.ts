import { NextRequest, NextResponse } from 'next/server';
import { unsealData } from 'iron-session';
import {
  DEMO_STATE_COOKIE,
  handleDemoRequest,
  parseDemoState,
  serializeDemoState,
} from '@/lib/demo/api';
import { SESSION_COOKIE_NAME, MAX_SESSION_TTL_SECONDS } from '@/lib/session-constants';

/**
 * The wall around test mode.
 *
 * Every API request from a test-mode session is answered here, from the sample dataset,
 * and never reaches a route handler. That is deliberate: the route handlers are the only
 * things that talk to the database, so a demo session physically cannot read a real
 * employee's attendance, disciplinary history or leave attachments, no matter what it
 * asks for. An unrecognised route is refused rather than passed through, so a route added
 * later is closed by default instead of open by accident.
 *
 * Ordinary sessions fall straight through and are untouched.
 */
export async function middleware(request: NextRequest) {
  const sealed = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!sealed) {
    return NextResponse.next();
  }

  let user: { id: number; name: string; email: string; isAdmin: boolean; isDemo?: boolean } | undefined;

  try {
    const data = (await unsealData(sealed, {
      password: process.env.SESSION_SECRET as string,
      ttl: MAX_SESSION_TTL_SECONDS,
    })) as { user?: typeof user };
    user = data.user;
  } catch {
    return NextResponse.next();
  }

  if (!user?.isDemo) {
    return NextResponse.next();
  }

  const { pathname, searchParams } = request.nextUrl;

  // Switching between the admin and employee demo has to reach its own route.
  if (pathname === '/api/demo/login') {
    return NextResponse.next();
  }

  // Signing out of test mode is a real request: it has to clear the cookies.
  if (pathname === '/api/logout') {
    const response = NextResponse.json({ success: true });
    response.cookies.delete(SESSION_COOKIE_NAME);
    response.cookies.delete(DEMO_STATE_COOKIE);
    return response;
  }

  let body: Record<string, unknown> | null = null;
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    try {
      const text = await request.text();
      body = text ? (JSON.parse(text) as Record<string, unknown>) : null;
    } catch {
      // A multipart body (a leave attachment) is not JSON. Test mode has no file store,
      // so the fields it can read are enough and the upload is simply not kept.
      body = null;
    }
  }

  const state = parseDemoState(request.cookies.get(DEMO_STATE_COOKIE)?.value);
  const result = handleDemoRequest({
    pathname,
    method: request.method,
    searchParams,
    body,
    user: { id: user.id, name: user.name, email: user.email, isAdmin: user.isAdmin },
    state,
  });

  if (!result) {
    return NextResponse.json(
      { error: 'This is not available in test mode.', demo: true },
      { status: 403 }
    );
  }

  const response = NextResponse.json(result.body, { status: result.status });

  if (result.state) {
    const serialized = serializeDemoState(result.state);
    if (serialized) {
      response.cookies.set(DEMO_STATE_COOKIE, serialized, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 12,
      });
    }
  }

  return response;
}

export const config = {
  matcher: ['/api/:path*'],
};
