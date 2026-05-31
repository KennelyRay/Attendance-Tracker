import { EmployeeDashboardClient } from '@/modules/employee/components/EmployeeDashboardClient';
import { getSessionData } from '@/lib/session';
import { getMyAttendanceForMonth } from '@/modules/employee/server/queries';
import {
  getLeaveBalanceForUser,
  listLeaveRequestsForUser,
} from '@/modules/leave/server/queries';

export default async function EmployeeDashboardPage() {
  const session = await getSessionData();

  if (!session.user) {
    return null;
  }

  const now = new Date();
  const monthNumber = now.getMonth() + 1;
  const yearNumber = now.getFullYear();

  const month = String(monthNumber).padStart(2, '0');
  const year = String(yearNumber);

  const [data, leaveBalance, leaveRequests] = await Promise.all([
    getMyAttendanceForMonth(session.user.id, monthNumber, yearNumber),
    getLeaveBalanceForUser(session.user.id),
    listLeaveRequestsForUser(session.user.id),
  ]);

  return (
    <EmployeeDashboardClient
      initialMonth={month}
      initialYear={year}
      initialRecords={data.records}
      initialStats={data.stats}
      initialLeaveBalance={leaveBalance}
      initialLeaveRequests={leaveRequests}
    />
  );
}
