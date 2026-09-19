import { AdminDashboardClient } from '@/modules/admin/components/AdminDashboardClient';
import {
  getAttendanceHistoryForEmployee,
  listEmployees,
} from '@/modules/admin/server/queries';
import { demoAdminDashboardProps, isDemoSession } from '@/lib/demo/server';
import type { AdminAttendanceRecord, Employee } from '@/modules/admin/types';

export default async function AdminDashboardPage() {
  // Test mode never reaches the queries below. The first screen is server-rendered, so
  // the branch has to happen here as well as in the middleware.
  if (await isDemoSession()) {
    const demo = demoAdminDashboardProps();
    return (
      <AdminDashboardClient
        initialEmployees={demo.employees as Employee[]}
        initialSelectedEmployeeId={demo.selectedId}
        initialRecords={demo.records as unknown as AdminAttendanceRecord[]}
      />
    );
  }

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
