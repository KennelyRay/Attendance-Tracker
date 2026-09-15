import { getPool } from '@/lib/db';
import { ensureHolidaySchema } from '@/lib/holiday-system';
import { normalizeDateOnly, isValidDateOnly } from '@/modules/leave/utils';
import type { CreateHolidayInput, Holiday, HolidayType } from '@/modules/holidays/types';

function normalizeRow(row: Record<string, unknown>): Holiday {
  return {
    ...(row as unknown as Holiday),
    date: normalizeDateOnly(row.date) ?? '',
  };
}

export async function listHolidays(year?: number): Promise<Holiday[]> {
  const pool = getPool();
  await ensureHolidaySchema(pool);

  const hasYear = Number.isInteger(year);
  const result = await pool.query(
    `
      SELECT id, date, name, holiday_type, created_at
      FROM holidays
      ${hasYear ? 'WHERE EXTRACT(YEAR FROM date) = $1' : ''}
      ORDER BY date ASC
    `,
    hasYear ? [year] : []
  );

  return result.rows.map(normalizeRow);
}

/**
 * Holiday dates as `YYYY-MM-DD` strings, for excluding them from leave day counts.
 */
export async function getHolidayDateSet(): Promise<Set<string>> {
  const pool = getPool();
  await ensureHolidaySchema(pool);

  const result = await pool.query('SELECT date FROM holidays');
  const dates = new Set<string>();

  for (const row of result.rows) {
    const normalized = normalizeDateOnly(row.date);
    if (normalized) dates.add(normalized);
  }

  return dates;
}

export async function createHoliday(
  adminId: number,
  input: CreateHolidayInput
): Promise<Holiday> {
  const pool = getPool();
  await ensureHolidaySchema(pool);

  const date = normalizeDateOnly(input.date);
  const name = input.name?.trim();
  const holidayType = input.holidayType;

  if (!date || !isValidDateOnly(date)) {
    throw new Error('Please provide a valid holiday date');
  }

  if (!name) {
    throw new Error('Holiday name is required');
  }

  if (name.length > 160) {
    throw new Error('Holiday name must be 160 characters or fewer');
  }

  if (!['regular', 'special'].includes(holidayType)) {
    throw new Error('Please select a valid holiday type');
  }

  const existing = await pool.query('SELECT name FROM holidays WHERE date = $1', [date]);
  if (existing.rows.length > 0) {
    throw new Error(`${existing.rows[0].name} is already recorded on that date`);
  }

  const result = await pool.query(
    `
      INSERT INTO holidays (date, name, holiday_type, created_by)
      VALUES ($1, $2, $3, $4)
      RETURNING id, date, name, holiday_type, created_at
    `,
    [date, name, holidayType as HolidayType, adminId]
  );

  return normalizeRow(result.rows[0]);
}

export async function deleteHoliday(holidayId: number): Promise<Holiday> {
  const pool = getPool();
  await ensureHolidaySchema(pool);

  if (!Number.isInteger(holidayId)) {
    throw new Error('Invalid holiday');
  }

  const result = await pool.query(
    `
      DELETE FROM holidays
      WHERE id = $1
      RETURNING id, date, name, holiday_type, created_at
    `,
    [holidayId]
  );

  if (result.rows.length === 0) {
    throw new Error('Holiday not found');
  }

  return normalizeRow(result.rows[0]);
}
