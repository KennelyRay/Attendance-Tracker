import 'server-only';
import { getSessionData } from '@/lib/session';
import {
  DEMO_EMPLOYEE_ID,
  demoAttendance,
  demoEmployees,
  demoLeaveBalance,
  demoLeaveRequests,
  demoViolations,
} from '@/lib/demo/dataset';

/**
 * The server-render half of test mode.
 *
 * The middleware covers API calls, but the dashboards also load their first screen inside
 * a server component, which talks to the database directly and never passes through it.
 * That path is what these helpers close: a page asks here first, and only reaches a real
 * query when the session is a real one.
 */
export async function isDemoSession() {
  const session = await getSessionData();
  return Boolean(session.user?.isDemo);
}

/**
 * A backstop for the database layer.
 *
 * Every query a page can reach calls this first, so if a new page is written and someone
 * forgets the demo branch, test mode fails loudly here instead of quietly serving a real
 * employee's records to a portfolio visitor. Loud beats leaky.
 */
export async function assertNotDemoSession() {
  if (await isDemoSession()) {
    throw new Error('Test mode cannot read the database. Use the sample dataset instead.');
  }
}

export function demoAdminDashboardProps() {
  const employees = demoEmployees;
  const selectedId = employees[0]?.id ?? null;
  const records = demoAttendance
    .filter((record) => record.user_id === selectedId)
    .sort((a, b) => b.date.localeCompare(a.date));

  return { employees, selectedId, records };
}

export function demoEmployeeDashboardProps(monthNumber: number, yearNumber: number) {
  const month = String(monthNumber).padStart(2, '0');
  const year = String(yearNumber);

  const records = demoAttendance
    .filter((record) => record.user_id === DEMO_EMPLOYEE_ID)
    .filter((record) => {
      const [recordYear, recordMonth] = record.date.split('-');
      return recordYear === year && recordMonth === month;
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  const stats = { present: 0, absent: 0, 'half-day': 0, leave: 0 } as Record<string, number>;
  records.forEach((record) => {
    if (record.status in stats) stats[record.status] += 1;
  });

  return {
    month,
    year,
    records,
    stats,
    leaveBalance: demoLeaveBalance,
    leaveRequests: demoLeaveRequests.filter((request) => request.user_id === DEMO_EMPLOYEE_ID),
    violations: demoViolations.filter((violation) => violation.user_id === DEMO_EMPLOYEE_ID),
  };
}
