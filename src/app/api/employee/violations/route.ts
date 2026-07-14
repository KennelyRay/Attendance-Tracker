import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/session';
import { appealViolationForUser, listViolationsForUser } from '@/modules/admin/server/queries';

export async function GET() {
  try {
    const session = await getSessionData();

    if (!session.user || session.user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const violations = await listViolationsForUser(session.user.id);
    return NextResponse.json({ violations });
  } catch (error) {
    console.error('Get employee violations error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionData();

    if (!session.user || session.user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const violation = await appealViolationForUser(session.user.id, {
      violationId: Number(body?.violationId),
      message: String(body?.message ?? ''),
    });

    return NextResponse.json({ violation });
  } catch (error) {
    console.error('Appeal violation error:', error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: 'Unable to submit appeal' }, { status: 500 });
  }
}
