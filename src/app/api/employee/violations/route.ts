import { NextResponse } from 'next/server';
import { getSessionData } from '@/lib/session';
import { listViolationsForUser } from '@/modules/admin/server/queries';

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
