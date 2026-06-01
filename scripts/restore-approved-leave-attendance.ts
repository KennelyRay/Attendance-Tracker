import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { getPool } from '../src/lib/db';
import { ensureLeaveSystemSchema } from '../src/lib/leave-system';
import { getLeavePolicy } from '../src/modules/leave/policy';

type ApprovedLeaveRow = {
  id: number;
  user_id: number;
  leave_type: Parameters<typeof getLeavePolicy>[0];
  start_date: string;
  end_date: string;
  reviewed_by: number | null;
};

async function restoreApprovedLeaveAttendance() {
  const pool = getPool();
  await ensureLeaveSystemSchema(pool);

  const result = await pool.query(
    `
      SELECT id, user_id, leave_type, start_date, end_date, reviewed_by
      FROM leave_requests
      WHERE status = 'approved'
      ORDER BY start_date ASC, id ASC
    `
  );

  const approvedLeaves = result.rows as ApprovedLeaveRow[];

  let restoredRequests = 0;
  let restoredDays = 0;

  for (const leave of approvedLeaves) {
    const note = `Approved leave: ${getLeavePolicy(leave.leave_type).label}`;
    const leaveDaysResult = await pool.query(
      `
        SELECT day::date AS leave_date
        FROM generate_series($1::date, $2::date, interval '1 day') AS day
        WHERE EXTRACT(DOW FROM day) NOT IN (0, 6)
      `,
      [leave.start_date, leave.end_date]
    );

    const leaveDates = leaveDaysResult.rows.map((row) => row.leave_date);
    if (leaveDates.length === 0) {
      continue;
    }

    await pool.query(
      `DELETE FROM attendance_present WHERE user_id = $1 AND date = ANY($2::date[])`,
      [leave.user_id, leaveDates]
    );
    await pool.query(
      `DELETE FROM attendance_absent WHERE user_id = $1 AND date = ANY($2::date[])`,
      [leave.user_id, leaveDates]
    );
    await pool.query(
      `DELETE FROM attendance_half_day WHERE user_id = $1 AND date = ANY($2::date[])`,
      [leave.user_id, leaveDates]
    );

    const upsertResult = await pool.query(
      `
        INSERT INTO attendance_leave (user_id, date, notes, created_by, created_at)
        SELECT $1, day::date, $4, $5, CURRENT_TIMESTAMP
        FROM generate_series($2::date, $3::date, interval '1 day') AS day
        WHERE EXTRACT(DOW FROM day) NOT IN (0, 6)
        ON CONFLICT (user_id, date)
        DO UPDATE SET
          notes = EXCLUDED.notes,
          created_by = EXCLUDED.created_by,
          created_at = CURRENT_TIMESTAMP
      `,
      [leave.user_id, leave.start_date, leave.end_date, note, leave.reviewed_by]
    );

    restoredRequests += 1;
    restoredDays += upsertResult.rowCount ?? 0;
  }

  console.log(
    JSON.stringify(
      {
        approvedLeaveRequestsProcessed: approvedLeaves.length,
        restoredRequests,
        restoredDays,
      },
      null,
      2
    )
  );

  await pool.end();
}

restoreApprovedLeaveAttendance().catch((error) => {
  console.error('Failed to restore approved leave attendance:', error);
  process.exit(1);
});
