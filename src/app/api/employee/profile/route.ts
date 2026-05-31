import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { getSessionData } from '@/lib/session';
import { ensureUserAccessColumns } from '@/lib/user-access';
import { normalizeDateOnly } from '@/modules/leave/utils';

export async function GET() {
  try {
    const session = await getSessionData();

    if (!session.user || session.user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pool = getPool();
    await ensureUserAccessColumns(pool);

    const result = await pool.query(
      `
        SELECT id, name, email, position, start_date
        FROM users
        WHERE id = $1 AND is_admin = false
      `,
      [session.user.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Employee account not found' }, { status: 404 });
    }

    const user = result.rows[0];

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        position: user.position,
        startDate: normalizeDateOnly(user.start_date),
      },
    });
  } catch (error) {
    console.error('Get employee profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
