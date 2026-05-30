'use client';

import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Table, TBody, TD, TH, THead } from '@/components/ui/Table';
import { AttendanceStatusBadge } from '@/modules/attendance/components/AttendanceStatusBadge';
import type { EmployeeAttendanceRecord } from '@/modules/employee/types';

export function AttendanceTable({
  records,
  isLoading,
}: {
  records: EmployeeAttendanceRecord[];
  isLoading: boolean;
}) {
  return (
    <Card>
      <CardHeader title="Attendance History" subtitle={`${records.length} record(s)`} />
      <CardBody>
        {isLoading ? (
          <div className="space-y-3">
            <div className="h-10 rounded-xl bg-slate-900/80 ring-1 ring-inset ring-slate-800" />
            <div className="h-10 rounded-xl bg-slate-900/80 ring-1 ring-inset ring-slate-800" />
            <div className="h-10 rounded-xl bg-slate-900/80 ring-1 ring-inset ring-slate-800" />
          </div>
        ) : records.length === 0 ? (
          <div className="rounded-xl bg-slate-900/80 px-4 py-8 text-center text-sm text-slate-400 ring-1 ring-inset ring-slate-800">
            No attendance records for this month.
          </div>
        ) : (
          <Table>
            <THead>
              <tr>
                <TH>Date</TH>
                <TH>Status</TH>
                <TH>Notes</TH>
              </tr>
            </THead>
            <TBody>
              {records.map((record) => (
                <tr key={record.id} className="transition-colors hover:bg-slate-900/90">
                  <TD className="whitespace-nowrap">
                    {new Date(record.date).toLocaleDateString()}
                  </TD>
                  <TD className="whitespace-nowrap">
                    <AttendanceStatusBadge status={record.status} />
                  </TD>
                  <TD className="text-slate-400">{record.notes || '—'}</TD>
                </tr>
              ))}
            </TBody>
          </Table>
        )}
      </CardBody>
    </Card>
  );
}
