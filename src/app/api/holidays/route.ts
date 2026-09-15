import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/session';
import { recordAuditEvent } from '@/lib/audit-log';
import { createHoliday, deleteHoliday, listHolidays } from '@/modules/holidays/server/queries';
import { holidayTypeLabel } from '@/modules/holidays/types';

function getRequestId(request: NextRequest) {
  return request.headers.get('x-request-id') ?? crypto.randomUUID();
}

/** Employees read the calendar too - their leave day preview depends on it. */
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionData();

    if (!session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const yearParam = Number(searchParams.get('year'));
    const holidays = await listHolidays(Number.isInteger(yearParam) ? yearParam : undefined);

    return NextResponse.json({ holidays });
  } catch (error) {
    const requestId = getRequestId(request);
    console.error('Holidays route error', {
      code: 'HOLIDAYS_GET_FAILED',
      requestId,
      message: error instanceof Error ? error.message : 'unknown',
    });

    return NextResponse.json({ error: 'Internal server error', requestId }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionData();

    if (!session.user || !session.user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const holiday = await createHoliday(session.user.id, {
      date: String(body?.date ?? ''),
      name: String(body?.name ?? ''),
      holidayType: body?.holidayType,
    });

    await recordAuditEvent({
      actorId: session.user.id,
      actorName: session.user.name,
      actorEmail: session.user.email,
      category: 'leave',
      action: 'holiday.created',
      entityId: holiday.id,
      summary: `Added ${holiday.name} on ${holiday.date} to the holiday calendar`,
      details: { date: holiday.date, type: holidayTypeLabel[holiday.holiday_type] },
    });

    return NextResponse.json({ holiday }, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const requestId = getRequestId(request);
    console.error('Holidays route error', { code: 'HOLIDAYS_CREATE_FAILED', requestId });

    return NextResponse.json({ error: 'Internal server error', requestId }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSessionData();

    if (!session.user || !session.user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const holiday = await deleteHoliday(Number(body?.holidayId));

    await recordAuditEvent({
      actorId: session.user.id,
      actorName: session.user.name,
      actorEmail: session.user.email,
      category: 'leave',
      action: 'holiday.deleted',
      entityId: holiday.id,
      summary: `Removed ${holiday.name} on ${holiday.date} from the holiday calendar`,
      details: { date: holiday.date, type: holidayTypeLabel[holiday.holiday_type] },
    });

    return NextResponse.json({ holiday });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const requestId = getRequestId(request);
    console.error('Holidays route error', { code: 'HOLIDAYS_DELETE_FAILED', requestId });

    return NextResponse.json({ error: 'Internal server error', requestId }, { status: 500 });
  }
}
