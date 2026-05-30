import { AdminDashboardClient } from '@/modules/admin/components/AdminDashboardClient';
import {
  getAttendanceHistoryForEmployee,
  listEmployees,
} from '@/modules/admin/server/queries';

export default async function AdminDashboardPage() {
  const employees = await listEmployees();
  const initialSelectedEmployeeId = employees[0]?.id ?? null;
  const initialRecords = initialSelectedEmployeeId
    ? await getAttendanceHistoryForEmployee(initialSelectedEmployeeId)
    : [];

  return (
    <AdminDashboardClient
      initialEmployees={employees}
      initialSelectedEmployeeId={initialSelectedEmployeeId}
      initialRecords={initialRecords}
    />
  );
}
