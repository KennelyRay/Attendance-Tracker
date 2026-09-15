import bcrypt from 'bcrypt';
import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { getSessionData } from '@/lib/session';
import { ensureUserAccessColumns } from '@/lib/user-access';
import { recordAuditEvent } from '@/lib/audit-log';
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
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) } as const;
  }

  return { actor: session.user } as const;
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
    const auth = await requireAdmin();
    if ('error' in auth) return auth.error;

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
    const auth = await requireAdmin();
    if ('error' in auth) return auth.error;

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

    const createdUser = result.rows[0];

    await recordAuditEvent({
      actorId: auth.actor.id,
      actorName: auth.actor.name,
      actorEmail: auth.actor.email,
      category: 'account',
      action: 'account.created',
      targetUserId: createdUser.id,
      targetUserName: createdUser.name,
      entityId: createdUser.id,
      summary: `Created employee account for ${createdUser.name}`,
      details: {
        email: createdUser.email,
        company: cleanCompany,
        position: cleanPosition,
        startDate: cleanStartDate,
      },
    });

    return NextResponse.json(
      {
        user: {
          ...createdUser,
          start_date: normalizeDateOnly(createdUser.start_date),
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
    const auth = await requireAdmin();
    if ('error' in auth) return auth.error;

    const { userId, name, email, company, position, startDate, password } = await request.json();
    const employeeId = Number(userId);
    const cleanName = typeof name === 'string' ? name.trim() : '';
    const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const cleanCompany = typeof company === 'string' ? company.trim() : '';
    const cleanPosition = typeof position === 'string' ? position.trim() : '';
    const cleanStartDate = parseStartDate(startDate);
    const cleanPassword = typeof password === 'string' ? password : '';

    if (!Number.isInteger(employeeId)) {
      return NextResponse.json({ error: 'Invalid user id' }, { status: 400 });
    }

    if (!cleanName || !cleanEmail || !cleanCompany || !cleanPosition || !cleanStartDate) {
      return NextResponse.json(
        { error: 'Name, email, company, position, and start date are required' },
        { status: 400 }
      );
    }

    if (cleanPassword && cleanPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const pool = getPool();
    await ensureUserAccessColumns(pool);
    const hashedPassword = cleanPassword ? await bcrypt.hash(cleanPassword, 10) : null;
    const result = await pool.query(
      `
        UPDATE users
        SET name = $2,
            email = $3,
            company = $4,
            position = $5,
            start_date = $6,
            password = COALESCE($7, password)
        WHERE id = $1 AND is_admin = false
        RETURNING id, name, email, company, position, start_date, is_banned, restricted_until, created_at
      `,
      [employeeId, cleanName, cleanEmail, cleanCompany, cleanPosition, cleanStartDate, hashedPassword]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Employee account not found' }, { status: 404 });
    }

    const updatedUser = result.rows[0];

    await recordAuditEvent({
      actorId: auth.actor.id,
      actorName: auth.actor.name,
      actorEmail: auth.actor.email,
      category: 'account',
      action: 'account.updated',
      targetUserId: updatedUser.id,
      targetUserName: updatedUser.name,
      entityId: updatedUser.id,
      summary: hashedPassword
        ? `Updated ${updatedUser.name} and reset their password`
        : `Updated profile details for ${updatedUser.name}`,
      details: {
        email: updatedUser.email,
        company: cleanCompany,
        position: cleanPosition,
        startDate: cleanStartDate,
        passwordReset: Boolean(hashedPassword),
      },
    });

    return NextResponse.json({
      user: {
        ...updatedUser,
        start_date: normalizeDateOnly(updatedUser.start_date),
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
    const auth = await requireAdmin();
    if ('error' in auth) return auth.error;

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

    const affectedUser = result.rows[0];
    const accessAudit = {
      ban: {
        action: 'account.banned',
        summary: `Banned ${affectedUser.name} from signing in`,
      },
      restrict: {
        action: 'account.restricted',
        summary: `Restricted ${affectedUser.name} for ${Number(durationHours)} hour(s)`,
      },
      restore: {
        action: 'account.restored',
        summary: `Restored sign-in access for ${affectedUser.name}`,
      },
    } as const;

    const auditEntry = accessAudit[action as keyof typeof accessAudit];

    await recordAuditEvent({
      actorId: auth.actor.id,
      actorName: auth.actor.name,
      actorEmail: auth.actor.email,
      category: 'account',
      action: auditEntry.action,
      targetUserId: affectedUser.id,
      targetUserName: affectedUser.name,
      entityId: affectedUser.id,
      summary: auditEntry.summary,
      details: {
        restrictedUntil: affectedUser.restricted_until,
        isBanned: affectedUser.is_banned,
        ...(action === 'restrict' ? { durationHours: Number(durationHours) } : {}),
      },
    });

    return NextResponse.json({
      user: {
        ...affectedUser,
        start_date: normalizeDateOnly(affectedUser.start_date),
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
    const auth = await requireAdmin();
    if ('error' in auth) return auth.error;

    const { userId } = await request.json();
    const employeeId = Number(userId);

    if (!Number.isInteger(employeeId)) {
      return NextResponse.json({ error: 'Invalid user id' }, { status: 400 });
    }

    const pool = getPool();
    await ensureUserAccessColumns(pool);
    const result = await pool.query(
      'DELETE FROM users WHERE id = $1 AND is_admin = false RETURNING id, name, email',
      [employeeId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Employee account not found' }, { status: 404 });
    }

    const deletedUser = result.rows[0];

    // The user row is gone, so the audit entry keeps its own copy of the name and email.
    await recordAuditEvent({
      actorId: auth.actor.id,
      actorName: auth.actor.name,
      actorEmail: auth.actor.email,
      category: 'account',
      action: 'account.deleted',
      targetUserId: null,
      targetUserName: deletedUser.name,
      entityId: deletedUser.id,
      summary: `Deleted employee account for ${deletedUser.name}`,
      details: { email: deletedUser.email },
    });

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
