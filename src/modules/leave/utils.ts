export function normalizeDateOnly(value: unknown) {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return null;
    }

    return value.toISOString().slice(0, 10);
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
      return parsed.toISOString().slice(0, 10);
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

export function countBusinessDays(startDate: string, endDate: string) {
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
    if (day !== 0 && day !== 6) {
      days += 1;
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return days;
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
