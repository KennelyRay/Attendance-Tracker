'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Table, TBody, TD, TH, THead } from '@/components/ui/Table';
import { AttendanceStatusBadge } from '@/modules/attendance/components/AttendanceStatusBadge';
import type { EmployeeAttendanceRecord } from '@/modules/employee/types';

const ATTENDANCE_RECORDS_PER_PAGE = 7;

export function AttendanceTable({
  records,
  isLoading,
}: {
  records: EmployeeAttendanceRecord[];
  isLoading: boolean;
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(records.length / ATTENDANCE_RECORDS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedRecords = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * ATTENDANCE_RECORDS_PER_PAGE;
    return records.slice(startIndex, startIndex + ATTENDANCE_RECORDS_PER_PAGE);
  }, [records, safeCurrentPage]);

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
          <>
            <div className="space-y-3 md:hidden">
              {paginatedRecords.map((record) => (
                <div
                  key={record.id}
                  className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 ring-1 ring-inset ring-white/5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Date</div>
                      <div className="mt-1 text-sm font-medium text-slate-100">
                        {new Date(record.date).toLocaleDateString()}
                      </div>
                    </div>
                    <AttendanceStatusBadge status={record.status} />
                  </div>
                  <div className="mt-3">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Notes</div>
                    <div className="mt-1 text-sm text-slate-400">{record.notes || '—'}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden md:block">
              <Table>
                <THead>
                  <tr>
                    <TH>Date</TH>
                    <TH>Status</TH>
                    <TH>Notes</TH>
                  </tr>
                </THead>
                <TBody>
                  {paginatedRecords.map((record) => (
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
            </div>
            {records.length > ATTENDANCE_RECORDS_PER_PAGE ? (
              <div className="mt-5 flex flex-col gap-3 border-t border-slate-800/80 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-slate-400">
                  Page {safeCurrentPage} of {totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                    disabled={safeCurrentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                    disabled={safeCurrentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </CardBody>
    </Card>
  );
}
