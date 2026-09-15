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

function parseTimestamp(value: string) {
  const normalized = /[zZ]|[+-]\d{2}:?\d{2}$/.test(value) ? value : `${value.replace(' ', 'T')}Z`;
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? new Date(value) : parsed;
}

/**
 * How long is left before a pending request is auto-rejected.
 *
 * `now` is injectable so this stays testable and so a list of requests can be
 * measured against a single instant rather than a drifting clock.
 */
export function getReviewDeadline(createdAt: string, now: Date = new Date()): ReviewDeadline {
  const filedAt = parseTimestamp(createdAt);
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
