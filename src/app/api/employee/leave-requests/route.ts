import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/session';
import {
  createLeaveRequestForUser,
  getLeaveBalanceForUser,
  listLeaveRequestsForUser,
} from '@/modules/leave/server/queries';

export async function GET() {
  try {
    const session = await getSessionData();

    if (!session.user || session.user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [balance, requests] = await Promise.all([
      getLeaveBalanceForUser(session.user.id),
      listLeaveRequestsForUser(session.user.id),
    ]);

    return NextResponse.json({ balance, requests });
  } catch (error) {
    console.error('Get employee leave requests error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionData();

    if (!session.user || session.user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { leaveType, startDate, endDate, reason, deductFromPaidBalance } = await request.json();

    const leaveRequest = await createLeaveRequestForUser(session.user.id, {
      leaveType,
      startDate,
      endDate,
      reason,
      deductFromPaidBalance,
    });

    const balance = await getLeaveBalanceForUser(session.user.id);

    return NextResponse.json({ request: leaveRequest, balance }, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error('Create employee leave request error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
