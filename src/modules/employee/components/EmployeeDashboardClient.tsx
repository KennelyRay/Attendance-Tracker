'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { triggerGlobalNavigationLoader } from '@/components/layout/navigation-loader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { fetchMyAttendance, fetchMyProfile, fetchMyViolations } from '@/modules/employee/api';
import type {
  EmployeeAttendanceRecord,
  EmployeeAttendanceStats,
  EmployeePortalProfile,
  EmployeeViolationRecord,
} from '@/modules/employee/types';
import {
  EmployeeSidebar,
  employeeViewLabel,
  type EmployeeView,
} from '@/modules/employee/components/EmployeeSidebar';
import { AttendanceTable } from '@/modules/employee/components/AttendanceTable';
import { LeaveManagementPanel } from '@/modules/employee/components/LeaveManagementPanel';
import { EmployeeViolationsPanel } from '@/modules/employee/components/EmployeeViolationsPanel';
import { MonthYearPicker } from '@/modules/employee/components/MonthYearPicker';
import type { LeaveBalance, LeaveRequest } from '@/modules/leave/types';

const defaultStats: EmployeeAttendanceStats = {
  present: 0,
  absent: 0,
  'half-day': 0,
  leave: 0,
};

function monthLabel(month: string, year: string) {
  return new Date(Number(year), Number(month) - 1, 1).toLocaleString('default', {
    month: 'long',
    year: 'numeric',
  });
}

function buildAttendancePie(segments: Array<{ percentage: number; color: string }>) {
  const nonZeroSegments = segments.filter((segment) => segment.percentage > 0);

  if (nonZeroSegments.length === 0) {
    return 'conic-gradient(rgba(15,23,42,0.95) 0deg 360deg)';
  }

  let current = 0;
  const stops = nonZeroSegments.map((segment) => {
    const start = current;
    current += (segment.percentage / 100) * 360;
    return `${segment.color} ${start}deg ${current}deg`;
  });

  if (current < 360) {
    stops.push(`rgba(15,23,42,0.95) ${current}deg 360deg`);
  }

  return `conic-gradient(${stops.join(', ')})`;
}

export function EmployeeDashboardClient({
  initialMonth,
  initialYear,
  initialRecords,
  initialStats,
  initialLeaveBalance,
  initialLeaveRequests,
  initialViolations,
}: {
  initialMonth: string;
  initialYear: string;
  initialRecords: EmployeeAttendanceRecord[];
  initialStats: EmployeeAttendanceStats;
  initialLeaveBalance: LeaveBalance;
  initialLeaveRequests: LeaveRequest[];
  initialViolations: EmployeeViolationRecord[];
}) {
  const router = useRouter();
  const [month, setMonth] = useState(initialMonth);
  const [year, setYear] = useState(initialYear);
  const [records, setRecords] = useState<EmployeeAttendanceRecord[]>(initialRecords);
  const [stats, setStats] = useState<EmployeeAttendanceStats>({
    ...defaultStats,
    ...initialStats,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [violations, setViolations] = useState<EmployeeViolationRecord[]>(initialViolations);
  const [isViolationsLoading, setIsViolationsLoading] = useState(false);
  const [violationsError, setViolationsError] = useState<string | null>(null);
  const [employeeProfile, setEmployeeProfile] = useState<EmployeePortalProfile | null>(null);
  const [activeView, setActiveView] = useState<EmployeeView>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

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

  const loadViolations = async () => {
    setViolationsError(null);
    setIsViolationsLoading(true);
    try {
      const items = await fetchMyViolations();
      setViolations(items);
    } catch (violationLoadError) {
      setViolationsError(
        violationLoadError instanceof Error
          ? violationLoadError.message
          : 'Failed to load violations'
      );
    } finally {
      setIsViolationsLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const refresh = async () => {
      if (cancelled) return;
      await loadViolations();
    };

    const intervalId = window.setInterval(() => {
      void refresh();
    }, 15000);

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
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      try {
        const profile = await fetchMyProfile();
        if (!cancelled) {
          setEmployeeProfile(profile);
        }
      } catch {
        // Keep the current dashboard summary visible if the refresh fails.
      }
    };

    void loadProfile();
    const intervalId = window.setInterval(() => {
      void loadProfile();
    }, 10000);

    const handleFocus = () => {
      void loadProfile();
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, []);

  const totalTrackedDays = useMemo(
    () => (stats.present ?? 0) + (stats.absent ?? 0) + (stats['half-day'] ?? 0) + (stats.leave ?? 0),
    [stats]
  );

  const attendanceSummary = useMemo(
    () =>
      [
      {
        label: 'Present',
        value: stats.present ?? 0,
        toneClass: 'bg-emerald-500/12 text-emerald-300 ring-1 ring-inset ring-emerald-400/20',
        barClass: 'bg-emerald-400',
        pieColor: '#34d399',
      },
      {
        label: 'Absent',
        value: stats.absent ?? 0,
        toneClass: 'bg-rose-500/12 text-rose-300 ring-1 ring-inset ring-rose-400/20',
        barClass: 'bg-rose-400',
        pieColor: '#fb7185',
      },
      {
        label: 'Half Day',
        value: stats['half-day'] ?? 0,
        toneClass: 'bg-amber-500/12 text-amber-300 ring-1 ring-inset ring-amber-400/20',
        barClass: 'bg-amber-400',
        pieColor: '#fbbf24',
      },
      {
        label: 'Leave',
        value: stats.leave ?? 0,
        toneClass: 'bg-sky-500/12 text-sky-300 ring-1 ring-inset ring-sky-400/20',
        barClass: 'bg-sky-400',
        pieColor: '#38bdf8',
      },
    ].map((item) => ({
      ...item,
      percentage: totalTrackedDays > 0 ? Math.round((item.value / totalTrackedDays) * 100) : 0,
    })),
    [stats, totalTrackedDays]
  );

  const attendancePieBackground = useMemo(
    () =>
      buildAttendancePie(
        attendanceSummary.map((item) => ({
          percentage: item.percentage,
          color: item.pieColor,
        }))
      ),
    [attendanceSummary]
  );

  const dashboardSignals = useMemo(
    () => [
      {
        label: 'Tracked Days',
        value: String(totalTrackedDays),
        helper: `${monthLabel(month, year)} activity`,
      },
      {
        label: 'Present Share',
        value: `${totalTrackedDays > 0 ? Math.round((stats.present / totalTrackedDays) * 100) : 0}%`,
        helper: 'Based on recorded attendance',
      },
      {
        label: 'Pending Leave',
        value: String(initialLeaveRequests.filter((request) => request.status === 'pending').length),
        helper: 'Requests awaiting admin review',
      },
      {
        label: 'Open Violations',
        value: String(violations.filter((violation) => violation.case_status !== 'resolved').length),
        helper: 'Cases still open or under review',
      },
    ],
    [initialLeaveRequests, month, stats.present, totalTrackedDays, violations, year]
  );

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

  const renderActiveView = () => {
    switch (activeView) {
      case 'leave':
        return (
          <LeaveManagementPanel
            employeeProfile={employeeProfile}
            initialBalance={initialLeaveBalance}
            initialRequests={initialLeaveRequests}
          />
        );
      case 'violations':
        return (
          <EmployeeViolationsPanel
            employeeProfile={employeeProfile}
            violations={violations}
            isLoading={isViolationsLoading}
            error={violationsError}
            onRefresh={loadViolations}
          />
        );
      case 'attendance':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader
                title="Attendance Filters"
                subtitle="Choose the month and year for the attendance history you want to review."
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
                <div className="text-sm text-slate-400">
                  Showing attendance records for the selected month and year.
                </div>
              </CardBody>
            </Card>
            <AttendanceTable
              employeeProfile={employeeProfile}
              records={records}
              isLoading={isLoading}
            />
          </div>
        );
      default:
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader
                title="Attendance Insights"
                subtitle="Use the month filter to review your attendance with actual graph views."
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
                <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-[0.9fr_1.1fr]">
                    <div className="rounded-2xl border border-slate-800/80 bg-slate-900/55 px-4 py-5 ring-1 ring-inset ring-white/5">
                      <div className="text-sm font-semibold text-slate-100">Pie Graph</div>
                      <div className="mt-1 text-xs text-slate-500">
                        Distribution for {monthLabel(month, year)}
                      </div>
                      <div className="mt-6 flex flex-col items-center justify-center gap-5">
                        <div
                          className="relative h-44 w-44 rounded-full ring-1 ring-inset ring-white/10"
                          style={{ background: attendancePieBackground }}
                        >
                          <div className="absolute inset-[22%] flex items-center justify-center rounded-full bg-slate-950/95 ring-1 ring-inset ring-slate-800">
                            <div className="text-center">
                              <div className="text-3xl font-semibold text-slate-100">{totalTrackedDays}</div>
                              <div className="mt-1 text-xs uppercase tracking-wide text-slate-500">
                                Tracked Days
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="grid w-full grid-cols-2 gap-2">
                          {attendanceSummary.map((item) => (
                            <div
                              key={item.label}
                              className="rounded-xl border border-slate-800/80 bg-slate-950/60 px-3 py-2.5 ring-1 ring-inset ring-white/5"
                            >
                              <div className="flex items-center gap-2">
                                <span
                                  className="h-2.5 w-2.5 rounded-full"
                                  style={{ backgroundColor: item.pieColor }}
                                />
                                <span className="text-xs font-medium text-slate-300">{item.label}</span>
                              </div>
                              <div className="mt-2 text-sm font-semibold text-slate-100">
                                {item.value} day{item.value === 1 ? '' : 's'}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-800/80 bg-slate-900/55 px-4 py-5 ring-1 ring-inset ring-white/5">
                      <div className="text-sm font-semibold text-slate-100">Bar Graph</div>
                      <div className="mt-1 text-xs text-slate-500">
                        Compare each attendance type side by side
                      </div>
                      <div className="mt-5 space-y-4">
                        {attendanceSummary.map((item) => (
                          <div key={item.label}>
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2">
                                <span
                                  className="h-2.5 w-2.5 rounded-full"
                                  style={{ backgroundColor: item.pieColor }}
                                />
                                <div className="text-sm font-medium text-slate-200">{item.label}</div>
                              </div>
                              <div
                                className={[
                                  'rounded-full px-2.5 py-1 text-xs font-semibold',
                                  item.toneClass,
                                ].join(' ')}
                              >
                                {item.value} day{item.value === 1 ? '' : 's'} · {item.percentage}%
                              </div>
                            </div>
                            <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-950/90 ring-1 ring-inset ring-slate-800">
                              <div
                                className={['h-full rounded-full transition-all', item.barClass].join(' ')}
                                style={{ width: `${Math.max(item.percentage, item.value > 0 ? 8 : 0)}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="rounded-2xl border border-slate-800/80 bg-slate-900/55 px-4 py-4 ring-1 ring-inset ring-white/5">
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Profile Snapshot
                      </div>
                      <div className="mt-3 grid grid-cols-1 gap-3">
                        <div className="rounded-xl bg-slate-950/65 px-3 py-3 ring-1 ring-inset ring-slate-800">
                          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                            Company
                          </div>
                          <div className="mt-1.5 text-sm font-medium text-slate-100">
                            {employeeProfile?.company || 'Not assigned yet'}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="rounded-xl bg-slate-950/65 px-3 py-3 ring-1 ring-inset ring-slate-800">
                            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                              Position
                            </div>
                            <div className="mt-1.5 text-sm font-medium text-slate-100">
                              {employeeProfile?.position || 'Not assigned'}
                            </div>
                          </div>
                          <div className="rounded-xl bg-slate-950/65 px-3 py-3 ring-1 ring-inset ring-slate-800">
                            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                              Start Date
                            </div>
                            <div className="mt-1.5 text-sm font-medium text-slate-100">
                              {employeeProfile?.startDate
                                ? new Date(employeeProfile.startDate).toLocaleDateString()
                                : 'Not set'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {dashboardSignals.map((signal) => (
                        <div
                          key={signal.label}
                          className="rounded-2xl border border-slate-800/80 bg-slate-900/55 px-4 py-4 ring-1 ring-inset ring-white/5"
                        >
                          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            {signal.label}
                          </div>
                          <div className="mt-3 text-2xl font-semibold text-slate-100">{signal.value}</div>
                          <div className="mt-2 text-sm leading-6 text-slate-400">{signal.helper}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        );
    }
  };

  const navigateToLeavePolicy = () => {
    triggerGlobalNavigationLoader({
      title: 'Loading leave policy',
      description: 'Preparing the latest leave guidance for a smoother read.',
    });
    window.requestAnimationFrame(() => {
      router.push('/employee/leave-policy');
    });
  };

  return (
    <>
      {isMobileSidebarOpen ? (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm xl:hidden">
          <div className="h-full w-[min(21rem,85vw)]">
            <EmployeeSidebar
              activeView={activeView}
              mode="mobile"
              onCloseMobile={() => setIsMobileSidebarOpen(false)}
              onSelect={(view) => {
                setActiveView(view);
                setIsMobileSidebarOpen(false);
              }}
            />
          </div>
        </div>
      ) : null}

      <div
        className="grid grid-cols-1 gap-6 px-3 sm:px-4 xl:grid-cols-[280px_minmax(0,1fr)] xl:gap-0 xl:px-0"
      >
        <div className="hidden border-r border-slate-800/80 xl:block">
          <div className="sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
            <EmployeeSidebar activeView={activeView} onSelect={setActiveView} />
          </div>
        </div>

        <div className="min-w-0 xl:px-6 xl:py-6">
          <div className="space-y-6">
            <div className="flex flex-col gap-3 border-b border-slate-800/80 pb-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => setIsMobileSidebarOpen(true)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800/80 bg-slate-950/80 text-slate-300 ring-1 ring-inset ring-white/5 transition-colors hover:bg-slate-900 xl:hidden"
                  aria-label="Open employee navigation"
                >
                  <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="h-4 w-4">
                    <path
                      d="M4.5 6.5H15.5M4.5 10H15.5M4.5 13.5H15.5"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
                <div className="space-y-1">
                  <div className="text-sm font-semibold text-slate-100">
                    {employeeViewLabel(activeView)}
                  </div>
                  <div className="text-sm text-slate-400">
                    {activeView === 'dashboard'
                      ? 'Track attendance trends and the most useful signals for your account.'
                      : activeView === 'leave'
                        ? 'Apply for leave and review your request history in one place.'
                        : activeView === 'violations'
                          ? 'Review your recorded violation cases and their latest status.'
                          : 'Browse your attendance history for the selected month and year.'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={navigateToLeavePolicy}
                className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-sky-500 to-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-[0_14px_32px_rgba(34,211,238,0.28)] ring-1 ring-inset ring-white/25 transition-all hover:from-sky-400 hover:to-cyan-300 hover:shadow-[0_18px_36px_rgba(34,211,238,0.34)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300"
              >
                View Leave Policy
              </button>
            </div>

            {renderActiveView()}
          </div>
        </div>
      </div>
    </>
  );
}
