import bcrypt from 'bcrypt';
import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { getSessionData } from '@/lib/session';
import { ensureUserAccessColumns } from '@/lib/user-access';
import { normalizeDateOnly } from '@/modules/leave/utils';

function parseStartDate(value: unknown) {
  const cleanValue = typeof value === 'string' ? value.trim() : '';

  if (!/^\d{4}-\d{2}-\d{2}$/.test(cleanValue)) {
    return null;
  }

  const parsed = new Date(`${cleanValue}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return cleanValue;
}

function getRequestId(request: NextRequest) {
  return request.headers.get('x-request-id') ?? crypto.randomUUID();
}

function logAdminUsersRouteError(code: string, requestId: string) {
  console.error('Admin users route error', {
    code,
    requestId,
  });
}

async function requireAdmin() {
  const session = await getSessionData();

  if (!session.user || !session.user.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return null;
}

async function listEmployeeUsers() {
  const pool = getPool();
  await ensureUserAccessColumns(pool);
  const result = await pool.query(
    `
      SELECT id, name, email, company, position, start_date, is_banned, restricted_until, created_at
      FROM users
      WHERE is_admin = false
      ORDER BY name
    `
  );
  return result.rows.map((row) => ({
    ...row,
    start_date: normalizeDateOnly(row.start_date),
  }));
}

export async function GET(request: NextRequest) {
  try {
    const unauthorized = await requireAdmin();
    if (unauthorized) return unauthorized;

    const users = await listEmployeeUsers();
    return NextResponse.json({ users });
  } catch {
    const requestId = getRequestId(request);
    logAdminUsersRouteError('ADMIN_USERS_GET_FAILED', requestId);

    return NextResponse.json(
      { error: 'Internal server error', requestId },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const unauthorized = await requireAdmin();
    if (unauthorized) return unauthorized;

    const { name, email, password, company, position, startDate } = await request.json();
    const cleanName = typeof name === 'string' ? name.trim() : '';
    const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const cleanPassword = typeof password === 'string' ? password : '';
    const cleanCompany = typeof company === 'string' ? company.trim() : '';
    const cleanPosition = typeof position === 'string' ? position.trim() : '';
    const cleanStartDate = parseStartDate(startDate);

    if (!cleanName || !cleanEmail || !cleanPassword || !cleanCompany || !cleanPosition || !cleanStartDate) {
      return NextResponse.json(
        { error: 'Name, email, company, position, start date, and password are required' },
        { status: 400 }
      );
    }

    if (cleanPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const pool = getPool();
    await ensureUserAccessColumns(pool);
    const hashedPassword = await bcrypt.hash(cleanPassword, 10);

    const result = await pool.query(
      `
        INSERT INTO users (name, email, password, company, position, start_date, is_admin, is_banned, restricted_until)
        VALUES ($1, $2, $3, $4, $5, $6, false, false, null)
        RETURNING id, name, email, company, position, start_date, is_banned, restricted_until, created_at
      `,
      [cleanName, cleanEmail, hashedPassword, cleanCompany, cleanPosition, cleanStartDate]
    );

    return NextResponse.json(
      {
        user: {
          ...result.rows[0],
          start_date: normalizeDateOnly(result.rows[0]?.start_date),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error && /duplicate key/i.test(error.message)) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
    }

    const requestId = getRequestId(request);
    logAdminUsersRouteError('ADMIN_USERS_CREATE_FAILED', requestId);

    return NextResponse.json(
      { error: 'Internal server error', requestId },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const unauthorized = await requireAdmin();
    if (unauthorized) return unauthorized;

    const { userId, name, email, company, position, startDate } = await request.json();
    const employeeId = Number(userId);
    const cleanName = typeof name === 'string' ? name.trim() : '';
    const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const cleanCompany = typeof company === 'string' ? company.trim() : '';
    const cleanPosition = typeof position === 'string' ? position.trim() : '';
    const cleanStartDate = parseStartDate(startDate);

    if (!Number.isInteger(employeeId)) {
      return NextResponse.json({ error: 'Invalid user id' }, { status: 400 });
    }

    if (!cleanName || !cleanEmail || !cleanCompany || !cleanPosition || !cleanStartDate) {
      return NextResponse.json(
        { error: 'Name, email, company, position, and start date are required' },
        { status: 400 }
      );
    }

    const pool = getPool();
    await ensureUserAccessColumns(pool);
    const result = await pool.query(
      `
        UPDATE users
        SET name = $2, email = $3, company = $4, position = $5, start_date = $6
        WHERE id = $1 AND is_admin = false
        RETURNING id, name, email, company, position, start_date, is_banned, restricted_until, created_at
      `,
      [employeeId, cleanName, cleanEmail, cleanCompany, cleanPosition, cleanStartDate]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Employee account not found' }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        ...result.rows[0],
        start_date: normalizeDateOnly(result.rows[0]?.start_date),
      },
    });
  } catch (error) {
    if (error instanceof Error && /duplicate key/i.test(error.message)) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
    }

    const requestId = getRequestId(request);
    logAdminUsersRouteError('ADMIN_USERS_UPDATE_PROFILE_FAILED', requestId);

    return NextResponse.json(
      { error: 'Internal server error', requestId },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const unauthorized = await requireAdmin();
    if (unauthorized) return unauthorized;

    const { userId, action, durationHours } = await request.json();
    const employeeId = Number(userId);

    if (!Number.isInteger(employeeId)) {
      return NextResponse.json({ error: 'Invalid user id' }, { status: 400 });
    }

    const pool = getPool();
    await ensureUserAccessColumns(pool);

    let result;

    if (action === 'ban') {
      result = await pool.query(
        `
          UPDATE users
          SET is_banned = true, restricted_until = null
          WHERE id = $1 AND is_admin = false
          RETURNING id, name, email, company, position, start_date, is_banned, restricted_until, created_at
        `,
        [employeeId]
      );
    } else if (action === 'restrict') {
      const hours = Number(durationHours);
      if (!Number.isFinite(hours) || hours <= 0) {
        return NextResponse.json({ error: 'Invalid restriction duration' }, { status: 400 });
      }

      result = await pool.query(
        `
          UPDATE users
          SET is_banned = false,
              restricted_until = CURRENT_TIMESTAMP + ($2 || ' hours')::interval
          WHERE id = $1 AND is_admin = false
          RETURNING id, name, email, company, position, start_date, is_banned, restricted_until, created_at
        `,
        [employeeId, String(hours)]
      );
    } else if (action === 'restore') {
      result = await pool.query(
        `
          UPDATE users
          SET is_banned = false, restricted_until = null
          WHERE id = $1 AND is_admin = false
          RETURNING id, name, email, company, position, start_date, is_banned, restricted_until, created_at
        `,
        [employeeId]
      );
    } else {
      return NextResponse.json({ error: 'Unsupported account action' }, { status: 400 });
    }

    if (!result || result.rows.length === 0) {
      return NextResponse.json({ error: 'Employee account not found' }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        ...result.rows[0],
        start_date: normalizeDateOnly(result.rows[0]?.start_date),
      },
    });
  } catch {
    const requestId = getRequestId(request);
    logAdminUsersRouteError('ADMIN_USERS_UPDATE_ACCESS_FAILED', requestId);

    return NextResponse.json(
      { error: 'Internal server error', requestId },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const unauthorized = await requireAdmin();
    if (unauthorized) return unauthorized;

    const { userId } = await request.json();
    const employeeId = Number(userId);

    if (!Number.isInteger(employeeId)) {
      return NextResponse.json({ error: 'Invalid user id' }, { status: 400 });
    }

    const pool = getPool();
    await ensureUserAccessColumns(pool);
    const result = await pool.query(
      'DELETE FROM users WHERE id = $1 AND is_admin = false RETURNING id',
      [employeeId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Employee account not found' }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    const requestId = getRequestId(request);
    logAdminUsersRouteError('ADMIN_USERS_DELETE_FAILED', requestId);

    return NextResponse.json(
      { error: 'Internal server error', requestId },
      { status: 500 }
    );
  }
}
