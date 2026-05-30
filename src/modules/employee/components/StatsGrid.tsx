'use client';

import type { EmployeeAttendanceStats } from '@/modules/employee/types';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { MonthYearPicker } from '@/modules/employee/components/MonthYearPicker';

export function StatsGrid({
  month,
  year,
  stats,
  onChangeMonth,
  onChangeYear,
}: {
  month: string;
  year: string;
  stats: EmployeeAttendanceStats;
  onChangeMonth: (month: string) => void;
  onChangeYear: (year: string) => void;
}) {
  return (
    <Card>
      <CardHeader
        title="Monthly Summary"
        subtitle="Your attendance breakdown for the selected month."
        right={
          <MonthYearPicker
            month={month}
            year={year}
            onChangeMonth={onChangeMonth}
            onChangeYear={onChangeYear}
          />
        }
      />
      <CardBody>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-xl bg-emerald-500/12 px-4 py-4 ring-1 ring-inset ring-emerald-400/20">
            <div className="text-2xl font-semibold text-emerald-300">
              {stats.present ?? 0}
            </div>
            <div className="text-sm font-medium text-emerald-200">Present</div>
          </div>
          <div className="rounded-xl bg-rose-500/12 px-4 py-4 ring-1 ring-inset ring-rose-400/20">
            <div className="text-2xl font-semibold text-rose-300">
              {stats.absent ?? 0}
            </div>
            <div className="text-sm font-medium text-rose-200">Absent</div>
          </div>
          <div className="rounded-xl bg-amber-500/12 px-4 py-4 ring-1 ring-inset ring-amber-400/20">
            <div className="text-2xl font-semibold text-amber-300">
              {stats['half-day'] ?? 0}
            </div>
            <div className="text-sm font-medium text-amber-200">Half Day</div>
          </div>
          <div className="rounded-xl bg-sky-500/12 px-4 py-4 ring-1 ring-inset ring-sky-400/20">
            <div className="text-2xl font-semibold text-sky-300">
              {stats.leave ?? 0}
            </div>
            <div className="text-sm font-medium text-sky-200">Leave</div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
