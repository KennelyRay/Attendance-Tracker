'use client';

import { useMemo, useState } from 'react';
import { EmptyState } from '@/components/ui/EmptyState';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  createEmployeeAccount,
  deleteEmployeeAccount,
  fetchAttendanceHistory,
  fetchEmployees,
  updateEmployeeAccount,
  updateEmployeeAccess,
  upsertAttendance,
} from '@/modules/admin/api';
import { AccountManagementPanel } from '@/modules/admin/components/AccountManagementPanel';
import { employeeAccountStatus } from '@/modules/admin/types';
import type { Employee } from '@/modules/admin/types';
import { EmployeeList } from '@/modules/admin/components/EmployeeList';
import { AttendanceForm } from '@/modules/admin/components/AttendanceForm';
import { AttendanceTable } from '@/modules/admin/components/AttendanceTable';
import type {
  AdminAttendanceRecord,
  CreateEmployeeInput,
  UpdateEmployeeAccountInput,
  UpdateEmployeeAccessInput,
} from '@/modules/admin/types';
import { AttendanceStatusBadge } from '@/modules/attendance/components/AttendanceStatusBadge';
import type { AttendanceStatus } from '@/modules/attendance/types';

export function AdminDashboardClient({
  initialEmployees,
  initialSelectedEmployeeId,
  initialRecords,
}: {
  initialEmployees: Employee[];
  initialSelectedEmployeeId: number | null;
  initialRecords: AdminAttendanceRecord[];
}) {
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(
    initialSelectedEmployeeId
  );
  const [records, setRecords] = useState<AdminAttendanceRecord[]>(initialRecords);
  const [isEmployeesLoading, setIsEmployeesLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'attendance' | 'accounts'>('attendance');
  const [error, setError] = useState<string | null>(null);

  const selectedEmployee = useMemo(() => {
    if (!selectedEmployeeId) return null;
    return employees.find((e) => e.id === selectedEmployeeId) || null;
  }, [employees, selectedEmployeeId]);

  const last30DaysCounts = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);

    const counts: Record<AttendanceStatus, number> = {
      present: 0,
      absent: 0,
      'half-day': 0,
      leave: 0,
    };

    for (const record of records) {
      const date = new Date(record.date);
      if (date >= cutoff) {
        counts[record.status] += 1;
      }
    }

    return counts;
  }, [records]);

  const adminStats = useMemo(() => {
    return employees.reduce(
      (totals, employee) => {
        totals.total += 1;
        const status = employeeAccountStatus(employee);
        totals[status] += 1;
        return totals;
      },
      {
        total: 0,
        active: 0,
        restricted: 0,
        banned: 0,
      }
    );
  }, [employees]);

  const reloadEmployees = async () => {
    setError(null);
    setIsEmployeesLoading(true);
    try {
      const list = await fetchEmployees();
      setEmployees(list);
      const nextSelectedEmployeeId = list.some((employee) => employee.id === selectedEmployeeId)
        ? selectedEmployeeId
        : (list[0]?.id ?? null);
      setSelectedEmployeeId(nextSelectedEmployeeId);

      if (nextSelectedEmployeeId) {
        await reloadHistory(nextSelectedEmployeeId);
      } else {
        setRecords([]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load employees');
    } finally {
      setIsEmployeesLoading(false);
    }
  };

  const refreshEmployees = async () => {
    const list = await fetchEmployees();
    setEmployees(list);

    const nextSelectedEmployeeId = list.some((employee) => employee.id === selectedEmployeeId)
      ? selectedEmployeeId
      : (list[0]?.id ?? null);
    setSelectedEmployeeId(nextSelectedEmployeeId);

    if (activeTab === 'attendance') {
      if (nextSelectedEmployeeId) {
        await reloadHistory(nextSelectedEmployeeId);
      } else {
        setRecords([]);
      }
    }
  };

  const reloadHistory = async (employeeId: number) => {
    setError(null);
    setIsHistoryLoading(true);
    try {
      const history = await fetchAttendanceHistory(employeeId);
      setRecords(history);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load attendance');
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const onSelect = async (employee: Employee) => {
    setSelectedEmployeeId(employee.id);
    await reloadHistory(employee.id);
  };

  const onSave = async (input: {
    date: string;
    status: 'present' | 'absent' | 'half-day' | 'leave';
    notes?: string;
  }) => {
    if (!selectedEmployee) return;
    setError(null);
    setIsSaving(true);
    try {
      await upsertAttendance({
        userId: selectedEmployee.id,
        date: input.date,
        status: input.status,
        notes: input.notes,
      });
      await reloadHistory(selectedEmployee.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save attendance');
    } finally {
      setIsSaving(false);
    }
  };

  const onCreateAccount = async (input: CreateEmployeeInput) => {
    const createdUser = await createEmployeeAccount(input);

    setEmployees((current) =>
      [...current, createdUser].sort((left, right) => left.name.localeCompare(right.name))
    );

    if (!selectedEmployeeId) {
      setSelectedEmployeeId(createdUser.id);
    }

    await refreshEmployees();
  };

  const onUpdateAccountAccess = async (input: UpdateEmployeeAccessInput) => {
    const updatedUser = await updateEmployeeAccess(input);

    setEmployees((current) =>
      current.map((employee) => (employee.id === updatedUser.id ? updatedUser : employee))
    );

    await refreshEmployees();
  };

  const onUpdateAccount = async (input: UpdateEmployeeAccountInput) => {
    const updatedUser = await updateEmployeeAccount(input);

    setEmployees((current) =>
      current
        .map((employee) => (employee.id === updatedUser.id ? updatedUser : employee))
        .sort((left, right) => left.name.localeCompare(right.name))
    );

    await refreshEmployees();
  };

  const onDeleteAccount = async (userId: number) => {
    await deleteEmployeeAccount(userId);
    setEmployees((current) => current.filter((employee) => employee.id !== userId));
    if (selectedEmployeeId === userId) {
      setSelectedEmployeeId(null);
      setRecords([]);
    }
    await refreshEmployees();
  };

  if (error) {
    return (
      <EmptyState
        title="Something went wrong"
        description={error}
        action={
          <Button
            variant="secondary"
            onClick={() => {
              reloadEmployees();
              if (selectedEmployeeId) reloadHistory(selectedEmployeeId);
            }}
          >
            Retry
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        <div className="rounded-2xl border border-sky-400/12 bg-sky-500/8 px-3 py-3 ring-1 ring-inset ring-sky-400/10 sm:px-5 sm:py-4">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-sky-300 sm:text-xs">Total Employees</div>
          <div className="mt-1.5 text-xl font-semibold text-slate-50 sm:mt-2 sm:text-2xl">{adminStats.total}</div>
          <div className="mt-1 text-[11px] leading-4 text-slate-400 sm:text-sm sm:leading-5">Accounts currently tracked by admin</div>
        </div>
        <div className="rounded-2xl border border-emerald-400/12 bg-emerald-500/8 px-3 py-3 ring-1 ring-inset ring-emerald-400/10 sm:px-5 sm:py-4">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-emerald-300 sm:text-xs">Active</div>
          <div className="mt-1.5 text-xl font-semibold text-slate-50 sm:mt-2 sm:text-2xl">{adminStats.active}</div>
          <div className="mt-1 text-[11px] leading-4 text-slate-400 sm:text-sm sm:leading-5">Employees with normal access</div>
        </div>
        <div className="rounded-2xl border border-amber-400/12 bg-amber-500/8 px-3 py-3 ring-1 ring-inset ring-amber-400/10 sm:px-5 sm:py-4">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-amber-300 sm:text-xs">Restricted</div>
          <div className="mt-1.5 text-xl font-semibold text-slate-50 sm:mt-2 sm:text-2xl">{adminStats.restricted}</div>
          <div className="mt-1 text-[11px] leading-4 text-slate-400 sm:text-sm sm:leading-5">Employees with temporary login blocks</div>
        </div>
        <div className="rounded-2xl border border-rose-400/12 bg-rose-500/8 px-3 py-3 ring-1 ring-inset ring-rose-400/10 sm:px-5 sm:py-4">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-rose-300 sm:text-xs">Banned</div>
          <div className="mt-1.5 text-xl font-semibold text-slate-50 sm:mt-2 sm:text-2xl">{adminStats.banned}</div>
          <div className="mt-1 text-[11px] leading-4 text-slate-400 sm:text-sm sm:leading-5">Employees permanently blocked</div>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Button
          className="w-full sm:w-auto"
          variant={activeTab === 'attendance' ? 'primary' : 'secondary'}
          onClick={async () => {
            setActiveTab('attendance');
            if (selectedEmployeeId) {
              await reloadHistory(selectedEmployeeId);
            }
          }}
        >
          Attendance
        </Button>
        <Button
          className="w-full sm:w-auto"
          variant={activeTab === 'accounts' ? 'primary' : 'secondary'}
          onClick={() => setActiveTab('accounts')}
        >
          Accounts
        </Button>
      </div>

      {activeTab === 'accounts' ? (
        <AccountManagementPanel
          accounts={employees}
          onCreate={onCreateAccount}
          onUpdateAccount={onUpdateAccount}
          onUpdateAccess={onUpdateAccountAccess}
          onDelete={onDeleteAccount}
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <EmployeeList
              employees={employees}
              selectedEmployeeId={selectedEmployeeId}
              onSelect={onSelect}
              isLoading={isEmployeesLoading}
            />
          </div>
          <div className="space-y-6 lg:col-span-2">
            {employees.length === 0 && !isEmployeesLoading ? (
              <EmptyState
                title="No employees found"
                description="Create an employee account in the Accounts tab to start tracking attendance."
                action={
                  <Button variant="secondary" onClick={() => setActiveTab('accounts')}>
                    Open Accounts
                  </Button>
                }
              />
            ) : selectedEmployee ? (
              <>
                <Card>
                  <CardBody>
                    <div className="flex flex-col gap-4">
                      <div>
                        <div className="text-lg font-semibold text-slate-100">
                          {selectedEmployee.name}
                        </div>
                        <div className="mt-1 text-sm text-slate-400">
                          {selectedEmployee.email}
                        </div>
                        <div className="mt-2 inline-flex items-center rounded-full bg-sky-500/10 px-3 py-1 text-xs font-medium text-sky-300 ring-1 ring-inset ring-sky-400/20">
                          {selectedEmployee.position || 'No position set'}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 min-[420px]:grid-cols-2 sm:grid-cols-4">
                        <div className="rounded-xl bg-slate-900/85 px-3 py-2 ring-1 ring-inset ring-slate-800">
                          <div className="text-xs font-medium text-slate-400">Present</div>
                          <div className="mt-1 flex items-center justify-between gap-3">
                            <div className="text-lg font-semibold text-slate-100">
                              {last30DaysCounts.present}
                            </div>
                            <AttendanceStatusBadge status="present" />
                          </div>
                        </div>
                        <div className="rounded-xl bg-slate-900/85 px-3 py-2 ring-1 ring-inset ring-slate-800">
                          <div className="text-xs font-medium text-slate-400">Absent</div>
                          <div className="mt-1 flex items-center justify-between gap-3">
                            <div className="text-lg font-semibold text-slate-100">
                              {last30DaysCounts.absent}
                            </div>
                            <AttendanceStatusBadge status="absent" />
                          </div>
                        </div>
                        <div className="rounded-xl bg-slate-900/85 px-3 py-2 ring-1 ring-inset ring-slate-800">
                          <div className="text-xs font-medium text-slate-400">Half Day</div>
                          <div className="mt-1 flex items-center justify-between gap-3">
                            <div className="text-lg font-semibold text-slate-100">
                              {last30DaysCounts['half-day']}
                            </div>
                            <AttendanceStatusBadge status="half-day" />
                          </div>
                        </div>
                        <div className="rounded-xl bg-slate-900/85 px-3 py-2 ring-1 ring-inset ring-slate-800">
                          <div className="text-xs font-medium text-slate-400">Leave</div>
                          <div className="mt-1 flex items-center justify-between gap-3">
                            <div className="text-lg font-semibold text-slate-100">
                              {last30DaysCounts.leave}
                            </div>
                            <AttendanceStatusBadge status="leave" />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 text-xs text-slate-500">
                      Last 30 days overview
                    </div>
                  </CardBody>
                </Card>
                <AttendanceForm
                  employee={selectedEmployee}
                  onSave={onSave}
                  isSaving={isSaving}
                />
                <AttendanceTable records={records} isLoading={isHistoryLoading} />
              </>
            ) : (
              <EmptyState
                title="Select an employee"
                description="Choose an employee from the list to view and manage attendance."
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
