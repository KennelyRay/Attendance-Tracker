import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/session';
import { listAuditEvents } from '@/modules/audit/server/queries';
import type { AuditCategory } from '@/modules/audit/types';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionData();

    if (!session.user || !session.user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    const result = await listAuditEvents({
      category: (searchParams.get('category') as AuditCategory | 'all') ?? 'all',
      search: searchParams.get('search') ?? '',
      page: Number(searchParams.get('page')) || 1,
      pageSize: Number(searchParams.get('pageSize')) || 25,
    });

    return NextResponse.json(result);
  } catch (error) {
    const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();

    console.error('Audit log route error', {
      code: 'ADMIN_AUDIT_LOG_GET_FAILED',
      requestId,
      message: error instanceof Error ? error.message : 'unknown',
    });

    return NextResponse.json(
      { error: 'Internal server error', requestId },
      { status: 500 }
    );
  }
}
