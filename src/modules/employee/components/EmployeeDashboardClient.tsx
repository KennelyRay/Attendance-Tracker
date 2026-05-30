'use client';

import { useState } from 'react';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { fetchMyAttendance } from '@/modules/employee/api';
import type { EmployeeAttendanceRecord, EmployeeAttendanceStats } from '@/modules/employee/types';
import { StatsGrid } from '@/modules/employee/components/StatsGrid';
import { AttendanceTable } from '@/modules/employee/components/AttendanceTable';

const defaultStats: EmployeeAttendanceStats = {
  present: 0,
  absent: 0,
  'half-day': 0,
  leave: 0,
};

export function EmployeeDashboardClient({
  initialMonth,
  initialYear,
  initialRecords,
  initialStats,
}: {
  initialMonth: string;
  initialYear: string;
  initialRecords: EmployeeAttendanceRecord[];
  initialStats: EmployeeAttendanceStats;
}) {
  const [month, setMonth] = useState(initialMonth);
  const [year, setYear] = useState(initialYear);
  const [records, setRecords] = useState<EmployeeAttendanceRecord[]>(initialRecords);
  const [stats, setStats] = useState<EmployeeAttendanceStats>({
    ...defaultStats,
    ...initialStats,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async (m: string, y: string) => {
    setError(null);
    setIsLoading(true);
    try {
      const data = await fetchMyAttendance(m, y);
      setRecords(data.records);
      setStats({ ...defaultStats, ...data.stats });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load attendance');
    } finally {
      setIsLoading(false);
    }
  };

  const onChangeMonth = async (nextMonth: string) => {
    setMonth(nextMonth);
    await load(nextMonth, year);
  };

  const onChangeYear = async (nextYear: string) => {
    setYear(nextYear);
    await load(month, nextYear);
  };

  if (error) {
    return (
      <EmptyState
        title="Could not load your data"
        description={error}
        action={
          <Button variant="secondary" onClick={() => load(month, year)}>
            Retry
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm font-semibold text-slate-100">Overview</div>
        <div className="mt-1 text-sm text-slate-400">
          View your monthly summary and attendance history.
        </div>
      </div>
      <StatsGrid
        month={month}
        year={year}
        stats={stats}
        onChangeMonth={onChangeMonth}
        onChangeYear={onChangeYear}
      />
      <AttendanceTable records={records} isLoading={isLoading} />
    </div>
  );
}
