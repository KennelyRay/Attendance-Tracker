import { getPool } from '@/lib/db';
import type { AttendanceStatus } from '@/modules/attendance/types';
import type {
  EmployeeAttendanceRecord,
  EmployeeAttendanceStats,
} from '@/modules/employee/types';

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

