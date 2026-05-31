import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/session';
import {
  listLeaveRequestsForAdmin,
  reviewLeaveRequest,
} from '@/modules/leave/server/queries';

async function requireAdmin() {
  const session = await getSessionData();

  if (!session.user || !session.user.isAdmin) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  return { userId: session.user.id };
}

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const requests = await listLeaveRequestsForAdmin();
    return NextResponse.json({ requests });
  } catch (error) {
    console.error('Get admin leave requests error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const { requestId, action, adminNotes } = await request.json();
    const leaveRequest = await reviewLeaveRequest(auth.userId, {
      requestId,
      action,
      adminNotes,
    });

    return NextResponse.json({ request: leaveRequest });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error('Review leave request error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
