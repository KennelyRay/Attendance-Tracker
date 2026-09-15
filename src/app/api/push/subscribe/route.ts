import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/session';
import {
  countPushSubscriptions,
  isPushConfigured,
  removePushSubscription,
  savePushSubscription,
} from '@/lib/push';

/** Tells the client whether this device is already registered for notifications. */
export async function GET() {
  const session = await getSessionData();

  if (!session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isPushConfigured()) {
    return NextResponse.json({ configured: false, subscriptions: 0 });
  }

  const subscriptions = await countPushSubscriptions(session.user.id);
  return NextResponse.json({ configured: true, subscriptions });
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionData();

    if (!session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isPushConfigured()) {
      return NextResponse.json(
        { error: 'Push notifications are not configured on this server' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const endpoint = typeof body?.endpoint === 'string' ? body.endpoint : '';
    const p256dh = typeof body?.keys?.p256dh === 'string' ? body.keys.p256dh : '';
    const auth = typeof body?.keys?.auth === 'string' ? body.keys.auth : '';

    if (!endpoint || !p256dh || !auth) {
      return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 });
    }

    await savePushSubscription(
      session.user.id,
      { endpoint, keys: { p256dh, auth } },
      request.headers.get('user-agent')?.slice(0, 255) ?? null
    );

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();
    console.error('Push subscribe failed', {
      code: 'PUSH_SUBSCRIBE_FAILED',
      requestId,
      message: error instanceof Error ? error.message : 'unknown',
    });

    return NextResponse.json({ error: 'Internal server error', requestId }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSessionData();

    if (!session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const endpoint = typeof body?.endpoint === 'string' ? body.endpoint : '';

    if (!endpoint) {
      return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 });
    }

    await removePushSubscription(endpoint);
    return NextResponse.json({ ok: true });
  } catch {
    const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();
    console.error('Push unsubscribe failed', { code: 'PUSH_UNSUBSCRIBE_FAILED', requestId });

    return NextResponse.json({ error: 'Internal server error', requestId }, { status: 500 });
  }
}
