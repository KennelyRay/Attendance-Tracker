import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { getSessionData } from '@/lib/session';

const EMPLOYEE_ATTENDANCE_RECORD_COLUMNS = 'id, date, status, notes';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionData();
    
    if (!session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    const pool = getPool();
    let query = `SELECT ${EMPLOYEE_ATTENDANCE_RECORD_COLUMNS} FROM attendance_records WHERE user_id = $1`;
    const params = [session.user.id];
    
    if (month && year) {
      query += ' AND EXTRACT(MONTH FROM date) = $2 AND EXTRACT(YEAR FROM date) = $3';
      params.push(parseInt(month, 10), parseInt(year, 10));
    }
    
    query += ' ORDER BY date DESC';
    
    const result = await pool.query(query, params);
    
    const currentMonth = month ? parseInt(month, 10) : new Date().getMonth() + 1;
    const currentYear = year ? parseInt(year, 10) : new Date().getFullYear();
    const statsQuery = `
      SELECT status, COUNT(*) as count
      FROM attendance_records
      WHERE user_id = $1
      AND EXTRACT(MONTH FROM date) = $2
      AND EXTRACT(YEAR FROM date) = $3
      GROUP BY status
    `;
    const statsResult = await pool.query(statsQuery, [session.user.id, currentMonth, currentYear]);
    
    const stats = {
      present: 0,
      absent: 0,
      'half-day': 0,
      leave: 0,
    };
    
    statsResult.rows.forEach((row: { status: string; count: string }) => {
      const key = row.status as keyof typeof stats;
      stats[key] = parseInt(row.count, 10);
    });
    
    return NextResponse.json({ records: result.rows, stats });
  } catch (error) {
    console.error('Get attendance error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
