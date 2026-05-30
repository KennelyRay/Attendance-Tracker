import type {
  EmployeeAttendanceRecord,
  EmployeeAttendanceStats,
} from '@/modules/employee/types';

export async function fetchMyAttendance(month: string, year: string): Promise<{
  records: EmployeeAttendanceRecord[];
  stats: EmployeeAttendanceStats;
}> {
  const response = await fetch(`/api/employee/attendance?month=${month}&year=${year}`);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error || 'Failed to fetch attendance');
  }
  return {
    records: data.records as EmployeeAttendanceRecord[],
    stats: data.stats as EmployeeAttendanceStats,
  };
}

