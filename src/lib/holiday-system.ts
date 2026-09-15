import type { Pool } from '@neondatabase/serverless';

let ensured = false;

function pad(value: number) {
  return String(value).padStart(2, '0');
}

/** National Heroes Day falls on the last Monday of August. */
function lastMondayOfAugust(year: number) {
  const cursor = new Date(Date.UTC(year, 7, 31));
  while (cursor.getUTCDay() !== 1) {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return `${year}-08-${pad(cursor.getUTCDate())}`;
}

/**
 * Philippine holidays that land on the same date every year.
 *
 * Movable observances - Maundy Thursday, Good Friday, Black Saturday, Chinese New
 * Year, Eid'l Fitr and Eid'l Adha - are set by annual proclamation and are
 * deliberately not seeded. HR adds those for each year from the Holiday Calendar.
 */
export function fixedHolidaysForYear(year: number) {
  const on = (month: number, day: number) => `${year}-${pad(month)}-${pad(day)}`;

  return [
    { date: on(1, 1), name: "New Year's Day", type: 'regular' },
    { date: on(4, 9), name: 'Araw ng Kagitingan', type: 'regular' },
    { date: on(5, 1), name: 'Labor Day', type: 'regular' },
    { date: on(6, 12), name: 'Independence Day', type: 'regular' },
    { date: lastMondayOfAugust(year), name: 'National Heroes Day', type: 'regular' },
    { date: on(11, 30), name: 'Bonifacio Day', type: 'regular' },
    { date: on(12, 25), name: 'Christmas Day', type: 'regular' },
    { date: on(12, 30), name: 'Rizal Day', type: 'regular' },
    { date: on(8, 21), name: 'Ninoy Aquino Day', type: 'special' },
    { date: on(11, 1), name: "All Saints' Day", type: 'special' },
    { date: on(12, 8), name: 'Feast of the Immaculate Conception', type: 'special' },
    { date: on(12, 31), name: 'Last Day of the Year', type: 'special' },
  ];
}

export async function ensureHolidaySchema(pool: Pool) {
  if (ensured) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS holidays (
      id SERIAL PRIMARY KEY,
      date DATE NOT NULL UNIQUE,
      name VARCHAR(160) NOT NULL,
      holiday_type VARCHAR(16) NOT NULL DEFAULT 'regular',
      created_by INTEGER NULL REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT holidays_type CHECK (holiday_type IN ('regular', 'special'))
    );

    CREATE INDEX IF NOT EXISTS idx_holidays_date ON holidays(date);
  `);

  const currentYear = new Date().getFullYear();

  // Seed a year only when it is completely empty, so a holiday HR deliberately
  // deleted is never resurrected on the next boot.
  for (const year of [currentYear - 1, currentYear, currentYear + 1]) {
    const existing = await pool.query(
      'SELECT 1 FROM holidays WHERE EXTRACT(YEAR FROM date) = $1 LIMIT 1',
      [year]
    );

    if (existing.rows.length > 0) continue;

    for (const holiday of fixedHolidaysForYear(year)) {
      await pool.query(
        `
          INSERT INTO holidays (date, name, holiday_type)
          VALUES ($1, $2, $3)
          ON CONFLICT (date) DO NOTHING
        `,
        [holiday.date, holiday.name, holiday.type]
      );
    }
  }

  ensured = true;
}
