/**
 * Pending leave requests are automatically rejected once they go unreviewed for this
 * long. The constant lives here so the server rule and the countdown shown in the UI
 * can never drift apart.
 */
export const LEAVE_REVIEW_WINDOW_HOURS = 72;

export const OVERDUE_LEAVE_REJECTION_NOTE = `Not reviewed within ${LEAVE_REVIEW_WINDOW_HOURS} hours`;

export type ReviewUrgency = 'expired' | 'critical' | 'warning' | 'normal';

export type ReviewDeadline = {
  deadline: Date;
  hoursRemaining: number;
  urgency: ReviewUrgency;
  /** Short countdown for badges, e.g. "8h left" or "Overdue". */
  label: string;
};

const CRITICAL_HOURS = 12;
const WARNING_HOURS = 24;

/**
 * Accepts whatever a timestamp actually arrives as.
 *
 * TIMESTAMP columns come back from the driver as Date objects, and React Server
 * Components pass Dates through to the client intact - so a field typed `string` is a
 * real Date by the time a client component reads it. Assuming a string here threw
 * "value.replace is not a function" and took the whole panel down.
 */
function parseTimestamp(value: string | Date | number) {
  if (value instanceof Date) {
    return value;
  }

  if (typeof value === 'number') {
    return new Date(value);
  }

  const text = String(value);
  const normalized = /[zZ]|[+-]\d{2}:?\d{2}$/.test(text) ? text : `${text.replace(' ', 'T')}Z`;
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? new Date(text) : parsed;
}

/**
 * How long is left before a pending request is auto-rejected.
 *
 * `now` is required rather than defaulted. A default of `new Date()` would run during
 * render, which both breaks React's purity rule and makes server and client markup
 * disagree - the caller must supply a clock it controls, set after mount.
 */
export function getReviewDeadline(createdAt: string | Date | number, now: Date): ReviewDeadline {
  const filedAt = parseTimestamp(createdAt);

  // An unparseable timestamp must not produce "NaNd left" on screen, and must never
  // read as urgent - there is no evidence either way.
  if (Number.isNaN(filedAt.getTime())) {
    return {
      deadline: filedAt,
      hoursRemaining: Number.POSITIVE_INFINITY,
      urgency: 'normal',
      label: 'Pending review',
    };
  }

  const deadline = new Date(filedAt.getTime() + LEAVE_REVIEW_WINDOW_HOURS * 60 * 60 * 1000);
  const millisecondsLeft = deadline.getTime() - now.getTime();
  const hoursRemaining = millisecondsLeft / (60 * 60 * 1000);

  if (millisecondsLeft <= 0) {
    return { deadline, hoursRemaining: 0, urgency: 'expired', label: 'Overdue' };
  }

  const urgency: ReviewUrgency =
    hoursRemaining < CRITICAL_HOURS
      ? 'critical'
      : hoursRemaining < WARNING_HOURS
        ? 'warning'
        : 'normal';

  const label =
    hoursRemaining < 1
      ? `${Math.max(1, Math.round(millisecondsLeft / 60000))}m left`
      : hoursRemaining < 24
        ? `${Math.floor(hoursRemaining)}h left`
        : `${Math.floor(hoursRemaining / 24)}d left`;

  return { deadline, hoursRemaining, urgency, label };
}

export function isUrgentReview(urgency: ReviewUrgency) {
  return urgency === 'expired' || urgency === 'critical' || urgency === 'warning';
}
