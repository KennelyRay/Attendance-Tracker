import { EmployeeDashboardClient } from '@/modules/employee/components/EmployeeDashboardClient';
import { getSessionData } from '@/lib/session';
import { getMyAttendanceForMonth } from '@/modules/employee/server/queries';

export default async function EmployeeDashboardPage() {
  const session = await getSessionData();
  const now = new Date();
  const monthNumber = now.getMonth() + 1;
  const yearNumber = now.getFullYear();

  const month = String(monthNumber).padStart(2, '0');
  const year = String(yearNumber);

  const data = session.user
    ? await getMyAttendanceForMonth(session.user.id, monthNumber, yearNumber)
    : { records: [], stats: { present: 0, absent: 0, 'half-day': 0, leave: 0 } };

  return (
    <EmployeeDashboardClient
      initialMonth={month}
      initialYear={year}
      initialRecords={data.records}
      initialStats={data.stats}
    />
  );
}
