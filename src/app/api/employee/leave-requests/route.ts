import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/session';
import {
  createLeaveRequestForUser,
  getLeaveBalanceForUser,
  listLeaveRequestsForUser,
} from '@/modules/leave/server/queries';
import type { LeaveType } from '@/modules/leave/types';

const MAX_LEAVE_ATTACHMENT_COUNT = 3;
const MAX_LEAVE_ATTACHMENT_BYTES = 5 * 1024 * 1024;
const ALLOWED_LEAVE_ATTACHMENT_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png']);
const SAFE_LEAVE_VALIDATION_MESSAGES = new Set([
  'Please select a valid leave type',
  'Please provide valid start and end dates',
  'End date must be on or after the start date',
  'Please provide a reason for the leave request',
  'The selected range must include at least one weekday',
  'You already have a pending or approved leave request in this date range',
  'This leave type does not use the paid leave balance',
  'This request exceeds the available paid leave balance',
  'Supporting documents must be PDF, JPG, or PNG files',
  'Each supporting document must be 5 MB or smaller',
  'Each supporting document must include a file name',
]);

function isFileEntry(value: FormDataEntryValue | null): value is File {
  return value instanceof File;
}

function toSafeLeaveRequestErrorMessage(error: Error) {
  if (SAFE_LEAVE_VALIDATION_MESSAGES.has(error.message)) {
    return error.message;
  }

  if (/^You can upload up to \d+ supporting documents$/.test(error.message)) {
    return error.message;
  }

  if (/ only allows up to \d+ day\(s\) per request$/.test(error.message)) {
    return error.message;
  }

  if (/ requires at least \d+ months of service$/.test(error.message)) {
    return error.message;
  }

  if (/ exceeds the allowed yearly limit$/.test(error.message)) {
    return error.message;
  }

  return null;
}

async function parseCreateLeaveRequestPayload(request: NextRequest) {
  const formData = await request.formData();
  const leaveType = formData.get('leaveType');
  const startDate = formData.get('startDate');
  const endDate = formData.get('endDate');
  const reason = formData.get('reason');
  const deductFromPaidBalance = formData.get('deductFromPaidBalance');
  const files = formData.getAll('attachments').filter(isFileEntry).filter((file) => file.size > 0);

  if (files.length > MAX_LEAVE_ATTACHMENT_COUNT) {
    throw new Error(`You can upload up to ${MAX_LEAVE_ATTACHMENT_COUNT} supporting documents`);
  }

  const attachments = [];

  for (const file of files) {
    if (!ALLOWED_LEAVE_ATTACHMENT_TYPES.has(file.type)) {
      throw new Error('Supporting documents must be PDF, JPG, or PNG files');
    }

    if (file.size > MAX_LEAVE_ATTACHMENT_BYTES) {
      throw new Error('Each supporting document must be 5 MB or smaller');
    }

    const trimmedName = file.name.trim();
    if (!trimmedName) {
      throw new Error('Each supporting document must include a file name');
    }

    attachments.push({
      fileName: trimmedName.slice(0, 255),
      mimeType: file.type,
      fileSize: file.size,
      fileData: Buffer.from(await file.arrayBuffer()),
    });
  }

  return {
    input: {
      leaveType: typeof leaveType === 'string' ? (leaveType as LeaveType) : ('' as LeaveType),
      startDate: typeof startDate === 'string' ? startDate : '',
      endDate: typeof endDate === 'string' ? endDate : '',
      reason: typeof reason === 'string' ? reason : '',
      deductFromPaidBalance: deductFromPaidBalance === 'true',
    },
    attachments,
  };
}

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

    const { input, attachments } = await parseCreateLeaveRequestPayload(request);

    const leaveRequest = await createLeaveRequestForUser(session.user.id, input, attachments);

    const balance = await getLeaveBalanceForUser(session.user.id);

    return NextResponse.json({ request: leaveRequest, balance }, { status: 201 });
  } catch (error) {
    console.error('Create employee leave request error:', error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: toSafeLeaveRequestErrorMessage(error) ?? 'Invalid leave request' },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Unable to create leave request' }, { status: 500 });
  }
}
