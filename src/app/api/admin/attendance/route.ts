import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { getSessionData } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionData();
    
    if (!session.user || !session.user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    const pool = getPool();
    let query = `
      SELECT ar.*, u.name as user_name 
      FROM attendance_records ar
      JOIN users u ON ar.user_id = u.id
    `;
    const params: Array<string | number> = [];
    
    if (userId) {
      query += ' WHERE ar.user_id = $1';
      params.push(parseInt(userId, 10));
      
      if (month && year) {
        query += ' AND EXTRACT(MONTH FROM ar.date) = $2 AND EXTRACT(YEAR FROM ar.date) = $3';
        params.push(parseInt(month, 10), parseInt(year, 10));
      }
    }
    
    query += ' ORDER BY ar.date DESC';
    
    const result = await pool.query(query, params);
    
    return NextResponse.json({ records: result.rows });
  } catch (error) {
    console.error('Get attendance error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionData();
    
    if (!session.user || !session.user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, date, status, notes } = await request.json();
    const pool = getPool();
    
    await pool.query('SELECT upsert_attendance($1, $2, $3, $4, $5)', [
      userId,
      date,
      status,
      notes ?? null,
      session.user.id,
    ]);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Set attendance error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
