'use client';

import { useEffect, useMemo, useState } from 'react';
import { EmptyState } from '@/components/ui/EmptyState';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { RefreshButton } from '@/components/ui/RefreshButton';
import {
  createViolationCase,
  createEmployeeAccount,
  deleteEmployeeAccount,
  fetchAttendanceHistory,
  fetchEmployees,
  fetchLeaveRequests,
  fetchViolationCases,
  resolveViolationAppeal,
  reviewEmployeeLeaveRequest,
  updateEmployeeAccount,
  updateEmployeeAccess,
  updateViolationCase,
  upsertAttendance,
} from '@/modules/admin/api';
import { AccountManagementPanel } from '@/modules/admin/components/AccountManagementPanel';
import { AdminSidebar, type AdminView } from '@/modules/admin/components/AdminSidebar';
import { AdminOverviewPanel } from '@/modules/admin/components/AdminOverviewPanel';
import { AdminInsightsPanel } from '@/modules/admin/components/AdminInsightsPanel';
import { AuditTrailPanel } from '@/modules/admin/components/AuditTrailPanel';
import { PanelItem, PanelTransition } from '@/components/motion/PanelTransition';
import { NavHighlight } from '@/components/motion/NavHighlight';
import { AdminMoreSheet, isAdminOverflowView } from '@/modules/admin/components/AdminMoreSheet';
import { HolidayCalendarPanel } from '@/modules/admin/components/HolidayCalendarPanel';
import { LeaveRequestsPanel } from '@/modules/admin/components/LeaveRequestsPanel';
import { NewViolationPanel } from '@/modules/admin/components/NewViolationPanel';
import { ViolationCasesPanel } from '@/modules/admin/components/ViolationCasesPanel';
import { employeeAccountStatus } from '@/modules/admin/types';
import type { Employee } from '@/modules/admin/types';
import { EmployeeList } from '@/modules/admin/components/EmployeeList';
import { AttendanceForm } from '@/modules/admin/components/AttendanceForm';
import { AttendanceTable } from '@/modules/admin/components/AttendanceTable';
import type {
  AdminAttendanceRecord,
  AdminViolationRecord,
  CreateViolationInput,
  CreateEmployeeInput,
  ResolveViolationAppealInput,
  UpdateEmployeeAccountInput,
  UpdateEmployeeAccessInput,
  UpdateViolationInput,
} from '@/modules/admin/types';
import { AttendanceStatusBadge } from '@/modules/attendance/components/AttendanceStatusBadge';
import type { AttendanceStatus } from '@/modules/attendance/types';
import type { AdminLeaveRequest } from '@/modules/leave/types';

const leaveAwareViews: AdminView[] = [
  'dashboard',
  'leave-requests',
  'reports-charts',
  'smart-insights',
];

const violationAwareViews: AdminView[] = [
  'dashboard',
  'reports-charts',
  'smart-insights',
  'new-violation',
  'all-violation-cases',
];

function AdminMobilePrimaryIcon({
  item,
}: {
  item: 'dashboard' | 'employees' | 'leave-requests' | 'smart-insights' | 'menu';
}) {
  switch (item) {
    case 'dashboard':
      return (
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="h-4 w-4">
          <path d="M4.5 10.5H8.5V15.5H4.5V10.5Z" stroke="currentColor" strokeWidth="1.5" />
          <path d="M11.5 4.5H15.5V15.5H11.5V4.5Z" stroke="currentColor" strokeWidth="1.5" />
          <path d="M4.5 4.5H8.5V8H4.5V4.5Z" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
    case 'employees':
      return (
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="h-4 w-4">
          <path
            d="M6.5 8C7.88071 8 9 6.88071 9 5.5C9 4.11929 7.88071 3 6.5 3C5.11929 3 4 4.11929 4 5.5C4 6.88071 5.11929 8 6.5 8Z"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path d="M3.5 15C3.9 12.9 5.1 12 6.6 12H8.2C9.7 12 10.9 12.9 11.3 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M12.2 6H16.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M12.2 9H16.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case 'leave-requests':
      return (
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="h-4 w-4">
          <path d="M6 4.5H14C14.8284 4.5 15.5 5.17157 15.5 6V16L10 13.2L4.5 16V6C4.5 5.17157 5.17157 4.5 6 4.5Z" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
    case 'smart-insights':
      return (
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="h-4 w-4">
          <path d="M10 3.5C7.1 3.5 4.75 5.85 4.75 8.75C4.75 10.55 5.55 11.9 6.6 12.85C7.15 13.35 7.5 13.95 7.5 14.65V15.25H12.5V14.65C12.5 13.95 12.85 13.35 13.4 12.85C14.45 11.9 15.25 10.55 15.25 8.75C15.25 5.85 12.9 3.5 10 3.5Z" stroke="currentColor" strokeWidth="1.5" />
          <path d="M8 17H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case 'menu':
      return (
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="h-4 w-4">
          <path d="M4.5 6.5H15.5M4.5 10H15.5M4.5 13.5H15.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
  }
}

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
  const [isLeaveRequestsLoading, setIsLeaveRequestsLoading] = useState(false);
  const [leaveRequests, setLeaveRequests] = useState<AdminLeaveRequest[]>([]);
  const [leaveError, setLeaveError] = useState<string | null>(null);
  const [isViolationsLoading, setIsViolationsLoading] = useState(false);
  const [violations, setViolations] = useState<AdminViolationRecord[]>([]);
  const [violationsError, setViolationsError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<AdminView>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isEmployeePickerOpen, setIsEmployeePickerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedEmployee = useMemo(() => {
    if (!selectedEmployeeId) return null;
    return employees.find((e) => e.id === selectedEmployeeId) || null;
  }, [employees, selectedEmployeeId]);

  const selectedEmployeeLast30DaysCounts = useMemo(() => {
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

  const pendingLeaveCount = useMemo(
    () => leaveRequests.filter((request) => request.status === 'pending').length,
    [leaveRequests]
  );

  const accountAttentionCount = adminStats.restricted + adminStats.banned;

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

    if (activeView === 'employees') {
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

  const loadLeaveRequests = async () => {
    setLeaveError(null);
    setIsLeaveRequestsLoading(true);
    try {
      const items = await fetchLeaveRequests();
      setLeaveRequests(items);
    } catch (leaveLoadError) {
      setLeaveError(
        leaveLoadError instanceof Error ? leaveLoadError.message : 'Failed to load leave requests'
      );
    } finally {
      setIsLeaveRequestsLoading(false);
    }
  };

  const loadViolationCases = async () => {
    setViolationsError(null);
    setIsViolationsLoading(true);
    try {
      const items = await fetchViolationCases();
      setViolations(items);
    } catch (violationLoadError) {
      setViolationsError(
        violationLoadError instanceof Error
          ? violationLoadError.message
          : 'Failed to load violation cases'
      );
    } finally {
      setIsViolationsLoading(false);
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

  const onReviewLeaveRequest = async (input: {
    requestId: number;
    action: 'approve' | 'reject';
    adminNotes?: string;
  }) => {
    await reviewEmployeeLeaveRequest(input);
    await loadLeaveRequests();

    if (selectedEmployeeId) {
      await reloadHistory(selectedEmployeeId);
    }
  };

  const onCreateViolation = async (input: CreateViolationInput) => {
    const createdViolation = await createViolationCase(input);
    setViolations((current) => [createdViolation, ...current]);
  };

  const onUpdateViolation = async (input: UpdateViolationInput) => {
    const updatedViolation = await updateViolationCase(input);
    setViolations((current) =>
      current.map((violation) => (violation.id === updatedViolation.id ? updatedViolation : violation))
    );
  };

  const onResolveViolationAppeal = async (input: ResolveViolationAppealInput) => {
    const updatedViolation = await resolveViolationAppeal(input);
    setViolations((current) =>
      current.map((violation) => (violation.id === updatedViolation.id ? updatedViolation : violation))
    );
  };

  useEffect(() => {
    const shouldLoadLeave = leaveAwareViews.includes(activeView);
    const shouldLoadViolations = violationAwareViews.includes(activeView);

    if (!shouldLoadLeave && !shouldLoadViolations) {
      return;
    }

    let cancelled = false;

    const refresh = async () => {
      if (cancelled) return;

      await Promise.allSettled([
        shouldLoadLeave ? loadLeaveRequests() : Promise.resolve(),
        shouldLoadViolations ? loadViolationCases() : Promise.resolve(),
      ]);
    };

    void refresh();
    const intervalId = window.setInterval(() => {
      void refresh();
    }, 10000);

    const handleFocus = () => {
      void refresh();
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [activeView]);

  useEffect(() => {
    // The More sheet locks scrolling itself; locking here too meant two effects each
    // saving and restoring body overflow, which could leave the page stuck unscrollable.
    if (!isEmployeePickerOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isEmployeePickerOpen]);

  const openView = async (view: AdminView) => {
    setActiveView(view);
    setIsMobileSidebarOpen(false);

    if (view === 'employees' && selectedEmployeeId) {
      await reloadHistory(selectedEmployeeId);
    }

    const pendingLoads: Array<Promise<void>> = [];

    if (leaveAwareViews.includes(view) && leaveRequests.length === 0) {
      pendingLoads.push(loadLeaveRequests());
    }

    if (violationAwareViews.includes(view) && violations.length === 0) {
      pendingLoads.push(loadViolationCases());
    }

    if (pendingLoads.length > 0) {
      await Promise.allSettled(pendingLoads);
    }
  };

  if (error) {
    return (
      <EmptyState
        title="Something went wrong"
        description={error}
        action={
          <Button
            variant="secondary"
            onClick={async () => {
              await reloadEmployees();
              if (leaveAwareViews.includes(activeView)) {
                await loadLeaveRequests();
              }
              if (violationAwareViews.includes(activeView)) {
                await loadViolationCases();
              }
            }}
          >
            Retry
          </Button>
        }
      />
    );
  }

  const renderSelectedEmployeeSummary = (showPickerButton: boolean) =>
    selectedEmployee ? (
      <Card>
        <CardBody>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="text-lg font-semibold text-slate-100">{selectedEmployee.name}</div>
                <div className="mt-1 text-sm text-slate-400">{selectedEmployee.email}</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <div className="inline-flex items-center rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-300 ring-1 ring-inset ring-cyan-400/20">
                    {selectedEmployee.company || 'Unassigned company'}
                  </div>
                  <div className="inline-flex items-center rounded-full bg-sky-500/10 px-3 py-1 text-xs font-medium text-sky-300 ring-1 ring-inset ring-sky-400/20">
                    {selectedEmployee.position || 'No position set'}
                  </div>
                </div>
              </div>
              {showPickerButton ? (
                <Button
                  className="w-full sm:w-auto"
                  variant="secondary"
                  onClick={() => setIsEmployeePickerOpen(true)}
                >
                  Switch Employee
                </Button>
              ) : null}
            </div>
            <div className="grid grid-cols-2 gap-2 min-[420px]:grid-cols-2 sm:grid-cols-4">
              <div className="rounded-xl bg-slate-900/85 px-3 py-2 ring-1 ring-inset ring-slate-800">
                <div className="text-xs font-medium text-slate-400">Present</div>
                <div className="mt-1 flex items-center justify-between gap-3">
                  <div className="text-lg font-semibold text-slate-100">
                    {selectedEmployeeLast30DaysCounts.present}
                  </div>
                  <AttendanceStatusBadge status="present" />
                </div>
              </div>
              <div className="rounded-xl bg-slate-900/85 px-3 py-2 ring-1 ring-inset ring-slate-800">
                <div className="text-xs font-medium text-slate-400">Absent</div>
                <div className="mt-1 flex items-center justify-between gap-3">
                  <div className="text-lg font-semibold text-slate-100">
                    {selectedEmployeeLast30DaysCounts.absent}
                  </div>
                  <AttendanceStatusBadge status="absent" />
                </div>
              </div>
              <div className="rounded-xl bg-slate-900/85 px-3 py-2 ring-1 ring-inset ring-slate-800">
                <div className="text-xs font-medium text-slate-400">Half Day</div>
                <div className="mt-1 flex items-center justify-between gap-3">
                  <div className="text-lg font-semibold text-slate-100">
                    {selectedEmployeeLast30DaysCounts['half-day']}
                  </div>
                  <AttendanceStatusBadge status="half-day" />
                </div>
              </div>
              <div className="rounded-xl bg-slate-900/85 px-3 py-2 ring-1 ring-inset ring-slate-800">
                <div className="text-xs font-medium text-slate-400">Leave</div>
                <div className="mt-1 flex items-center justify-between gap-3">
                  <div className="text-lg font-semibold text-slate-100">
                    {selectedEmployeeLast30DaysCounts.leave}
                  </div>
                  <AttendanceStatusBadge status="leave" />
                </div>
              </div>
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-500">Last 30 days overview</div>
        </CardBody>
      </Card>
    ) : null;

  // Overview, reports and insights draw on every dataset, so their refresh reloads all
  // of them. It lives in each panel's header, beside what it updates.
  const isAnyDataLoading = isLeaveRequestsLoading || isViolationsLoading || isEmployeesLoading;
  const allDataRefreshControl = (
    <RefreshButton
      label="Refresh data"
      isLoading={isAnyDataLoading}
      onClick={() => {
        void Promise.allSettled([loadLeaveRequests(), loadViolationCases(), reloadEmployees()]);
      }}
    />
  );
  const employeesRefreshControl = (
    <RefreshButton
      label="Refresh employees"
      isLoading={isEmployeesLoading}
      onClick={() => void reloadEmployees()}
    />
  );

  const renderEmployeesView = () => (
    <>
      <div className="space-y-6 lg:hidden">
        {employees.length === 0 && !isEmployeesLoading ? (
          <EmptyState
            title="No employees found"
            description="Create an employee account in System > Employee Accounts to start tracking attendance."
            action={
              <Button variant="secondary" onClick={() => void openView('employee-accounts')}>
                Open Employee Accounts
              </Button>
            }
          />
        ) : selectedEmployee ? (
          <>
            {renderSelectedEmployeeSummary(true)}
            <AttendanceForm employee={selectedEmployee} onSave={onSave} isSaving={isSaving} />
            <AttendanceTable records={records} isLoading={isHistoryLoading} />
          </>
        ) : (
          <EmptyState
            title="Select an employee"
            description="Choose an employee to manage attendance and recent activity."
            action={
              <Button variant="secondary" onClick={() => setIsEmployeePickerOpen(true)}>
                Choose Employee
              </Button>
            }
          />
        )}
      </div>

      <div className="hidden lg:grid lg:grid-cols-3 lg:gap-6">
        <div className="lg:col-span-1">
          <EmployeeList
            employees={employees}
            selectedEmployeeId={selectedEmployeeId}
            onSelect={onSelect}
            isLoading={isEmployeesLoading}
            headerAction={employeesRefreshControl}
          />
        </div>
        <div className="space-y-6 lg:col-span-2">
          {employees.length === 0 && !isEmployeesLoading ? (
            <EmptyState
              title="No employees found"
              description="Create an employee account in System > Employee Accounts to start tracking attendance."
              action={
                <Button variant="secondary" onClick={() => void openView('employee-accounts')}>
                  Open Employee Accounts
                </Button>
              }
            />
          ) : selectedEmployee ? (
            <>
              {renderSelectedEmployeeSummary(false)}
              <AttendanceForm employee={selectedEmployee} onSave={onSave} isSaving={isSaving} />
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
    </>
  );

  return (
    <>
      {/* Phones get a bottom sheet of the sections the bottom bar does not reach, in place
          of the desktop sidebar slid in from the left. */}
      <AdminMoreSheet
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
        activeView={activeView}
        attentionCount={accountAttentionCount}
        onSelect={(view) => void openView(view)}
      />

      <div
        className={[
          'app-mobile-content-pad grid grid-cols-1 gap-6 px-3 sm:px-4 xl:gap-0 xl:px-0 xl:pb-0',
          isSidebarCollapsed
            ? 'xl:grid-cols-[104px_minmax(0,1fr)]'
            : 'xl:grid-cols-[280px_minmax(0,1fr)]',
        ].join(' ')}
      >
        <div className="hidden xl:block xl:sticky xl:top-16 xl:self-start xl:border-r xl:border-slate-800/80 xl:bg-slate-950/35">
        <AdminSidebar
          activeView={activeView}
          pendingLeaveCount={pendingLeaveCount}
          attentionCount={accountAttentionCount}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((current) => !current)}
          onSelect={(view) => void openView(view)}
        />
        </div>

        <div className="space-y-6 xl:px-8">
          <PanelTransition viewKey={activeView}>
            <PanelItem>
          {activeView === 'dashboard' ? (
            <AdminOverviewPanel
              employees={employees}
              leaveRequests={leaveRequests}
              violations={violations}
              isLeaveDataLoading={isLeaveRequestsLoading}
              isViolationDataLoading={isViolationsLoading}
              onOpenView={(view) => void openView(view)}
              headerAction={allDataRefreshControl}
            />
          ) : activeView === 'employees' ? (
            renderEmployeesView()
          ) : activeView === 'leave-requests' ? (
            <LeaveRequestsPanel
              requests={leaveRequests}
              isLoading={isLeaveRequestsLoading}
              error={leaveError}
              onReview={onReviewLeaveRequest}
              onRefresh={loadLeaveRequests}
            />
          ) : activeView === 'reports-charts' ? (
            <AdminOverviewPanel
              mode="reports"
              employees={employees}
              leaveRequests={leaveRequests}
              violations={violations}
              isLeaveDataLoading={isLeaveRequestsLoading}
              isViolationDataLoading={isViolationsLoading}
              onOpenView={(view) => void openView(view)}
              headerAction={allDataRefreshControl}
            />
          ) : activeView === 'smart-insights' ? (
            <AdminInsightsPanel
              employees={employees}
              leaveRequests={leaveRequests}
              violations={violations}
              isLeaveDataLoading={isLeaveRequestsLoading}
              isViolationDataLoading={isViolationsLoading}
              onOpenView={(view) => void openView(view)}
              headerAction={allDataRefreshControl}
            />
          ) : activeView === 'holiday-calendar' ? (
            <HolidayCalendarPanel />
          ) : activeView === 'employee-accounts' ? (
            <AccountManagementPanel
              accounts={employees}
              isLoading={isEmployeesLoading}
              onCreate={onCreateAccount}
              onUpdateAccount={onUpdateAccount}
              onUpdateAccess={onUpdateAccountAccess}
              onDelete={onDeleteAccount}
            />
          ) : activeView === 'new-violation' ? (
            <NewViolationPanel
              employees={employees}
              violations={violations}
              isLoading={isViolationsLoading}
              error={violationsError}
              onCreate={onCreateViolation}
              onRefresh={loadViolationCases}
            />
          ) : activeView === 'all-violation-cases' ? (
            <ViolationCasesPanel
              violations={violations}
              isLoading={isViolationsLoading}
              error={violationsError}
              onRefresh={loadViolationCases}
              onUpdate={onUpdateViolation}
              onResolveAppeal={onResolveViolationAppeal}
            />
          ) : (
            <AuditTrailPanel />
          )}
            </PanelItem>
          </PanelTransition>
        </div>
      </div>

      {isEmployeePickerOpen ? (
        <div className="app-overlay-scroll bg-slate-950/75 backdrop-blur-sm lg:hidden">
          <div className="app-overlay-panel max-w-2xl rounded-2xl border border-slate-800/80 bg-slate-950/95 p-4 shadow-[0_22px_60px_rgba(8,6,4,0.55)] ring-1 ring-inset ring-white/5 sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <div className="text-lg font-semibold text-slate-100">Choose Employee</div>
                <div className="mt-1 text-sm text-slate-400">
                  Switch the active employee without using the desktop split view.
                </div>
              </div>
              <Button variant="secondary" size="sm" onClick={() => setIsEmployeePickerOpen(false)}>
                Close
              </Button>
            </div>
            <EmployeeList
              employees={employees}
              selectedEmployeeId={selectedEmployeeId}
              onSelect={async (employee) => {
                await onSelect(employee);
                setIsEmployeePickerOpen(false);
              }}
              isLoading={isEmployeesLoading}
              headerAction={employeesRefreshControl}
            />
          </div>
        </div>
      ) : null}

      <div className="app-mobile-bottom-nav xl:hidden">
        <div className="grid grid-cols-5 gap-2 p-2">
          {([
            ['dashboard', 'Home'],
            ['employees', 'Staff'],
            ['leave-requests', 'Leave'],
            ['smart-insights', 'Insights'],
          ] as const).map(([view, label]) => {
            const isActive = activeView === view;
            return (
              <button
                key={view}
                type="button"
                onClick={() => void openView(view)}
                aria-current={isActive ? 'page' : undefined}
                className={[
                  'relative isolate flex min-h-[56px] flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 text-center text-[11px] font-medium',
                  'transition-colors duration-150 active:scale-[0.96] motion-reduce:active:scale-100',
                  isActive
                    ? 'text-sky-300'
                    : 'text-slate-500 hover:bg-slate-900/60 hover:text-slate-300',
                ].join(' ')}
              >
                {isActive ? (
                  <NavHighlight layoutId="admin-bottom-nav" className="rounded-2xl bg-sky-500/10" />
                ) : null}
                <AdminMobilePrimaryIcon item={view} />
                <span>{label}</span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setIsMobileSidebarOpen(true)}
            aria-haspopup="dialog"
            aria-current={isAdminOverflowView(activeView) ? 'page' : undefined}
            className={[
              'relative isolate flex min-h-[56px] flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 text-center text-[11px] font-medium',
              'transition-colors duration-150 active:scale-[0.96] motion-reduce:active:scale-100',
              isAdminOverflowView(activeView)
                ? 'text-sky-300'
                : 'text-slate-500 hover:bg-slate-900/60 hover:text-slate-300',
            ].join(' ')}
          >
            {/* When the open section lives in the sheet, "More" carries the highlight so the
                bar still says where you are. */}
            {isAdminOverflowView(activeView) ? (
              <NavHighlight layoutId="admin-bottom-nav" className="rounded-2xl bg-sky-500/10" />
            ) : null}
            <AdminMobilePrimaryIcon item="menu" />
            <span>More</span>
          </button>
        </div>
      </div>
    </>
  );
}
