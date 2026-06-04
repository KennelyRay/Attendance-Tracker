import { getPool } from '@/lib/db';
import { ensureLeaveSystemSchema } from '@/lib/leave-system';
import { getLeavePolicy } from '@/modules/leave/policy';
import type {
  AdminLeaveRequest,
  CreateLeaveRequestInput,
  LeaveBalance,
  LeaveRequest,
  LeaveRequestAttachment,
  ReviewLeaveRequestInput,
} from '@/modules/leave/types';
import {
  countBusinessDays,
  normalizeDateOnly,
  getAnnualPaidLeaveEntitlement,
  getServiceMonths,
  getServiceYears,
  isValidDateOnly,
} from '@/modules/leave/utils';

const LEAVE_COOLDOWN_MS = 13 * 7 * 24 * 60 * 60 * 1000;

type LeaveRequestRow = Omit<LeaveRequest, 'attachments'>;

type LeaveRequestAttachmentUpload = {
  fileName: string;
  mimeType: string;
  fileSize: number;
  fileData: Buffer;
};

type LeaveRequestAttachmentRow = {
  id: number;
  leave_request_id: number;
  file_name: string;
  mime_type: string;
  file_size: number;
  created_at: string;
};

type LeaveRequestPaidBalanceRow = Pick<
  LeaveRequestRow,
  'leave_type' | 'deduct_from_paid_balance' | 'status' | 'reviewed_at' | 'created_at' | 'total_days'
>;

const LEAVE_REQUEST_RETURNING_COLUMNS = `
  id,
  user_id,
  leave_type,
  start_date,
  end_date,
  total_days,
  reason,
  deduct_from_paid_balance,
  status,
  admin_notes,
  reviewed_by,
  reviewed_at,
  created_at
`;

const LEAVE_REQUEST_RETURNING_COLUMNS_FOR_ALIAS = LEAVE_REQUEST_RETURNING_COLUMNS.split(',')
  .map((column) => column.trim())
  .filter(Boolean)
  .map((column) => `lr.${column}`)
  .join(',\n        ');

function buildLeaveRequestAttachment(row: LeaveRequestAttachmentRow): LeaveRequestAttachment {
  return {
    id: row.id,
    file_name: row.file_name,
    mime_type: row.mime_type,
    file_size: row.file_size,
    created_at: row.created_at,
    download_url: `/api/leave-attachments/${row.id}`,
  };
}

function leaveRequestUsesPaidBalance(
  leaveType: LeaveRequest['leave_type'],
  deductFromPaidBalance: boolean
) {
  return getLeavePolicy(leaveType).requiresPaidBalance || deductFromPaidBalance;
}

function isLeaveRequestPaidBalanceActive(
  request: LeaveRequestPaidBalanceRow,
  referenceDate = Date.now()
) {
  if (request.status !== 'approved') {
    return false;
  }

  if (!leaveRequestUsesPaidBalance(request.leave_type, request.deduct_from_paid_balance)) {
    return false;
  }

  const approvedAt = new Date(request.reviewed_at ?? request.created_at).getTime();
  return approvedAt + LEAVE_COOLDOWN_MS > referenceDate;
}

function normalizeLeaveRequestPaidBalanceFlag<
  T extends { leave_type: LeaveRequest['leave_type']; deduct_from_paid_balance: boolean }
>(request: T): T {
  return {
    ...request,
    deduct_from_paid_balance: leaveRequestUsesPaidBalance(
      request.leave_type,
      request.deduct_from_paid_balance
    ),
  };
}

async function listLeaveRequestAttachmentsByRequestIds(requestIds: number[]) {
  if (requestIds.length === 0) {
    return new Map<number, LeaveRequestAttachment[]>();
  }

  const pool = getPool();
  await ensureLeaveSystemSchema(pool);
  const result = await pool.query(
    `
      SELECT
        id,
        leave_request_id,
        file_name,
        mime_type,
        file_size,
        created_at
      FROM leave_request_attachments
      WHERE leave_request_id = ANY($1::int[])
      ORDER BY created_at ASC, id ASC
    `,
    [requestIds]
  );

  const attachmentsByRequestId = new Map<number, LeaveRequestAttachment[]>();

  for (const row of result.rows as LeaveRequestAttachmentRow[]) {
    const requestAttachments = attachmentsByRequestId.get(row.leave_request_id) ?? [];
    requestAttachments.push(buildLeaveRequestAttachment(row));
    attachmentsByRequestId.set(row.leave_request_id, requestAttachments);
  }

  return attachmentsByRequestId;
}

async function addLeaveRequestAttachments<T extends { id: number }>(rows: T[]) {
  const attachmentsByRequestId = await listLeaveRequestAttachmentsByRequestIds(rows.map((row) => row.id));

  return rows.map((row) => ({
    ...row,
    attachments: attachmentsByRequestId.get(row.id) ?? [],
  }));
}

async function releaseExpiredPaidLeaveDeductions(userId?: number) {
  void userId;
  // Keep the original request intent in the database and compute cooldown expiry at read time.
}

async function getUserStartDate(userId: number) {
  const pool = getPool();
  await ensureLeaveSystemSchema(pool);
  const result = await pool.query('SELECT start_date FROM users WHERE id = $1', [userId]);
  const normalizedStartDate = normalizeDateOnly(result.rows[0]?.start_date);
  return normalizedStartDate ?? undefined;
}

export async function getPaidLeaveUsedDaysForYear(userId: number, year: number) {
  const pool = getPool();
  await ensureLeaveSystemSchema(pool);
  const result = await pool.query(
    `
      SELECT
        leave_type,
        total_days,
        deduct_from_paid_balance,
        status,
        reviewed_at,
        created_at
      FROM leave_requests
      WHERE user_id = $1
        AND status = 'approved'
        AND EXTRACT(YEAR FROM start_date) = $2
    `,
    [userId, year]
  );

  return (result.rows as Array<LeaveRequestPaidBalanceRow>).reduce((total, row) => {
    if (!isLeaveRequestPaidBalanceActive(row)) {
      return total;
    }

    return total + Number(row.total_days);
  }, 0);
}

export async function getLeaveBalanceForUser(userId: number): Promise<LeaveBalance> {
  await releaseExpiredPaidLeaveDeductions(userId);
  const startDate = await getUserStartDate(userId);

  if (!startDate) {
    throw new Error('Employee start date is missing');
  }

  const now = new Date();
  const annualEntitlement = getAnnualPaidLeaveEntitlement(startDate, now);
  const used = await getPaidLeaveUsedDaysForYear(userId, now.getFullYear());

  return {
    annualEntitlement,
    used,
    remaining: Math.max(0, annualEntitlement - used),
    serviceYears: getServiceYears(startDate, now),
    startDate,
  };
}

export async function listLeaveRequestsForUser(userId: number): Promise<LeaveRequest[]> {
  await releaseExpiredPaidLeaveDeductions(userId);
  const pool = getPool();
  await ensureLeaveSystemSchema(pool);
  const result = await pool.query(
    `
      SELECT
        ${LEAVE_REQUEST_RETURNING_COLUMNS}
      FROM leave_requests
      WHERE user_id = $1
      ORDER BY created_at DESC, start_date DESC
    `,
    [userId]
  );

  return addLeaveRequestAttachments(
    (result.rows as LeaveRequestRow[]).map((row) => normalizeLeaveRequestPaidBalanceFlag(row))
  ) as Promise<LeaveRequest[]>;
}

export async function listLeaveRequestsForAdmin(): Promise<AdminLeaveRequest[]> {
  await releaseExpiredPaidLeaveDeductions();
  const pool = getPool();
  await ensureLeaveSystemSchema(pool);
  const result = await pool.query(
    `
      SELECT
        ${LEAVE_REQUEST_RETURNING_COLUMNS_FOR_ALIAS},
        u.name AS user_name,
        u.email AS user_email,
        u.company AS user_company,
        u.position AS user_position,
        u.start_date AS user_start_date
      FROM leave_requests lr
      JOIN users u ON u.id = lr.user_id
      ORDER BY
        CASE lr.status
          WHEN 'pending' THEN 0
          WHEN 'approved' THEN 1
          ELSE 2
        END,
        lr.created_at DESC
    `
  );

  const rows = (result.rows as Array<
    Omit<AdminLeaveRequest, 'user_leave_remaining' | 'user_leave_entitlement'>
  >).map((row) => normalizeLeaveRequestPaidBalanceFlag(row));

  const rowsWithAttachments = await addLeaveRequestAttachments(rows);

  return Promise.all(
    rowsWithAttachments.map(async (row) => {
      const balance = await getLeaveBalanceForUser(row.user_id);
      return {
        ...row,
        user_leave_remaining: balance.remaining,
        user_leave_entitlement: balance.annualEntitlement,
      };
    })
  );
}

async function getApprovedOrPendingOverlapCount(
  userId: number,
  startDate: string,
  endDate: string
) {
  const pool = getPool();
  const result = await pool.query(
    `
      SELECT COUNT(*) AS count
      FROM leave_requests
      WHERE user_id = $1
        AND status IN ('pending', 'approved')
        AND daterange(start_date, end_date, '[]') && daterange($2::date, $3::date, '[]')
    `,
    [userId, startDate, endDate]
  );

  return Number(result.rows[0]?.count ?? 0);
}

async function getUsedDaysForPolicyCap(
  userId: number,
  leaveType: string,
  year: number
) {
  const pool = getPool();
  const result = await pool.query(
    `
      SELECT COALESCE(SUM(total_days), 0) AS used
      FROM leave_requests
      WHERE user_id = $1
        AND leave_type = $2
        AND status = 'approved'
        AND EXTRACT(YEAR FROM start_date) = $3
    `,
    [userId, leaveType, year]
  );

  return Number(result.rows[0]?.used ?? 0);
}

function validateLeaveInput(input: CreateLeaveRequestInput) {
  if (!input.leaveType || !getLeavePolicy(input.leaveType)) {
    throw new Error('Please select a valid leave type');
  }

  if (!isValidDateOnly(input.startDate) || !isValidDateOnly(input.endDate)) {
    throw new Error('Please provide valid start and end dates');
  }

  if (input.startDate > input.endDate) {
    throw new Error('End date must be on or after the start date');
  }

  if (!input.reason.trim()) {
    throw new Error('Please provide a reason for the leave request');
  }
}

export async function createLeaveRequestForUser(
  userId: number,
  input: CreateLeaveRequestInput,
  attachments: LeaveRequestAttachmentUpload[] = []
) {
  validateLeaveInput(input);
  await releaseExpiredPaidLeaveDeductions(userId);

  const pool = getPool();
  await ensureLeaveSystemSchema(pool);

  const policy = getLeavePolicy(input.leaveType);
  const startDateResult = await getUserStartDate(userId);

  if (!startDateResult) {
    throw new Error('Employee start date is missing');
  }

  const totalDays = countBusinessDays(input.startDate, input.endDate);

  if (totalDays <= 0) {
    throw new Error('The selected range must include at least one weekday');
  }

  if (policy.maxDaysPerRequest && totalDays > policy.maxDaysPerRequest) {
    throw new Error(`${policy.label} only allows up to ${policy.maxDaysPerRequest} day(s) per request`);
  }

  if (policy.minServiceMonths && getServiceMonths(startDateResult) < policy.minServiceMonths) {
    throw new Error(`${policy.label} requires at least ${policy.minServiceMonths} months of service`);
  }

  const overlapCount = await getApprovedOrPendingOverlapCount(userId, input.startDate, input.endDate);
  if (overlapCount > 0) {
    throw new Error('You already have a pending or approved leave request in this date range');
  }

  if (policy.maxDaysPerYear) {
    const usedThisYear = await getUsedDaysForPolicyCap(
      userId,
      input.leaveType,
      new Date(`${input.startDate}T00:00:00`).getFullYear()
    );
    if (usedThisYear + totalDays > policy.maxDaysPerYear) {
      throw new Error(`${policy.label} exceeds the allowed yearly limit`);
    }
  }

  const deductFromPaidBalance = policy.requiresPaidBalance || Boolean(input.deductFromPaidBalance);

  if (!policy.canUsePaidBalance && deductFromPaidBalance) {
    throw new Error('This leave type does not use the paid leave balance');
  }

  if (deductFromPaidBalance) {
    const balance = await getLeaveBalanceForUser(userId);
    if (totalDays > balance.remaining) {
      throw new Error('This request exceeds the available paid leave balance');
    }
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const result = await client.query(
      `
        INSERT INTO leave_requests (
          user_id,
          leave_type,
          start_date,
          end_date,
          total_days,
          reason,
          deduct_from_paid_balance,
          status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
        RETURNING
          ${LEAVE_REQUEST_RETURNING_COLUMNS}
      `,
      [
        userId,
        input.leaveType,
        input.startDate,
        input.endDate,
        totalDays,
        input.reason.trim(),
        deductFromPaidBalance,
      ]
    );

    const createdRequest = result.rows[0] as LeaveRequestRow;
    const createdAttachments: LeaveRequestAttachment[] = [];

    for (const attachment of attachments) {
      const attachmentResult = await client.query(
        `
          INSERT INTO leave_request_attachments (
            leave_request_id,
            file_name,
            mime_type,
            file_size,
            file_data
          )
          VALUES ($1, $2, $3, $4, $5)
          RETURNING
            id,
            leave_request_id,
            file_name,
            mime_type,
            file_size,
            created_at
        `,
        [
          createdRequest.id,
          attachment.fileName,
          attachment.mimeType,
          attachment.fileSize,
          attachment.fileData,
        ]
      );

      createdAttachments.push(
        buildLeaveRequestAttachment(attachmentResult.rows[0] as LeaveRequestAttachmentRow)
      );
    }

    await client.query('COMMIT');

    return {
      ...createdRequest,
      attachments: createdAttachments,
    } as LeaveRequest;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function markApprovedLeaveInAttendance(
  userId: number,
  startDate: string,
  endDate: string,
  leaveType: string,
  reviewedBy: number
) {
  const pool = getPool();
  const note = `Approved leave: ${leaveType}`;
  const leaveDaysQuery = `
    SELECT day::date AS leave_date
    FROM generate_series($2::date, $3::date, interval '1 day') AS day
    WHERE EXTRACT(DOW FROM day) NOT IN (0, 6)
  `;

  await pool.query(
    `
      DELETE FROM attendance_present
      WHERE user_id = $1
        AND date IN (${leaveDaysQuery})
    `,
    [userId, startDate, endDate]
  );

  await pool.query(
    `
      DELETE FROM attendance_absent
      WHERE user_id = $1
        AND date IN (${leaveDaysQuery})
    `,
    [userId, startDate, endDate]
  );

  await pool.query(
    `
      DELETE FROM attendance_half_day
      WHERE user_id = $1
        AND date IN (${leaveDaysQuery})
    `,
    [userId, startDate, endDate]
  );

  await pool.query(
    `
      INSERT INTO attendance_leave (user_id, date, notes, created_by, created_at)
      SELECT $1, leave_date, $4, $5, CURRENT_TIMESTAMP
      FROM (${leaveDaysQuery}) AS leave_days
      ON CONFLICT (user_id, date)
      DO UPDATE SET
        notes = EXCLUDED.notes,
        created_by = EXCLUDED.created_by,
        created_at = CURRENT_TIMESTAMP
    `,
    [userId, startDate, endDate, note, reviewedBy]
  );
}

export async function reviewLeaveRequest(adminId: number, input: ReviewLeaveRequestInput) {
  await releaseExpiredPaidLeaveDeductions();
  const requestId = Number(input.requestId);

  if (!Number.isInteger(requestId)) {
    throw new Error('Invalid leave request');
  }

  const pool = getPool();
  await ensureLeaveSystemSchema(pool);

  const result = await pool.query(
    `
      SELECT ${LEAVE_REQUEST_RETURNING_COLUMNS}
      FROM leave_requests
      WHERE id = $1
    `,
    [requestId]
  );

  const request = result.rows[0] as LeaveRequestRow | undefined;

  if (!request) {
    throw new Error('Leave request not found');
  }

  if (request.status !== 'pending') {
    throw new Error('Only pending leave requests can be reviewed');
  }

  if (input.action === 'approve' && leaveRequestUsesPaidBalance(request.leave_type, request.deduct_from_paid_balance)) {
    const balance = await getLeaveBalanceForUser(request.user_id);
    if (request.total_days > balance.remaining) {
      throw new Error('The employee no longer has enough paid leave balance for this request');
    }
  }

  const nextStatus = input.action === 'approve' ? 'approved' : 'rejected';
  const updateResult = await pool.query(
    `
      UPDATE leave_requests
      SET
        status = $2,
        admin_notes = $3,
        reviewed_by = $4,
        reviewed_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING
        ${LEAVE_REQUEST_RETURNING_COLUMNS}
    `,
    [requestId, nextStatus, input.adminNotes?.trim() || null, adminId]
  );

  const [updatedRequest] = await addLeaveRequestAttachments([
    normalizeLeaveRequestPaidBalanceFlag(updateResult.rows[0] as LeaveRequestRow),
  ]);

  if (input.action === 'approve') {
    await markApprovedLeaveInAttendance(
      request.user_id,
      request.start_date,
      request.end_date,
      getLeavePolicy(request.leave_type).label,
      adminId
    );
  }

  return updatedRequest;
}
