import { getPool } from '@/lib/db';
import { ensureLeaveSystemSchema } from '@/lib/leave-system';
import { getLeavePolicy } from '@/modules/leave/policy';
import type {
  AdminLeaveRequest,
  CreateLeaveRequestInput,
  LeaveBalance,
  LeaveRequest,
  ReviewLeaveRequestInput,
} from '@/modules/leave/types';
import {
  countBusinessDays,
  getAnnualPaidLeaveEntitlement,
  getServiceMonths,
  getServiceYears,
  isValidDateOnly,
} from '@/modules/leave/utils';

const TEST_LEAVE_COOLDOWN_MS = 20 * 1000;

async function getUserStartDate(userId: number) {
  const pool = getPool();
  await ensureLeaveSystemSchema(pool);
  const result = await pool.query('SELECT start_date FROM users WHERE id = $1', [userId]);
  return result.rows[0]?.start_date as string | undefined;
}

export async function getPaidLeaveUsedDaysForYear(userId: number, year: number) {
  const pool = getPool();
  await ensureLeaveSystemSchema(pool);
  const result = await pool.query(
    `
      SELECT COALESCE(SUM(total_days), 0) AS used
      FROM leave_requests
      WHERE user_id = $1
        AND status = 'approved'
        AND deduct_from_paid_balance = true
        AND EXTRACT(YEAR FROM start_date) = $2
    `,
    [userId, year]
  );

  return Number(result.rows[0]?.used ?? 0);
}

async function getLatestApprovedLeaveForType(userId: number, leaveType: string) {
  const pool = getPool();
  const result = await pool.query(
    `
      SELECT COALESCE(reviewed_at, created_at) AS approved_at
      FROM leave_requests
      WHERE user_id = $1
        AND leave_type = $2
        AND status = 'approved'
      ORDER BY COALESCE(reviewed_at, created_at) DESC
      LIMIT 1
    `,
    [userId, leaveType]
  );

  return result.rows[0]?.approved_at as string | undefined;
}

export async function getLeaveBalanceForUser(userId: number): Promise<LeaveBalance> {
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
  const pool = getPool();
  await ensureLeaveSystemSchema(pool);
  const result = await pool.query(
    `
      SELECT
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
      FROM leave_requests
      WHERE user_id = $1
      ORDER BY created_at DESC, start_date DESC
    `,
    [userId]
  );

  return result.rows as LeaveRequest[];
}

export async function listLeaveRequestsForAdmin(): Promise<AdminLeaveRequest[]> {
  const pool = getPool();
  await ensureLeaveSystemSchema(pool);
  const result = await pool.query(
    `
      SELECT
        lr.id,
        lr.user_id,
        lr.leave_type,
        lr.start_date,
        lr.end_date,
        lr.total_days,
        lr.reason,
        lr.deduct_from_paid_balance,
        lr.status,
        lr.admin_notes,
        lr.reviewed_by,
        lr.reviewed_at,
        lr.created_at,
        u.name AS user_name,
        u.email AS user_email,
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

  const rows = result.rows as Array<
    Omit<AdminLeaveRequest, 'user_leave_remaining' | 'user_leave_entitlement'>
  >;

  return Promise.all(
    rows.map(async (row) => {
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

export async function createLeaveRequestForUser(userId: number, input: CreateLeaveRequestInput) {
  validateLeaveInput(input);

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

  const latestApprovedAt = await getLatestApprovedLeaveForType(userId, input.leaveType);
  if (latestApprovedAt) {
    const cooldownEndDate = new Date(new Date(latestApprovedAt).getTime() + TEST_LEAVE_COOLDOWN_MS);

    if (Date.now() < cooldownEndDate.getTime()) {
      throw new Error(
        `${policy.label} is still on cooldown for testing until ${cooldownEndDate.toLocaleTimeString()}`
      );
    }
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

  const result = await pool.query(
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

  return result.rows[0] as LeaveRequest;
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
  const requestId = Number(input.requestId);

  if (!Number.isInteger(requestId)) {
    throw new Error('Invalid leave request');
  }

  const pool = getPool();
  await ensureLeaveSystemSchema(pool);

  const result = await pool.query(
    `
      SELECT *
      FROM leave_requests
      WHERE id = $1
    `,
    [requestId]
  );

  const request = result.rows[0] as LeaveRequest | undefined;

  if (!request) {
    throw new Error('Leave request not found');
  }

  if (request.status !== 'pending') {
    throw new Error('Only pending leave requests can be reviewed');
  }

  if (input.action === 'approve' && request.deduct_from_paid_balance) {
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
    `,
    [requestId, nextStatus, input.adminNotes?.trim() || null, adminId]
  );

  const updatedRequest = updateResult.rows[0] as LeaveRequest;

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
