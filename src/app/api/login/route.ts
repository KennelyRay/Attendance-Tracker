import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { getPool } from '@/lib/db';
import { sessionOptions, sealData } from '@/lib/session';
import { ensureUserAccessColumns } from '@/lib/user-access';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const pool = getPool();
    await ensureUserAccessColumns(pool);
    const result = await pool.query(
      `
        SELECT id, name, email, password, is_admin, is_banned, restricted_until
        FROM users
        WHERE email = $1
      `,
      [email]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const user = result.rows[0];

    if (user.is_banned) {
      return NextResponse.json(
        { error: 'This account has been banned. Contact your manager.' },
        { status: 403 }
      );
    }

    if (user.restricted_until && new Date(user.restricted_until) > new Date()) {
      return NextResponse.json(
        { error: 'This account is temporarily restricted. Contact your manager.' },
        { status: 403 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const sessionData = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isAdmin: Boolean(user.is_admin),
      },
    };

    const sealed = await sealData(sessionData, { password: sessionOptions.password });
    const cookieStore = await cookies();
    cookieStore.set(sessionOptions.cookieName, sealed, sessionOptions.cookieOptions);

    return NextResponse.json({ user: sessionData.user });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
