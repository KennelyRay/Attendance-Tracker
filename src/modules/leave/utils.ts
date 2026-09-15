function toLocalDateOnly(value: Date) {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(
    value.getDate()
  ).padStart(2, '0')}`;
}

export function normalizeDateOnly(value: unknown) {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return null;
    }

    // The driver parses a Postgres DATE to midnight *local* time, so the calendar date
    // is in the local fields. Reading it through toISOString() shifts the day backwards
    // for any server east of UTC - Asia/Manila reads 2026-01-01 as 2025-12-31.
    return toLocalDateOnly(value);
  }

  if (typeof value === 'string') {
    const trimmedValue = value.trim();

    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmedValue)) {
      return trimmedValue;
    }

    const matchedDate = trimmedValue.match(/^(\d{4}-\d{2}-\d{2})/);
    if (matchedDate) {
      return matchedDate[1];
    }

    const parsed = new Date(trimmedValue);
    if (!Number.isNaN(parsed.getTime())) {
      return toLocalDateOnly(parsed);
    }
  }

  return null;
}

export function parseDateOnly(value: string) {
  return new Date(`${value}T00:00:00`);
}

export function isValidDateOnly(value: string) {
  const normalized = normalizeDateOnly(value);
  return normalized !== null && !Number.isNaN(parseDateOnly(normalized).getTime());
}

export function formatDateOnly(value: string | Date) {
  const normalized = normalizeDateOnly(value);
  if (!normalized) {
    return new Date(value).toLocaleDateString();
  }

  return parseDateOnly(normalized).toLocaleDateString();
}

function toDateOnlyKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`;
}

/**
 * Counts the working days an employee actually gives up for a leave range.
 *
 * Weekends never count, and neither do dates in `holidays` - an employee would not
 * have worked a holiday, so charging it against their leave balance would take a
 * paid day they never used. Callers that omit `holidays` fall back to weekends only.
 */
export function countBusinessDays(
  startDate: string,
  endDate: string,
  holidays?: ReadonlySet<string>
) {
  const normalizedStart = normalizeDateOnly(startDate);
  const normalizedEnd = normalizeDateOnly(endDate);

  if (!normalizedStart || !normalizedEnd) {
    return 0;
  }

  const start = parseDateOnly(normalizedStart);
  const end = parseDateOnly(normalizedEnd);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
    return 0;
  }

  const cursor = new Date(start);
  let days = 0;

  while (cursor <= end) {
    const day = cursor.getDay();
    const isWeekend = day === 0 || day === 6;
    const isHoliday = holidays?.has(toDateOnlyKey(cursor)) ?? false;

    if (!isWeekend && !isHoliday) {
      days += 1;
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return days;
}

/** The holidays that fall on a weekday inside a range, for showing what was excluded. */
export function holidaysWithinRange(
  startDate: string,
  endDate: string,
  holidays: ReadonlySet<string>
) {
  const normalizedStart = normalizeDateOnly(startDate);
  const normalizedEnd = normalizeDateOnly(endDate);

  if (!normalizedStart || !normalizedEnd) {
    return [];
  }

  const start = parseDateOnly(normalizedStart);
  const end = parseDateOnly(normalizedEnd);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
    return [];
  }

  const cursor = new Date(start);
  const matched: string[] = [];

  while (cursor <= end) {
    const day = cursor.getDay();
    const key = toDateOnlyKey(cursor);

    if (day !== 0 && day !== 6 && holidays.has(key)) {
      matched.push(key);
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return matched;
}

export function getServiceYears(startDate: string, asOf = new Date()) {
  const normalizedStart = normalizeDateOnly(startDate);
  if (!normalizedStart) {
    return 0;
  }

  const start = parseDateOnly(normalizedStart);

  if (Number.isNaN(start.getTime()) || start > asOf) {
    return 0;
  }

  let years = asOf.getFullYear() - start.getFullYear();
  const anniversaryPassed =
    asOf.getMonth() > start.getMonth() ||
    (asOf.getMonth() === start.getMonth() && asOf.getDate() >= start.getDate());

  if (!anniversaryPassed) {
    years -= 1;
  }

  return Math.max(0, years);
}

export function getServiceMonths(startDate: string, asOf = new Date()) {
  const normalizedStart = normalizeDateOnly(startDate);
  if (!normalizedStart) {
    return 0;
  }

  const start = parseDateOnly(normalizedStart);

  if (Number.isNaN(start.getTime()) || start > asOf) {
    return 0;
  }

  let months =
    (asOf.getFullYear() - start.getFullYear()) * 12 + (asOf.getMonth() - start.getMonth());

  if (asOf.getDate() < start.getDate()) {
    months -= 1;
  }

  return Math.max(0, months);
}

export function getAnnualPaidLeaveEntitlement(startDate: string, asOf = new Date()) {
  return 5 + getServiceYears(startDate, asOf);
}
