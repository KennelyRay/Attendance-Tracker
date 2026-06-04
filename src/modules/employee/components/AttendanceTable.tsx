'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Table, TBody, TD, TH, THead } from '@/components/ui/Table';
import { AttendanceStatusBadge } from '@/modules/attendance/components/AttendanceStatusBadge';
import type { AttendanceStatus } from '@/modules/attendance/types';
import type { EmployeeAttendanceRecord, EmployeePortalProfile } from '@/modules/employee/types';

const ATTENDANCE_RECORDS_PER_PAGE = 7;
const attendanceStatusFilters: Array<{ value: 'all' | AttendanceStatus; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'present', label: 'Present' },
  { value: 'absent', label: 'Absent' },
  { value: 'half-day', label: 'Half Day' },
  { value: 'leave', label: 'Leave' },
];

function recordKey(record: EmployeeAttendanceRecord) {
  return `${record.status}-${record.date}-${record.id}`;
}

export function AttendanceTable({
  employeeProfile,
  records,
  isLoading,
}: {
  employeeProfile?: EmployeePortalProfile | null;
  records: EmployeeAttendanceRecord[];
  isLoading: boolean;
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<'all' | AttendanceStatus>('all');
  const filteredRecords = useMemo(
    () => (statusFilter === 'all' ? records : records.filter((record) => record.status === statusFilter)),
    [records, statusFilter]
  );
  const statusCounts = useMemo(
    () =>
      records.reduce(
        (totals, record) => {
          totals[record.status] += 1;
          return totals;
        },
        {
          present: 0,
          absent: 0,
          'half-day': 0,
          leave: 0,
        } satisfies Record<AttendanceStatus, number>
      ),
    [records]
  );
  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / ATTENDANCE_RECORDS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedRecords = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * ATTENDANCE_RECORDS_PER_PAGE;
    return filteredRecords.slice(startIndex, startIndex + ATTENDANCE_RECORDS_PER_PAGE);
  }, [filteredRecords, safeCurrentPage]);

  return (
    <Card>
      <CardHeader
        title="Attendance History"
        subtitle={`${records.length} record(s)`}
        right={
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center rounded-full bg-cyan-500/10 px-2.5 py-1 text-[11px] font-semibold text-cyan-300 ring-1 ring-inset ring-cyan-400/20">
              {employeeProfile?.company || 'Unassigned company'}
            </span>
            <span className="inline-flex items-center rounded-full bg-slate-950/80 px-2.5 py-1 text-[11px] font-medium text-slate-300 ring-1 ring-inset ring-slate-800">
              {employeeProfile?.position || 'No position set'}
            </span>
          </div>
        }
      />
      <CardBody>
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl bg-slate-900/80 px-4 py-3.5 ring-1 ring-inset ring-slate-800">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-emerald-300">
              Present
            </div>
            <div className="mt-2 text-xl font-semibold text-slate-50">{statusCounts.present}</div>
          </div>
          <div className="rounded-2xl bg-slate-900/80 px-4 py-3.5 ring-1 ring-inset ring-slate-800">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-rose-300">
              Absent
            </div>
            <div className="mt-2 text-xl font-semibold text-slate-50">{statusCounts.absent}</div>
          </div>
          <div className="rounded-2xl bg-slate-900/80 px-4 py-3.5 ring-1 ring-inset ring-slate-800">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-amber-300">
              Half Day
            </div>
            <div className="mt-2 text-xl font-semibold text-slate-50">{statusCounts['half-day']}</div>
          </div>
          <div className="rounded-2xl bg-slate-900/80 px-4 py-3.5 ring-1 ring-inset ring-slate-800">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-sky-300">
              Leave
            </div>
            <div className="mt-2 text-xl font-semibold text-slate-50">{statusCounts.leave}</div>
          </div>
        </div>

        <div className="mb-4 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex min-w-max gap-2">
            {attendanceStatusFilters.map((filter) => {
              const isActive = statusFilter === filter.value;
              return (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => {
                    setStatusFilter(filter.value);
                    setCurrentPage(1);
                  }}
                  className={[
                    'inline-flex items-center rounded-full border px-3 py-2 text-sm font-medium transition-all ring-1 ring-inset',
                    isActive
                      ? 'border-sky-400/25 bg-sky-500/12 text-slate-50 ring-sky-400/20'
                      : 'border-slate-800/80 bg-slate-900/70 text-slate-300 ring-white/5',
                  ].join(' ')}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="app-skeleton h-20 rounded-2xl ring-1 ring-inset ring-slate-800" />
              <div className="app-skeleton h-20 rounded-2xl ring-1 ring-inset ring-slate-800" />
              <div className="app-skeleton h-20 rounded-2xl ring-1 ring-inset ring-slate-800" />
              <div className="app-skeleton h-20 rounded-2xl ring-1 ring-inset ring-slate-800" />
            </div>
            <div className="app-skeleton h-11 rounded-xl ring-1 ring-inset ring-slate-800" />
            <div className="app-skeleton h-28 rounded-2xl ring-1 ring-inset ring-slate-800" />
            <div className="app-skeleton h-28 rounded-2xl ring-1 ring-inset ring-slate-800" />
          </div>
        ) : records.length === 0 ? (
          <div className="rounded-xl bg-slate-900/80 px-4 py-8 text-center text-sm text-slate-400 ring-1 ring-inset ring-slate-800">
            No attendance records for this month.
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="rounded-xl bg-slate-900/80 px-4 py-8 text-center text-sm text-slate-400 ring-1 ring-inset ring-slate-800">
            No attendance records match the current filter.
          </div>
        ) : (
          <>
            <div className="space-y-3 md:hidden">
              {paginatedRecords.map((record) => (
                <div
                  key={recordKey(record)}
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
                    <tr key={recordKey(record)} className="transition-colors hover:bg-slate-900/90">
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
            {filteredRecords.length > ATTENDANCE_RECORDS_PER_PAGE ? (
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
