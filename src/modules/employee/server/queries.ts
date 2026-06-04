import { getPool } from '@/lib/db';
import { ensureViolationSystemSchema } from '@/lib/violation-system';
import type { AttendanceStatus } from '@/modules/attendance/types';
import type { EmployeeViolationRecord } from '@/modules/admin/types';
import type {
  EmployeeAttendanceRecord,
  EmployeeAttendanceStats,
} from '@/modules/employee/types';
import { normalizeDateOnly } from '@/modules/leave/utils';

const emptyStats: EmployeeAttendanceStats = {
  present: 0,
  absent: 0,
  'half-day': 0,
  leave: 0,
};

export async function getMyAttendanceForMonth(
  userId: number,
  month: number,
  year: number
): Promise<{ records: EmployeeAttendanceRecord[]; stats: EmployeeAttendanceStats }> {
  const pool = getPool();

  const recordsResult = await pool.query(
    `
      SELECT *
      FROM attendance_records
      WHERE user_id = $1
      AND EXTRACT(MONTH FROM date) = $2
      AND EXTRACT(YEAR FROM date) = $3
      ORDER BY date DESC
    `,
    [userId, month, year]
  );

  const statsResult = await pool.query(
    `
      SELECT status, COUNT(*) as count
      FROM attendance_records
      WHERE user_id = $1
      AND EXTRACT(MONTH FROM date) = $2
      AND EXTRACT(YEAR FROM date) = $3
      GROUP BY status
    `,
    [userId, month, year]
  );

  const stats: EmployeeAttendanceStats = { ...emptyStats };

  for (const row of statsResult.rows as Array<{ status: AttendanceStatus; count: string }>) {
    stats[row.status] = parseInt(row.count, 10);
  }

  return {
    records: recordsResult.rows as EmployeeAttendanceRecord[],
    stats,
  };
}

export async function getMyViolations(userId: number): Promise<EmployeeViolationRecord[]> {
  const pool = getPool();
  await ensureViolationSystemSchema(pool);

  const result = await pool.query(
    `
      SELECT
        id,
        violation_type,
        company,
        severity,
        case_status,
        incident_date,
        description,
        action_taken,
        created_at
      FROM employee_violations
      WHERE user_id = $1
      ORDER BY incident_date DESC, created_at DESC, id DESC
    `,
    [userId]
  );

  return result.rows.map((row) => ({
    ...row,
    incident_date: normalizeDateOnly(row.incident_date),
  })) as EmployeeViolationRecord[];
}
