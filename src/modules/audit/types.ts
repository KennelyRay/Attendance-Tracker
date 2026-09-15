export type AuditCategory = 'account' | 'attendance' | 'leave' | 'violation';

export type AuditAction =
  | 'account.created'
  | 'account.updated'
  | 'account.deleted'
  | 'account.banned'
  | 'account.restricted'
  | 'account.restored'
  | 'attendance.recorded'
  | 'leave.approved'
  | 'leave.rejected'
  | 'leave.auto-rejected'
  | 'holiday.created'
  | 'holiday.deleted'
  | 'violation.created'
  | 'violation.updated'
  | 'violation.appeal-resolved';

export type AuditEvent = {
  id: number;
  actor_id: number | null;
  actor_name: string;
  actor_email: string | null;
  category: AuditCategory;
  action: AuditAction;
  target_user_id: number | null;
  target_user_name: string | null;
  entity_id: number | null;
  summary: string;
  details: Record<string, unknown> | null;
  created_at: string;
};

export type AuditLogFilters = {
  category?: AuditCategory | 'all';
  search?: string;
  page?: number;
  pageSize?: number;
};

export type AuditLogPage = {
  events: AuditEvent[];
  total: number;
  page: number;
  pageSize: number;
  categoryCounts: Record<AuditCategory, number>;
};

export const auditCategoryLabel: Record<AuditCategory, string> = {
  account: 'Accounts',
  attendance: 'Attendance',
  leave: 'Leave',
  violation: 'Violations',
};

export const auditActionLabel: Record<AuditAction, string> = {
  'account.created': 'Account created',
  'account.updated': 'Account updated',
  'account.deleted': 'Account deleted',
  'account.banned': 'Account banned',
  'account.restricted': 'Account restricted',
  'account.restored': 'Access restored',
  'attendance.recorded': 'Attendance recorded',
  'leave.approved': 'Leave approved',
  'leave.rejected': 'Leave rejected',
  'leave.auto-rejected': 'Leave auto-rejected',
  'holiday.created': 'Holiday added',
  'holiday.deleted': 'Holiday removed',
  'violation.created': 'Violation filed',
  'violation.updated': 'Violation updated',
  'violation.appeal-resolved': 'Appeal resolved',
};

/** Actions that remove access or record a penalty, surfaced more prominently in the feed. */
const consequentialActions = new Set<AuditAction>([
  'account.deleted',
  'account.banned',
  'account.restricted',
  'violation.created',
  'leave.rejected',
  'leave.auto-rejected',
]);

export function isConsequentialAction(action: AuditAction) {
  return consequentialActions.has(action);
}
