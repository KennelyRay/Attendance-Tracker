import { getPool } from '@/lib/db';
import { ensureUserAccessColumns } from '@/lib/user-access';
import type { AdminAttendanceRecord, Employee } from '@/modules/admin/types';

export async function listEmployees(): Promise<Employee[]> {
  const pool = getPool();
  await ensureUserAccessColumns(pool);
  const result = await pool.query(
    `
      SELECT id, name, email, position, start_date, is_banned, restricted_until, created_at
      FROM users
      WHERE is_admin = false
      ORDER BY name
    `
  );
  return result.rows as Employee[];
}

export async function getAttendanceHistoryForEmployee(
  userId: number
): Promise<AdminAttendanceRecord[]> {
  const pool = getPool();
  await ensureUserAccessColumns(pool);
  const result = await pool.query(
    `
      SELECT ar.*, u.name as user_name
      FROM attendance_records ar
      JOIN users u ON ar.user_id = u.id
      WHERE ar.user_id = $1
      ORDER BY ar.date DESC
    `,
    [userId]
  );
  return result.rows as AdminAttendanceRecord[];
}
