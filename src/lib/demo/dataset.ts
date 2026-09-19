/**
 * The sample dataset behind test mode.
 *
 * Every person, case and record here is invented for the demo. None of it comes from the
 * real database, and a test-mode request never reaches it: the middleware answers from
 * this file and the route handlers are never called. That is the whole point of the
 * design, because an admin session in this app can read every employee's attendance,
 * disciplinary history and medical leave attachments, and a public demo must not be able
 * to reach a single real one.
 *
 * Dates are generated relative to today so the demo never looks abandoned, and the values
 * are chosen to give each screen something worth looking at: a queue with work in it, a
 * couple of open cases, one appeal awaiting a verdict.
 */

export const DEMO_ADMIN_ID = -1;
export const DEMO_EMPLOYEE_ID = -2;

export const DEMO_ADMIN = {
  id: DEMO_ADMIN_ID,
  name: 'Sample Admin',
  email: 'sample.admin@example.test',
  isAdmin: true,
  isDemo: true,
};

export const DEMO_EMPLOYEE = {
  id: DEMO_EMPLOYEE_ID,
  name: 'Rosa Delgado',
  email: 'rosa.delgado@example.test',
  isAdmin: false,
  isDemo: true,
};

function isoDay(offsetDays: number) {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

function isoTime(offsetDays: number, hour = 9) {
  const date = new Date();
  date.setUTCHours(hour, 15, 0, 0);
  date.setUTCDate(date.getUTCDate() + offsetDays);
  return date.toISOString();
}

type DemoEmployee = {
  id: number;
  name: string;
  email: string;
  company: string | null;
  position: string | null;
  start_date: string;
  is_banned: boolean;
  restricted_until: string | null;
  created_at: string;
  violation_count: number;
  open_violation_count: number;
};

export const demoEmployees: DemoEmployee[] = [
  {
    id: DEMO_EMPLOYEE_ID,
    name: 'Rosa Delgado',
    email: 'rosa.delgado@example.test',
    company: 'Northside Cafe',
    position: 'Shift Supervisor',
    start_date: isoDay(-1190),
    is_banned: false,
    restricted_until: null,
    created_at: isoTime(-1190),
    violation_count: 1,
    open_violation_count: 0,
  },
  {
    id: -3,
    name: 'Ben Okafor',
    email: 'ben.okafor@example.test',
    company: 'Northside Cafe',
    position: 'Barista',
    start_date: isoDay(-640),
    is_banned: false,
    restricted_until: null,
    created_at: isoTime(-640),
    violation_count: 2,
    open_violation_count: 1,
  },
  {
    id: -4,
    name: 'Priya Raman',
    email: 'priya.raman@example.test',
    company: 'Northside Cafe',
    position: 'Baker',
    start_date: isoDay(-410),
    is_banned: false,
    restricted_until: null,
    created_at: isoTime(-410),
    violation_count: 0,
    open_violation_count: 0,
  },
  {
    id: -5,
    name: 'Marco Villaflor',
    email: 'marco.villaflor@example.test',
    company: 'Harbour Branch',
    position: 'Barista',
    start_date: isoDay(-220),
    is_banned: false,
    restricted_until: isoTime(3, 18),
    created_at: isoTime(-220),
    violation_count: 3,
    open_violation_count: 2,
  },
  {
    id: -6,
    name: 'Ada Nwosu',
    email: 'ada.nwosu@example.test',
    company: 'Harbour Branch',
    position: 'Shift Supervisor',
    start_date: isoDay(-905),
    is_banned: false,
    restricted_until: null,
    created_at: isoTime(-905),
    violation_count: 0,
    open_violation_count: 0,
  },
  {
    id: -7,
    name: 'Tomas Lindqvist',
    email: 'tomas.lindqvist@example.test',
    company: 'Harbour Branch',
    position: 'Kitchen Assistant',
    start_date: isoDay(-95),
    is_banned: false,
    restricted_until: null,
    created_at: isoTime(-95),
    violation_count: 1,
    open_violation_count: 0,
  },
  {
    id: -8,
    name: 'Grace Mbeki',
    email: 'grace.mbeki@example.test',
    company: 'Central Kitchen',
    position: 'Prep Cook',
    start_date: isoDay(-1480),
    is_banned: false,
    restricted_until: null,
    created_at: isoTime(-1480),
    violation_count: 0,
    open_violation_count: 0,
  },
  {
    id: -9,
    name: 'Ivan Petrov',
    email: 'ivan.petrov@example.test',
    company: 'Central Kitchen',
    position: 'Prep Cook',
    start_date: isoDay(-760),
    is_banned: true,
    restricted_until: null,
    created_at: isoTime(-760),
    violation_count: 4,
    open_violation_count: 1,
  },
];

const attendanceStatuses = ['present', 'present', 'present', 'present', 'leave', 'half-day', 'absent'] as const;

/** A month of attendance per employee, weighted so most days are ordinary. */
export const demoAttendance = demoEmployees.flatMap((employee, employeeIndex) =>
  Array.from({ length: 22 }, (_, dayIndex) => {
    const offset = -(dayIndex + 1);
    const status = attendanceStatuses[(dayIndex + employeeIndex * 3) % attendanceStatuses.length];
    return {
      id: Number(`${9}${Math.abs(employee.id)}${dayIndex}`) * -1,
      user_id: employee.id,
      user_name: employee.name,
      date: isoDay(offset),
      status,
      notes:
        status === 'half-day'
          ? 'Left after the lunch rush'
          : status === 'absent'
            ? 'No call, no show'
            : null,
      created_at: isoTime(offset, 18),
    };
  })
);

export const demoLeaveRequests = [
  {
    id: -101,
    user_id: -3,
    leave_type: 'paid-leave',
    start_date: isoDay(6),
    end_date: isoDay(8),
    total_days: 3,
    reason: 'Family visit out of town.',
    deduct_from_paid_balance: true,
    status: 'pending',
    admin_notes: null,
    reviewed_by: null,
    reviewed_at: null,
    created_at: isoTime(-2, 10),
    attachments: [],
    user_name: 'Ben Okafor',
    user_email: 'ben.okafor@example.test',
    user_company: 'Northside Cafe',
    user_position: 'Barista',
    user_start_date: isoDay(-640),
    user_leave_remaining: 7,
    user_leave_entitlement: 12,
  },
  {
    id: -102,
    user_id: -5,
    leave_type: 'bereavement',
    start_date: isoDay(1),
    end_date: isoDay(3),
    total_days: 3,
    reason: 'Funeral for a grandparent.',
    deduct_from_paid_balance: false,
    status: 'pending',
    admin_notes: null,
    reviewed_by: null,
    reviewed_at: null,
    created_at: isoTime(-1, 8),
    attachments: [],
    user_name: 'Marco Villaflor',
    user_email: 'marco.villaflor@example.test',
    user_company: 'Harbour Branch',
    user_position: 'Barista',
    user_start_date: isoDay(-220),
    user_leave_remaining: 4,
    user_leave_entitlement: 5,
  },
  {
    id: -103,
    user_id: DEMO_EMPLOYEE_ID,
    leave_type: 'paid-leave',
    start_date: isoDay(-12),
    end_date: isoDay(-11),
    total_days: 2,
    reason: 'Dental surgery and recovery.',
    deduct_from_paid_balance: true,
    status: 'approved',
    admin_notes: 'Approved. Cover arranged with Ada.',
    reviewed_by: DEMO_ADMIN_ID,
    reviewed_at: isoTime(-14, 11),
    created_at: isoTime(-16, 9),
    attachments: [],
    user_name: 'Rosa Delgado',
    user_email: 'rosa.delgado@example.test',
    user_company: 'Northside Cafe',
    user_position: 'Shift Supervisor',
    user_start_date: isoDay(-1190),
    user_leave_remaining: 9,
    user_leave_entitlement: 14,
  },
  {
    id: -104,
    user_id: -7,
    leave_type: 'calamity-emergency',
    start_date: isoDay(-26),
    end_date: isoDay(-25),
    total_days: 2,
    reason: 'Flooding on the road home.',
    deduct_from_paid_balance: false,
    status: 'approved',
    admin_notes: 'Approved under the calamity provision.',
    reviewed_by: DEMO_ADMIN_ID,
    reviewed_at: isoTime(-26, 7),
    created_at: isoTime(-27, 20),
    attachments: [],
    user_name: 'Tomas Lindqvist',
    user_email: 'tomas.lindqvist@example.test',
    user_company: 'Harbour Branch',
    user_position: 'Kitchen Assistant',
    user_start_date: isoDay(-95),
    user_leave_remaining: 2,
    user_leave_entitlement: 5,
  },
  {
    id: -105,
    user_id: -9,
    leave_type: 'paid-leave',
    start_date: isoDay(-40),
    end_date: isoDay(-38),
    total_days: 3,
    reason: 'Personal matters.',
    deduct_from_paid_balance: true,
    status: 'rejected',
    admin_notes: 'Filed after the shift had already been missed.',
    reviewed_by: DEMO_ADMIN_ID,
    reviewed_at: isoTime(-39, 15),
    created_at: isoTime(-39, 12),
    attachments: [],
    user_name: 'Ivan Petrov',
    user_email: 'ivan.petrov@example.test',
    user_company: 'Central Kitchen',
    user_position: 'Prep Cook',
    user_start_date: isoDay(-760),
    user_leave_remaining: 11,
    user_leave_entitlement: 14,
  },
  {
    id: -106,
    user_id: -4,
    leave_type: 'maternity-live-birth',
    start_date: isoDay(21),
    end_date: isoDay(126),
    total_days: 105,
    reason: 'Maternity leave, live birth.',
    deduct_from_paid_balance: false,
    status: 'approved',
    admin_notes: 'Approved. SSS filing in progress.',
    reviewed_by: DEMO_ADMIN_ID,
    reviewed_at: isoTime(-5, 14),
    created_at: isoTime(-8, 9),
    attachments: [],
    user_name: 'Priya Raman',
    user_email: 'priya.raman@example.test',
    user_company: 'Northside Cafe',
    user_position: 'Baker',
    user_start_date: isoDay(-410),
    user_leave_remaining: 12,
    user_leave_entitlement: 12,
  },
];

export const demoViolations = [
  {
    id: -201,
    user_id: -5,
    user_name: 'Marco Villaflor',
    user_email: 'marco.villaflor@example.test',
    user_position: 'Barista',
    violation_type: 'Repeated lateness',
    company: 'Harbour Branch',
    severity: 'medium',
    case_status: 'open',
    incident_date: isoDay(-9),
    description: 'Fourth late opening this month, each between 20 and 40 minutes.',
    action_taken: 'Written warning issued.',
    created_by: DEMO_ADMIN_ID,
    created_by_name: 'Sample Admin',
    created_at: isoTime(-9, 16),
    appeal_message: 'The bus route changed and I have asked for a later start time.',
    appealed_at: isoTime(-7, 10),
    appeal_verdict: null,
    appeal_resolved_at: null,
  },
  {
    id: -202,
    user_id: -5,
    user_name: 'Marco Villaflor',
    user_email: 'marco.villaflor@example.test',
    user_position: 'Barista',
    violation_type: 'Unreported absence',
    company: 'Harbour Branch',
    severity: 'high',
    case_status: 'under-review',
    incident_date: isoDay(-21),
    description: 'Missed a full opening shift with no notice given.',
    action_taken: 'Referred for review.',
    created_by: DEMO_ADMIN_ID,
    created_by_name: 'Sample Admin',
    created_at: isoTime(-21, 17),
    appeal_message: null,
    appealed_at: null,
    appeal_verdict: null,
    appeal_resolved_at: null,
  },
  {
    id: -203,
    user_id: -3,
    user_name: 'Ben Okafor',
    user_email: 'ben.okafor@example.test',
    user_position: 'Barista',
    violation_type: 'Cash drawer discrepancy',
    company: 'Northside Cafe',
    severity: 'medium',
    case_status: 'open',
    incident_date: isoDay(-4),
    description: 'Till short by 640 at close, no matching void receipts.',
    action_taken: null,
    created_by: DEMO_ADMIN_ID,
    created_by_name: 'Sample Admin',
    created_at: isoTime(-4, 21),
    appeal_message: null,
    appealed_at: null,
    appeal_verdict: null,
    appeal_resolved_at: null,
  },
  {
    id: -204,
    user_id: DEMO_EMPLOYEE_ID,
    user_name: 'Rosa Delgado',
    user_email: 'rosa.delgado@example.test',
    user_position: 'Shift Supervisor',
    violation_type: 'Late timesheet submission',
    company: 'Northside Cafe',
    severity: 'low',
    case_status: 'resolved',
    incident_date: isoDay(-63),
    description: 'Team timesheets filed two days after the payroll cut-off.',
    action_taken: 'Verbal reminder. Calendar reminder set.',
    created_by: DEMO_ADMIN_ID,
    created_by_name: 'Sample Admin',
    created_at: isoTime(-63, 15),
    appeal_message: 'Payroll moved the cut-off that week without telling supervisors.',
    appealed_at: isoTime(-60, 9),
    appeal_verdict: 'Upheld the appeal. The cut-off change was not communicated.',
    appeal_resolved_at: isoTime(-58, 11),
  },
  {
    id: -205,
    user_id: -9,
    user_name: 'Ivan Petrov',
    user_email: 'ivan.petrov@example.test',
    user_position: 'Prep Cook',
    violation_type: 'Food safety breach',
    company: 'Central Kitchen',
    severity: 'high',
    case_status: 'open',
    incident_date: isoDay(-31),
    description: 'Chiller log unfilled for three consecutive days.',
    action_taken: 'Final written warning. Account access suspended.',
    created_by: DEMO_ADMIN_ID,
    created_by_name: 'Sample Admin',
    created_at: isoTime(-31, 14),
    appeal_message: null,
    appealed_at: null,
    appeal_verdict: null,
    appeal_resolved_at: null,
  },
  {
    id: -206,
    user_id: -7,
    user_name: 'Tomas Lindqvist',
    user_email: 'tomas.lindqvist@example.test',
    user_position: 'Kitchen Assistant',
    violation_type: 'Uniform policy',
    company: 'Harbour Branch',
    severity: 'low',
    case_status: 'resolved',
    incident_date: isoDay(-48),
    description: 'Arrived without slip-resistant footwear twice in one week.',
    action_taken: 'Footwear allowance arranged.',
    created_by: DEMO_ADMIN_ID,
    created_by_name: 'Sample Admin',
    created_at: isoTime(-48, 13),
    appeal_message: null,
    appealed_at: null,
    appeal_verdict: null,
    appeal_resolved_at: null,
  },
];

export const demoHolidays = [
  { id: -301, date: isoDay(11), name: 'Founders Day', holiday_type: 'special', created_at: isoTime(-120) },
  { id: -302, date: isoDay(34), name: 'Harvest Holiday', holiday_type: 'regular', created_at: isoTime(-120) },
  { id: -303, date: isoDay(-18), name: 'City Charter Day', holiday_type: 'special', created_at: isoTime(-160) },
];

export const demoAuditLog = [
  {
    id: -401,
    actor_id: DEMO_ADMIN_ID,
    actor_name: 'Sample Admin',
    actor_email: 'sample.admin@example.test',
    category: 'leave',
    action: 'leave.approved',
    target_user_id: DEMO_EMPLOYEE_ID,
    target_user_name: 'Rosa Delgado',
    entity_id: -103,
    summary: 'Approved paid leave for Rosa Delgado (2 days).',
    details: null,
    created_at: isoTime(-14, 11),
  },
  {
    id: -402,
    actor_id: DEMO_ADMIN_ID,
    actor_name: 'Sample Admin',
    actor_email: 'sample.admin@example.test',
    category: 'violation',
    action: 'violation.created',
    target_user_id: -3,
    target_user_name: 'Ben Okafor',
    entity_id: -203,
    summary: 'Opened a violation case for Ben Okafor: cash drawer discrepancy.',
    details: null,
    created_at: isoTime(-4, 21),
  },
  {
    id: -403,
    actor_id: DEMO_ADMIN_ID,
    actor_name: 'Sample Admin',
    actor_email: 'sample.admin@example.test',
    category: 'account',
    action: 'account.restricted',
    target_user_id: -5,
    target_user_name: 'Marco Villaflor',
    entity_id: -5,
    summary: 'Restricted access for Marco Villaflor for 72 hours.',
    details: null,
    created_at: isoTime(-3, 12),
  },
  {
    id: -404,
    actor_id: null,
    actor_name: 'System',
    actor_email: null,
    category: 'leave',
    action: 'leave.auto-rejected',
    target_user_id: -9,
    target_user_name: 'Ivan Petrov',
    entity_id: -105,
    summary: 'Auto-rejected a leave request that passed its start date without review.',
    details: null,
    created_at: isoTime(-39, 15),
  },
  {
    id: -405,
    actor_id: DEMO_ADMIN_ID,
    actor_name: 'Sample Admin',
    actor_email: 'sample.admin@example.test',
    category: 'account',
    action: 'account.banned',
    target_user_id: -9,
    target_user_name: 'Ivan Petrov',
    entity_id: -9,
    summary: 'Banned Ivan Petrov after a final written warning.',
    details: null,
    created_at: isoTime(-30, 9),
  },
];

export const demoLeaveBalance = {
  annualEntitlement: 14,
  used: 5,
  remaining: 9,
  serviceYears: 3,
  startDate: isoDay(-1190),
};
