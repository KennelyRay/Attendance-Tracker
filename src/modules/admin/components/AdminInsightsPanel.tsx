'use client';

import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import {
  employeeAccountStatus,
  type AdminViolationRecord,
  type Employee,
} from '@/modules/admin/types';
import type { AdminView } from '@/modules/admin/components/AdminSidebar';
import type { AdminLeaveRequest } from '@/modules/leave/types';

type InsightPriority = 'critical' | 'high' | 'medium' | 'healthy';

type FocusInsight = {
  title: string;
  summary: string;
  detail: string;
  priority: InsightPriority;
  actionLabel: string;
  actionView: AdminView;
};

function formatRelativeDays(dateString: string) {
  const parsed = new Date(dateString);
  if (Number.isNaN(parsed.getTime())) {
    return 'Unknown age';
  }

  const elapsedMs = Date.now() - parsed.getTime();
  const days = Math.max(0, Math.floor(elapsedMs / (1000 * 60 * 60 * 24)));
  return days === 0 ? 'Today' : `${days} day${days === 1 ? '' : 's'} ago`;
}

function getPriorityBadge(priority: InsightPriority) {
  switch (priority) {
    case 'critical':
      return {
        label: 'Critical',
        className: 'bg-rose-500/12 text-rose-300 ring-1 ring-inset ring-rose-400/20',
      };
    case 'high':
      return {
        label: 'High',
        className: 'bg-amber-500/12 text-amber-300 ring-1 ring-inset ring-amber-400/20',
      };
    case 'medium':
      return {
        label: 'Medium',
        className: 'bg-sky-500/12 text-sky-300 ring-1 ring-inset ring-sky-400/20',
      };
    default:
      return {
        label: 'Healthy',
        className: 'bg-emerald-500/12 text-emerald-300 ring-1 ring-inset ring-emerald-400/20',
      };
  }
}

export function AdminInsightsPanel({
  employees,
  leaveRequests,
  violations,
  isLeaveDataLoading,
  isViolationDataLoading,
  onOpenView,
}: {
  employees: Employee[];
  leaveRequests: AdminLeaveRequest[];
  violations: AdminViolationRecord[];
  isLeaveDataLoading: boolean;
  isViolationDataLoading: boolean;
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

  const pendingLeaves = leaveRequests
    .filter((request) => request.status === 'pending')
    .sort(
      (left, right) =>
        new Date(left.created_at).getTime() - new Date(right.created_at).getTime()
    );
  const reviewedLeaves = leaveRequests.filter((request) => request.status !== 'pending');
  const approvedLeaves = reviewedLeaves.filter((request) => request.status === 'approved');
  const deniedLeaves = reviewedLeaves.filter((request) => request.status === 'rejected');

  const unresolvedViolations = violations.filter((violation) => violation.case_status !== 'resolved');
  const highSeverityViolations = violations.filter((violation) => violation.severity === 'high');

  const companyRisk = Object.values(
    employees.reduce<
      Record<
        string,
        {
          company: string;
          employees: number;
          pendingLeaves: number;
          unresolvedViolations: number;
          restrictedAccounts: number;
          highSeverityViolations: number;
        }
      >
    >((totals, employee) => {
      const company = employee.company?.trim() || 'Unassigned';
      const current = totals[company] ?? {
        company,
        employees: 0,
        pendingLeaves: 0,
        unresolvedViolations: 0,
        restrictedAccounts: 0,
        highSeverityViolations: 0,
      };

      current.employees += 1;
      if (employeeAccountStatus(employee) !== 'active') {
        current.restrictedAccounts += 1;
      }

      totals[company] = current;
      return totals;
    }, {})
  );

  for (const request of pendingLeaves) {
    const company = request.user_company?.trim() || 'Unassigned';
    const existing = companyRisk.find((entry) => entry.company === company);
    if (existing) {
      existing.pendingLeaves += 1;
    } else {
      companyRisk.push({
        company,
        employees: 0,
        pendingLeaves: 1,
        unresolvedViolations: 0,
        restrictedAccounts: 0,
        highSeverityViolations: 0,
      });
    }
  }

  for (const violation of violations) {
    const company = violation.company?.trim() || 'Unassigned';
    const existing = companyRisk.find((entry) => entry.company === company);
    if (existing) {
      if (violation.case_status !== 'resolved') {
        existing.unresolvedViolations += 1;
      }
      if (violation.severity === 'high') {
        existing.highSeverityViolations += 1;
      }
    } else {
      companyRisk.push({
        company,
        employees: 0,
        pendingLeaves: 0,
        unresolvedViolations: violation.case_status !== 'resolved' ? 1 : 0,
        restrictedAccounts: 0,
        highSeverityViolations: violation.severity === 'high' ? 1 : 0,
      });
    }
  }

  const rankedCompanyRisk = companyRisk
    .map((company) => ({
      ...company,
      score:
        company.pendingLeaves * 2 +
        company.unresolvedViolations * 2 +
        company.highSeverityViolations * 3 +
        company.restrictedAccounts * 2,
    }))
    .sort((left, right) => right.score - left.score)
    .slice(0, 5);

  const employeeViolationWatchlist = Object.values(
    violations.reduce<
      Record<
        number,
        {
          userId: number;
          userName: string;
          company: string;
          position: string;
          unresolved: number;
          high: number;
          total: number;
        }
      >
    >((totals, violation) => {
      const entry = totals[violation.user_id] ?? {
        userId: violation.user_id,
        userName: violation.user_name,
        company: violation.company?.trim() || 'Unassigned',
        position: violation.user_position?.trim() || 'Unassigned',
        unresolved: 0,
        high: 0,
        total: 0,
      };

      entry.total += 1;
      if (violation.case_status !== 'resolved') {
        entry.unresolved += 1;
      }
      if (violation.severity === 'high') {
        entry.high += 1;
      }

      totals[violation.user_id] = entry;
      return totals;
    }, {})
  )
    .sort((left, right) => {
      const leftScore = left.high * 3 + left.unresolved * 2 + left.total;
      const rightScore = right.high * 3 + right.unresolved * 2 + right.total;
      return rightScore - leftScore;
    })
    .slice(0, 5);

  const restrictedEmployees = employees
    .filter((employee) => employeeAccountStatus(employee) !== 'active')
    .sort((left, right) => left.name.localeCompare(right.name))
    .slice(0, 5);

  const oldestPendingLeave = pendingLeaves[0];
  const approvalRate = reviewedLeaves.length
    ? Math.round((approvedLeaves.length / reviewedLeaves.length) * 100)
    : 0;

  const topPosition = Object.entries(
    employees.reduce<Record<string, number>>((totals, employee) => {
      const key = employee.position?.trim() || 'Unassigned';
      totals[key] = (totals[key] ?? 0) + 1;
      return totals;
    }, {})
  ).sort((left, right) => right[1] - left[1])[0];

  const focusInsights: FocusInsight[] = [
    {
      title: 'Clear The Leave Queue',
      summary: isLeaveDataLoading
        ? 'Leave insights are still loading.'
        : pendingLeaves.length > 0
          ? `${pendingLeaves.length} request(s) are still pending review.`
          : 'No leave requests are currently waiting.',
      detail: isLeaveDataLoading
        ? 'Once the queue loads, this card will point to the oldest and riskiest pending leave item.'
        : oldestPendingLeave
          ? `${oldestPendingLeave.user_name} from ${oldestPendingLeave.user_company || 'Unassigned'} filed ${formatRelativeDays(oldestPendingLeave.created_at)} for ${oldestPendingLeave.total_days} day(s).`
          : 'The leave queue is clear, so no follow-up is needed right now.',
      priority: pendingLeaves.length >= 5 ? 'critical' : pendingLeaves.length > 0 ? 'high' : 'healthy',
      actionLabel: 'Open Leave Requests',
      actionView: 'leave-requests',
    },
    {
      title: 'Review Discipline Risk',
      summary: isViolationDataLoading
        ? 'Violation insights are still loading.'
        : unresolvedViolations.length > 0
          ? `${unresolvedViolations.length} active violation case(s) still need follow-up.`
          : 'No active violation cases are open.',
      detail: isViolationDataLoading
        ? 'This area will highlight the employees and companies carrying the highest discipline pressure.'
        : highSeverityViolations.length > 0
          ? `${highSeverityViolations.length} high-severity case(s) exist, and ${employeeViolationWatchlist[0]?.userName || 'the current top employee'} is the highest-priority watchlist item.`
          : 'Current violation activity is low risk, with no high-severity case driving immediate escalation.',
      priority:
        highSeverityViolations.length >= 2
          ? 'critical'
          : unresolvedViolations.length > 0
            ? 'high'
            : 'healthy',
      actionLabel: 'Open Violation Cases',
      actionView: 'all-violation-cases',
    },
    {
      title: 'Resolve Access Restrictions',
      summary:
        employeeStatusCounts.restricted + employeeStatusCounts.banned > 0
          ? `${employeeStatusCounts.restricted + employeeStatusCounts.banned} account(s) are restricted or banned.`
          : 'All employee accounts are currently active.',
      detail:
        employeeStatusCounts.restricted + employeeStatusCounts.banned > 0
          ? `${employeeStatusCounts.restricted} restricted and ${employeeStatusCounts.banned} banned account(s) may require HR or operations follow-up.`
          : 'There are no access blockers affecting staff logins right now.',
      priority:
        employeeStatusCounts.banned > 0
          ? 'high'
          : employeeStatusCounts.restricted > 0
            ? 'medium'
            : 'healthy',
      actionLabel: 'Open Employee Accounts',
      actionView: 'employee-accounts',
    },
    {
      title: 'Check Staffing Concentration',
      summary: topPosition
        ? `${topPosition[0]} is your most concentrated role with ${topPosition[1]} staff member(s).`
        : 'Role coverage data is limited until more positions are assigned.',
      detail: topPosition
        ? `Use this to balance schedules and leave approvals, especially if that role also overlaps with a busy company or pending leave hotspot.`
        : 'Position-based staffing signals will improve once employee roles are fully assigned.',
      priority: topPosition && topPosition[1] >= 5 ? 'medium' : 'healthy',
      actionLabel: 'Open Reports & Charts',
      actionView: 'reports-charts',
    },
  ];

  const nextBestAction =
    focusInsights.find((insight) => insight.priority === 'critical') ||
    focusInsights.find((insight) => insight.priority === 'high') ||
    focusInsights[0];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Smart Insights"
          subtitle="Actionable priorities generated from the current leave queue, account status, and discipline data."
        />
        <CardBody>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-2xl border border-sky-400/15 bg-sky-500/8 px-5 py-5 ring-1 ring-inset ring-sky-400/10">
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-300">
                Next Best Action
              </div>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="text-xl font-semibold text-slate-50">{nextBestAction.title}</div>
                  <div className="mt-2 text-sm leading-6 text-slate-300">{nextBestAction.summary}</div>
                  <div className="mt-2 text-sm leading-6 text-slate-400">{nextBestAction.detail}</div>
                </div>
                <span
                  className={[
                    'inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide',
                    getPriorityBadge(nextBestAction.priority).className,
                  ].join(' ')}
                >
                  {getPriorityBadge(nextBestAction.priority).label}
                </span>
              </div>
              {onOpenView ? (
                <div className="mt-5">
                  <Button onClick={() => onOpenView(nextBestAction.actionView)}>
                    {nextBestAction.actionLabel}
                  </Button>
                </div>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-slate-900/75 px-4 py-4 ring-1 ring-inset ring-slate-800">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Pending Leave
                </div>
                <div className="mt-2 text-2xl font-semibold text-slate-50">
                  {isLeaveDataLoading ? '...' : pendingLeaves.length}
                </div>
                <div className="mt-1 text-sm text-slate-400">
                  {oldestPendingLeave
                    ? `Oldest filed ${formatRelativeDays(oldestPendingLeave.created_at)}`
                    : 'Queue is clear'}
                </div>
              </div>
              <div className="rounded-2xl bg-slate-900/75 px-4 py-4 ring-1 ring-inset ring-slate-800">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Approval Rate
                </div>
                <div className="mt-2 text-2xl font-semibold text-slate-50">
                  {isLeaveDataLoading ? '...' : `${approvalRate}%`}
                </div>
                <div className="mt-1 text-sm text-slate-400">
                  {reviewedLeaves.length} reviewed requests
                </div>
              </div>
              <div className="rounded-2xl bg-slate-900/75 px-4 py-4 ring-1 ring-inset ring-slate-800">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Active Cases
                </div>
                <div className="mt-2 text-2xl font-semibold text-slate-50">
                  {isViolationDataLoading ? '...' : unresolvedViolations.length}
                </div>
                <div className="mt-1 text-sm text-slate-400">
                  {isViolationDataLoading ? 'Loading...' : `${highSeverityViolations.length} high severity`}
                </div>
              </div>
              <div className="rounded-2xl bg-slate-900/75 px-4 py-4 ring-1 ring-inset ring-slate-800">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Access Issues
                </div>
                <div className="mt-2 text-2xl font-semibold text-slate-50">
                  {employeeStatusCounts.restricted + employeeStatusCounts.banned}
                </div>
                <div className="mt-1 text-sm text-slate-400">
                  {employeeStatusCounts.banned} banned, {employeeStatusCounts.restricted} restricted
                </div>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader
            title="Priority Board"
            subtitle="What needs attention first, based on current admin workload and risk."
          />
          <CardBody>
            <div className="space-y-4">
              {focusInsights.map((insight) => {
                const badge = getPriorityBadge(insight.priority);
                return (
                  <div
                    key={insight.title}
                    className="rounded-2xl border border-slate-800/80 bg-slate-900/60 px-5 py-5 ring-1 ring-inset ring-white/5"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="text-base font-semibold text-slate-50">{insight.title}</div>
                        <div className="mt-2 text-sm leading-6 text-slate-300">{insight.summary}</div>
                        <div className="mt-2 text-sm leading-6 text-slate-400">{insight.detail}</div>
                      </div>
                      <span
                        className={[
                          'inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide',
                          badge.className,
                        ].join(' ')}
                      >
                        {badge.label}
                      </span>
                    </div>
                    {onOpenView ? (
                      <div className="mt-4">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => onOpenView(insight.actionView)}
                        >
                          {insight.actionLabel}
                        </Button>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Hotspots"
            subtitle="Which companies and employees are driving the most operational pressure."
          />
          <CardBody>
            <div className="space-y-5">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Company Risk
                </div>
                {rankedCompanyRisk.length === 0 ? (
                  <div className="mt-3 rounded-xl bg-slate-900/80 px-4 py-4 text-sm text-slate-400 ring-1 ring-inset ring-slate-800">
                    Company hotspots will appear once leave and violation activity is available.
                  </div>
                ) : (
                  <div className="mt-3 space-y-3">
                    {rankedCompanyRisk.map((company) => (
                      <div
                        key={company.company}
                        className="rounded-2xl bg-slate-900/70 px-4 py-4 ring-1 ring-inset ring-slate-800"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-sm font-semibold text-slate-100">{company.company}</div>
                          <div className="text-sm font-semibold text-slate-300">
                            Risk Score {company.score}
                          </div>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-slate-400 sm:grid-cols-4">
                          <div className="rounded-xl bg-slate-950/70 px-3 py-2.5 ring-1 ring-inset ring-slate-800">
                            {company.pendingLeaves} pending leaves
                          </div>
                          <div className="rounded-xl bg-slate-950/70 px-3 py-2.5 ring-1 ring-inset ring-slate-800">
                            {company.unresolvedViolations} active cases
                          </div>
                          <div className="rounded-xl bg-slate-950/70 px-3 py-2.5 ring-1 ring-inset ring-slate-800">
                            {company.highSeverityViolations} high severity
                          </div>
                          <div className="rounded-xl bg-slate-950/70 px-3 py-2.5 ring-1 ring-inset ring-slate-800">
                            {company.restrictedAccounts} access issues
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Employee Watchlist
                </div>
                {employeeViolationWatchlist.length === 0 ? (
                  <div className="mt-3 rounded-xl bg-slate-900/80 px-4 py-4 text-sm text-slate-400 ring-1 ring-inset ring-slate-800">
                    No employee currently stands out as a discipline risk hotspot.
                  </div>
                ) : (
                  <div className="mt-3 space-y-3">
                    {employeeViolationWatchlist.map((employee) => (
                      <div
                        key={employee.userId}
                        className="rounded-2xl bg-slate-900/70 px-4 py-4 ring-1 ring-inset ring-slate-800"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-slate-100">
                              {employee.userName}
                            </div>
                            <div className="mt-1 text-xs text-slate-500">
                              {employee.company} · {employee.position}
                            </div>
                          </div>
                          <div className="rounded-full bg-rose-500/10 px-2.5 py-1 text-[11px] font-semibold text-rose-300 ring-1 ring-inset ring-rose-400/20">
                            {employee.total} case{employee.total === 1 ? '' : 's'}
                          </div>
                        </div>
                        <div className="mt-3 grid grid-cols-3 gap-3 text-center">
                          <div className="rounded-xl bg-slate-950/70 px-3 py-2.5 ring-1 ring-inset ring-slate-800">
                            <div className="text-lg font-semibold text-slate-50">{employee.total}</div>
                            <div className="text-[11px] uppercase tracking-wide text-slate-500">
                              Total
                            </div>
                          </div>
                          <div className="rounded-xl bg-slate-950/70 px-3 py-2.5 ring-1 ring-inset ring-slate-800">
                            <div className="text-lg font-semibold text-amber-300">
                              {employee.unresolved}
                            </div>
                            <div className="text-[11px] uppercase tracking-wide text-slate-500">
                              Active
                            </div>
                          </div>
                          <div className="rounded-xl bg-slate-950/70 px-3 py-2.5 ring-1 ring-inset ring-slate-800">
                            <div className="text-lg font-semibold text-rose-300">{employee.high}</div>
                            <div className="text-[11px] uppercase tracking-wide text-slate-500">
                              High
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader
            title="Leave Decision Guidance"
            subtitle="Quick interpretation of how the leave workflow is behaving right now."
          />
          <CardBody>
            <div className="space-y-4">
              <div className="rounded-2xl bg-slate-900/70 px-4 py-4 ring-1 ring-inset ring-slate-800">
                <div className="text-sm font-semibold text-slate-100">Decision Posture</div>
                <div className="mt-2 text-sm leading-6 text-slate-400">
                  {isLeaveDataLoading
                    ? 'Leave review analytics are still loading.'
                    : reviewedLeaves.length > 0
                      ? `${approvedLeaves.length} approved and ${deniedLeaves.length} rejected out of ${reviewedLeaves.length} reviewed request(s).`
                      : 'No reviewed leave requests yet, so the approval trend will build over time.'}
                </div>
              </div>
              <div className="rounded-2xl bg-slate-900/70 px-4 py-4 ring-1 ring-inset ring-slate-800">
                <div className="text-sm font-semibold text-slate-100">Queue Risk</div>
                <div className="mt-2 text-sm leading-6 text-slate-400">
                  {isLeaveDataLoading
                    ? 'Queue timing insight is loading.'
                    : oldestPendingLeave
                      ? `${oldestPendingLeave.user_name}'s request is the oldest pending item and was filed ${formatRelativeDays(oldestPendingLeave.created_at)}.`
                      : 'There is no backlog in the leave queue right now.'}
                </div>
              </div>
              <div className="rounded-2xl bg-slate-900/70 px-4 py-4 ring-1 ring-inset ring-slate-800">
                <div className="text-sm font-semibold text-slate-100">Recommended Move</div>
                <div className="mt-2 text-sm leading-6 text-slate-400">
                  {pendingLeaves.length > 0
                    ? 'Prioritize the oldest pending leave request first, then review any filings from hotspot companies with active violations or access issues.'
                    : 'Use this time to review trend quality in Reports & Charts and clean up any unresolved employee access issues.'}
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Account Follow-Up"
            subtitle="People or access states that likely need manual admin attention."
          />
          <CardBody>
            {restrictedEmployees.length === 0 ? (
              <div className="rounded-2xl bg-slate-900/70 px-4 py-5 text-sm text-slate-400 ring-1 ring-inset ring-slate-800">
                No employee accounts are currently restricted or banned.
              </div>
            ) : (
              <div className="space-y-3">
                {restrictedEmployees.map((employee) => {
                  const status = employeeAccountStatus(employee);
                  return (
                    <div
                      key={employee.id}
                      className="rounded-2xl bg-slate-900/70 px-4 py-4 ring-1 ring-inset ring-slate-800"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-slate-100">{employee.name}</div>
                          <div className="mt-1 text-xs text-slate-500">
                            {employee.company || 'Unassigned'} · {employee.position || 'Unassigned'}
                          </div>
                        </div>
                        <span
                          className={[
                            'inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide',
                            status === 'banned'
                              ? 'bg-rose-500/12 text-rose-300 ring-1 ring-inset ring-rose-400/20'
                              : 'bg-amber-500/12 text-amber-300 ring-1 ring-inset ring-amber-400/20',
                          ].join(' ')}
                        >
                          {status}
                        </span>
                      </div>
                      <div className="mt-2 text-sm leading-6 text-slate-400">
                        {status === 'banned'
                          ? 'This account is permanently blocked until restored by an admin.'
                          : employee.restricted_until
                            ? `Restriction currently lasts until ${new Date(employee.restricted_until).toLocaleString()}.`
                            : 'Restriction is active.'}
                      </div>
                    </div>
                  );
                })}
                {onOpenView ? (
                  <div className="pt-1">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onOpenView('employee-accounts')}
                    >
                      Open Employee Accounts
                    </Button>
                  </div>
                ) : null}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
