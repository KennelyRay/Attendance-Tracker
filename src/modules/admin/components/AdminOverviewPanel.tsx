'use client';

import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { employeeAccountStatus, type Employee } from '@/modules/admin/types';
import type { AdminView } from '@/modules/admin/components/AdminSidebar';
import type { AdminLeaveRequest } from '@/modules/leave/types';

function getServiceYears(startDate: string) {
  const parsed = new Date(startDate);
  if (Number.isNaN(parsed.getTime())) {
    return 0;
  }

  const today = new Date();
  let years = today.getFullYear() - parsed.getFullYear();
  const hasReachedAnniversary =
    today.getMonth() > parsed.getMonth() ||
    (today.getMonth() === parsed.getMonth() && today.getDate() >= parsed.getDate());

  if (!hasReachedAnniversary) {
    years -= 1;
  }

  return Math.max(0, years);
}

function formatPercent(value: number, total: number) {
  if (total <= 0) {
    return '0%';
  }

  return `${Math.round((value / total) * 100)}%`;
}

function MetricStat({
  label,
  value,
  tone,
  description,
}: {
  label: string;
  value: string;
  tone: 'sky' | 'emerald' | 'amber' | 'violet';
  description: string;
}) {
  const toneClass =
    tone === 'sky'
      ? 'border-sky-400/12 bg-sky-500/8 ring-sky-400/10 text-sky-300'
      : tone === 'emerald'
        ? 'border-emerald-400/12 bg-emerald-500/8 ring-emerald-400/10 text-emerald-300'
        : tone === 'amber'
          ? 'border-amber-400/12 bg-amber-500/8 ring-amber-400/10 text-amber-300'
          : 'border-violet-400/12 bg-violet-500/8 ring-violet-400/10 text-violet-300';

  return (
    <div className={`rounded-2xl border px-4 py-4 ring-1 ring-inset ${toneClass}`}>
      <div className="text-[11px] font-semibold uppercase tracking-wide">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-slate-50">{value}</div>
      <div className="mt-1.5 text-sm leading-5 text-slate-400">{description}</div>
    </div>
  );
}

function ProgressBars({
  title,
  subtitle,
  items,
}: {
  title: string;
  subtitle: string;
  items: Array<{ label: string; value: number; toneClass: string }>;
}) {
  const max = Math.max(1, ...items.map((item) => item.value));

  return (
    <Card>
      <CardHeader title={title} subtitle={subtitle} />
      <CardBody>
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.label}>
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-medium text-slate-200">{item.label}</div>
                <div className="text-sm text-slate-400">{item.value}</div>
              </div>
              <div className="mt-2 h-2.5 rounded-full bg-slate-900/90 ring-1 ring-inset ring-slate-800">
                <div
                  className={`h-full rounded-full ${item.toneClass}`}
                  style={{ width: `${Math.max(10, Math.round((item.value / max) * 100))}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}

export function AdminOverviewPanel({
  employees,
  leaveRequests,
  mode = 'dashboard',
  isLeaveDataLoading,
  onOpenView,
}: {
  employees: Employee[];
  leaveRequests: AdminLeaveRequest[];
  mode?: 'dashboard' | 'reports';
  isLeaveDataLoading: boolean;
  onOpenView?: (view: AdminView) => void;
}) {
  const employeeStatusCounts = employees.reduce(
    (totals, employee) => {
      const status = employeeAccountStatus(employee);
      totals[status] += 1;
      return totals;
    },
    {
      active: 0,
      restricted: 0,
      banned: 0,
    }
  );

  const leaveStatusCounts = leaveRequests.reduce(
    (totals, request) => {
      totals[request.status] += 1;
      return totals;
    },
    {
      pending: 0,
      approved: 0,
      rejected: 0,
    }
  );

  const averageServiceYears = employees.length
    ? (
        employees.reduce((sum, employee) => sum + getServiceYears(employee.start_date), 0) /
        employees.length
      ).toFixed(1)
    : '0.0';

  const recentHires = employees.filter((employee) => {
    const startDate = new Date(employee.start_date);
    if (Number.isNaN(startDate.getTime())) {
      return false;
    }

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    return startDate >= ninetyDaysAgo;
  }).length;

  const positionCounts = Object.entries(
    employees.reduce<Record<string, number>>((totals, employee) => {
      const key = employee.position?.trim() || 'Unassigned';
      totals[key] = (totals[key] ?? 0) + 1;
      return totals;
    }, {})
  )
    .sort((left, right) => right[1] - left[1])
    .slice(0, 5)
    .map(([label, value]) => ({
      label,
      value,
    }));

  const reviewedLeaves = leaveStatusCounts.approved + leaveStatusCounts.rejected;
  const approvalRate = reviewedLeaves > 0 ? `${Math.round((leaveStatusCounts.approved / reviewedLeaves) * 100)}%` : '0%';

  const showQuickActions = mode === 'dashboard';

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title={mode === 'dashboard' ? 'Operations Dashboard' : 'Reports & Charts'}
          subtitle={
            mode === 'dashboard'
              ? 'Live workforce health, leave flow, and staffing coverage in one place.'
              : 'Detailed charts for account status, leave throughput, and team composition.'
          }
          right={
            showQuickActions && onOpenView ? (
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button variant="secondary" size="sm" onClick={() => onOpenView('employees')}>
                  Open Employees
                </Button>
                <Button variant="secondary" size="sm" onClick={() => onOpenView('leave-requests')}>
                  Review Leave
                </Button>
              </div>
            ) : null
          }
        />
        <CardBody>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricStat
              label="Total Employees"
              value={String(employees.length)}
              tone="sky"
              description="All employee accounts currently tracked by the admin workspace."
            />
            <MetricStat
              label="Pending Leaves"
              value={isLeaveDataLoading ? '...' : String(leaveStatusCounts.pending)}
              tone="amber"
              description="Leave filings that still need admin action."
            />
            <MetricStat
              label="Avg Service Years"
              value={averageServiceYears}
              tone="emerald"
              description="Average completed years of service across the current workforce."
            />
            <MetricStat
              label="Recent Hires"
              value={String(recentHires)}
              tone="violet"
              description="Employees who started within the last 90 days."
            />
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ProgressBars
          title="Employee Access Overview"
          subtitle="Distribution of active, restricted, and banned accounts."
          items={[
            {
              label: `Active (${formatPercent(employeeStatusCounts.active, employees.length)})`,
              value: employeeStatusCounts.active,
              toneClass: 'bg-emerald-400/90',
            },
            {
              label: `Restricted (${formatPercent(employeeStatusCounts.restricted, employees.length)})`,
              value: employeeStatusCounts.restricted,
              toneClass: 'bg-amber-400/90',
            },
            {
              label: `Banned (${formatPercent(employeeStatusCounts.banned, employees.length)})`,
              value: employeeStatusCounts.banned,
              toneClass: 'bg-rose-400/90',
            },
          ]}
        />

        <ProgressBars
          title="Leave Request Flow"
          subtitle={
            isLeaveDataLoading
              ? 'Loading leave analytics...'
              : 'Current pipeline split across pending, approved, and rejected requests.'
          }
          items={[
            {
              label: `Pending (${formatPercent(leaveStatusCounts.pending, leaveRequests.length)})`,
              value: leaveStatusCounts.pending,
              toneClass: 'bg-amber-400/90',
            },
            {
              label: `Approved (${formatPercent(leaveStatusCounts.approved, leaveRequests.length)})`,
              value: leaveStatusCounts.approved,
              toneClass: 'bg-emerald-400/90',
            },
            {
              label: `Rejected (${formatPercent(leaveStatusCounts.rejected, leaveRequests.length)})`,
              value: leaveStatusCounts.rejected,
              toneClass: 'bg-rose-400/90',
            },
          ]}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader
            title="Role Coverage"
            subtitle="Most common positions currently represented in the employee roster."
          />
          <CardBody>
            {positionCounts.length === 0 ? (
              <div className="rounded-xl bg-slate-900/80 px-4 py-5 text-sm text-slate-400 ring-1 ring-inset ring-slate-800">
                Position data will appear here once employee accounts include role assignments.
              </div>
            ) : (
              <div className="space-y-4">
                {positionCounts.map((entry) => (
                  <div key={entry.label}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-medium text-slate-200">{entry.label}</div>
                      <div className="text-sm text-slate-400">{entry.value}</div>
                    </div>
                    <div className="mt-2 h-2.5 rounded-full bg-slate-900/90 ring-1 ring-inset ring-slate-800">
                      <div
                        className="h-full rounded-full bg-sky-400/90"
                        style={{
                          width: `${Math.max(
                            12,
                            Math.round((entry.value / Math.max(1, positionCounts[0]?.value ?? 1)) * 100)
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title={mode === 'dashboard' ? 'Quick Signals' : 'Reporting Highlights'}
            subtitle={
              mode === 'dashboard'
                ? 'Fast operational cues for where admin attention is needed next.'
                : 'Top-level analytics summaries that are useful for reviews and planning.'
            }
          />
          <CardBody>
            <div className="space-y-4">
              <div className="rounded-2xl bg-slate-900/70 px-4 py-4 ring-1 ring-inset ring-slate-800">
                <div className="text-sm font-semibold text-slate-100">Attention Needed</div>
                <div className="mt-1 text-sm leading-6 text-slate-400">
                  {employeeStatusCounts.restricted + employeeStatusCounts.banned > 0
                    ? `${employeeStatusCounts.restricted + employeeStatusCounts.banned} account(s) currently have access issues to review.`
                    : 'All employee accounts are currently in a healthy access state.'}
                </div>
              </div>
              <div className="rounded-2xl bg-slate-900/70 px-4 py-4 ring-1 ring-inset ring-slate-800">
                <div className="text-sm font-semibold text-slate-100">Leave Approval Rate</div>
                <div className="mt-1 text-sm leading-6 text-slate-400">
                  {isLeaveDataLoading
                    ? 'Leave analytics are still loading.'
                    : `${approvalRate} of reviewed leave requests have been approved so far.`}
                </div>
              </div>
              <div className="rounded-2xl bg-slate-900/70 px-4 py-4 ring-1 ring-inset ring-slate-800">
                <div className="text-sm font-semibold text-slate-100">Workforce Growth</div>
                <div className="mt-1 text-sm leading-6 text-slate-400">
                  {recentHires > 0
                    ? `${recentHires} employee(s) joined in the last 90 days, which may impact onboarding and leave planning.`
                    : 'No recent hires in the last 90 days.'}
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
