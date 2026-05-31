export function parseDateOnly(value: string) {
  return new Date(`${value}T00:00:00`);
}

export function isValidDateOnly(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(parseDateOnly(value).getTime());
}

export function countBusinessDays(startDate: string, endDate: string) {
  const start = parseDateOnly(startDate);
  const end = parseDateOnly(endDate);

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
  const start = parseDateOnly(startDate);

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
  const start = parseDateOnly(startDate);

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
