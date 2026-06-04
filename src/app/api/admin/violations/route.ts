import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/session';
import {
  createViolationCase,
  listViolationCases,
  updateViolationCase,
} from '@/modules/admin/server/queries';

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

    const violations = await listViolationCases();
    return NextResponse.json({ violations });
  } catch (error) {
    console.error('Get violations error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const body = await request.json();
    const violation = await createViolationCase(auth.userId, body);
    return NextResponse.json({ violation }, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error('Create violation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const body = await request.json();
    const violation = await updateViolationCase(auth.userId, body);
    return NextResponse.json({ violation });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error('Update violation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
