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

function formatLabel(value: string) {
  return value
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function getEmployeeCompany(employee: Pick<Employee, 'company'>) {
  return employee.company?.trim() || 'Unassigned';
}

function getEmployeePosition(employee: Pick<Employee, 'position'>) {
  return employee.position?.trim() || 'Unassigned';
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

function PieChartCard({
  title,
  subtitle,
  items,
}: {
  title: string;
  subtitle: string;
  items: Array<{ label: string; value: number; color: string; chipClass: string }>;
}) {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  const gradient = total
    ? (() => {
        let current = 0;
        return items
          .filter((item) => item.value > 0)
          .map((item) => {
            const start = current;
            current += (item.value / total) * 100;
            return `${item.color} ${start}% ${current}%`;
          })
          .join(', ');
      })()
    : 'rgba(15, 23, 42, 0.9) 0% 100%';

  return (
    <Card>
      <CardHeader title={title} subtitle={subtitle} />
      <CardBody>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-center">
          <div className="mx-auto">
            <div
              className="relative h-44 w-44 rounded-full ring-1 ring-inset ring-slate-800"
              style={{ background: `conic-gradient(${gradient})` }}
            >
              <div className="absolute inset-6 flex items-center justify-center rounded-full bg-slate-950/95 ring-1 ring-inset ring-slate-800">
                <div className="text-center">
                  <div className="text-3xl font-semibold text-slate-50">{total}</div>
                  <div className="mt-1 text-xs uppercase tracking-[0.22em] text-slate-400">
                    Total
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between gap-3 rounded-2xl bg-slate-900/70 px-4 py-3 ring-1 ring-inset ring-slate-800"
              >
                <div className="flex items-center gap-3">
                  <span className={`h-3 w-3 rounded-full ${item.chipClass}`} />
                  <div>
                    <div className="text-sm font-medium text-slate-100">{item.label}</div>
                    <div className="text-xs text-slate-400">
                      {formatPercent(item.value, total)} of tracked items
                    </div>
                  </div>
                </div>
                <div className="text-sm font-semibold text-slate-200">{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

function VerticalBarChart({
  title,
  subtitle,
  items,
}: {
  title: string;
  subtitle: string;
  items: Array<{ label: string; value: number; colorClass: string; detail: string }>;
}) {
  const max = Math.max(1, ...items.map((item) => item.value));

  return (
    <Card>
      <CardHeader title={title} subtitle={subtitle} />
      <CardBody>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
          {items.map((item) => (
            <div
              key={item.label}
              className="rounded-2xl bg-slate-900/70 px-3 py-4 ring-1 ring-inset ring-slate-800"
            >
              <div className="flex h-40 items-end justify-center">
                <div
                  className={`w-full max-w-[72px] rounded-t-2xl ${item.colorClass}`}
                  style={{
                    height: `${Math.max(12, Math.round((item.value / max) * 100))}%`,
                  }}
                />
              </div>
              <div className="mt-4 text-center text-2xl font-semibold text-slate-50">
                {item.value}
              </div>
              <div className="mt-1 text-center text-sm font-medium text-slate-200">
                {item.label}
              </div>
              <div className="mt-1 text-center text-xs leading-5 text-slate-400">
                {item.detail}
              </div>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}

function RankedBars({
  title,
  subtitle,
  items,
}: {
  title: string;
  subtitle: string;
  items: Array<{ label: string; value: number; toneClass: string; detail?: string }>;
}) {
  const max = Math.max(1, ...items.map((item) => item.value));

  return (
    <Card>
      <CardHeader title={title} subtitle={subtitle} />
      <CardBody>
        {items.length === 0 ? (
          <div className="rounded-xl bg-slate-900/80 px-4 py-5 text-sm text-slate-400 ring-1 ring-inset ring-slate-800">
            No tracked items yet for this chart.
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-slate-200">{item.label}</div>
                    {item.detail ? (
                      <div className="text-xs text-slate-500">{item.detail}</div>
                    ) : null}
                  </div>
                  <div className="text-sm font-semibold text-slate-300">{item.value}</div>
                </div>
                <div className="mt-2 h-2.5 rounded-full bg-slate-900/90 ring-1 ring-inset ring-slate-800">
                  <div
                    className={`h-full rounded-full ${item.toneClass}`}
                    style={{
                      width: `${Math.max(12, Math.round((item.value / max) * 100))}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}

export function AdminOverviewPanel({
  employees,
  leaveRequests,
  violations,
  mode = 'dashboard',
  isLeaveDataLoading,
  isViolationDataLoading,
  onOpenView,
}: {
  employees: Employee[];
  leaveRequests: AdminLeaveRequest[];
  violations: AdminViolationRecord[];
  mode?: 'dashboard' | 'reports';
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

  const employeeCompanyLookup = new Map(
    employees.map((employee) => [employee.id, getEmployeeCompany(employee)])
  );
  const employeeDirectory = new Map(
    employees.map((employee) => [
      employee.id,
      {
        name: employee.name,
        company: getEmployeeCompany(employee),
        position: getEmployeePosition(employee),
      },
    ])
  );

  const companyCounts = Object.entries(
    employees.reduce<Record<string, number>>((totals, employee) => {
      const key = getEmployeeCompany(employee);
      totals[key] = (totals[key] ?? 0) + 1;
      return totals;
    }, {})
  )
    .sort((left, right) => right[1] - left[1])
    .slice(0, 5)
    .map(([label, value]) => ({
      label,
      value,
      toneClass: 'bg-cyan-400/90',
      detail: `${formatPercent(value, employees.length)} of workforce`,
    }));

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
      toneClass: 'bg-sky-400/90',
      detail: `${formatPercent(value, employees.length)} of workforce`,
    }));

  const violationSeverityCounts = violations.reduce(
    (totals, violation) => {
      totals[violation.severity] += 1;
      return totals;
    },
    {
      low: 0,
      medium: 0,
      high: 0,
    }
  );

  const violationStatusCounts = violations.reduce(
    (totals, violation) => {
      totals[violation.case_status] += 1;
      return totals;
    },
    {
      open: 0,
      'under-review': 0,
      resolved: 0,
    }
  );

  const openViolationCount = violationStatusCounts.open + violationStatusCounts['under-review'];
  const severeViolationCount = violationSeverityCounts.high;

  const leaveTypeDemand = Object.entries(
    leaveRequests.reduce<Record<string, number>>((totals, request) => {
      totals[request.leave_type] = (totals[request.leave_type] ?? 0) + 1;
      return totals;
    }, {})
  )
    .sort((left, right) => right[1] - left[1])
    .slice(0, 5)
    .map(([label, value]) => ({
      label: formatLabel(label),
      value,
      toneClass: 'bg-cyan-400/90',
      detail: `${formatPercent(value, leaveRequests.length)} of leave filings`,
    }));

  const companyOperations = Object.entries(
    leaveRequests.reduce<
      Record<string, { employees: number; pendingLeaves: number; openViolations: number }>
    >((totals, request) => {
      const key = employeeCompanyLookup.get(request.user_id) || 'Unassigned';
      const entry = totals[key] ?? { employees: 0, pendingLeaves: 0, openViolations: 0 };
      if (request.status === 'pending') {
        entry.pendingLeaves += 1;
      }
      totals[key] = entry;
      return totals;
    }, {})
  )
    .map(([company, counts]) => ({
      company,
      ...counts,
    }));

  for (const violation of violations) {
    const company =
      employeeCompanyLookup.get(violation.user_id) || violation.company?.trim() || 'Unassigned';
    const existing = companyOperations.find((entry) => entry.company === company);
    if (existing) {
      if (violation.case_status !== 'resolved') {
        existing.openViolations += 1;
      }
    } else {
      companyOperations.push({
        company,
        employees: 0,
        pendingLeaves: 0,
        openViolations: violation.case_status === 'resolved' ? 0 : 1,
      });
    }
  }

  for (const employee of employees) {
    const company = getEmployeeCompany(employee);
    const existing = companyOperations.find((entry) => entry.company === company);
    if (existing) {
      existing.employees += 1;
    } else {
      companyOperations.push({
        company,
        employees: 1,
        pendingLeaves: 0,
        openViolations: 0,
      });
    }
  }

  const topCompanyOperations = companyOperations
    .sort((left, right) => {
      const leftScore = left.pendingLeaves + left.openViolations + left.employees;
      const rightScore = right.pendingLeaves + right.openViolations + right.employees;
      return rightScore - leftScore;
    })
    .slice(0, 4);

  const reviewedLeaves = leaveStatusCounts.approved + leaveStatusCounts.rejected;
  const approvalRate =
    reviewedLeaves > 0
      ? `${Math.round((leaveStatusCounts.approved / reviewedLeaves) * 100)}%`
      : '0%';

  const violationEmployeeStats = Object.values(
    violations.reduce<
      Record<
        number,
        {
          userId: number;
          name: string;
          company: string;
          position: string;
          total: number;
          high: number;
          open: number;
        }
      >
    >((totals, violation) => {
      const employeeProfile = employeeDirectory.get(violation.user_id);
      const entry = totals[violation.user_id] ?? {
        userId: violation.user_id,
        name: violation.user_name || employeeProfile?.name || `Employee #${violation.user_id}`,
        company: employeeProfile?.company || violation.company?.trim() || 'Unassigned',
        position: employeeProfile?.position || violation.user_position?.trim() || 'Unassigned',
        total: 0,
        high: 0,
        open: 0,
      };

      entry.total += 1;
      if (violation.severity === 'high') {
        entry.high += 1;
      }
      if (violation.case_status !== 'resolved') {
        entry.open += 1;
      }

      totals[violation.user_id] = entry;
      return totals;
    }, {})
  ).sort((left, right) => {
    const leftScore = left.high * 3 + left.open * 2 + left.total;
    const rightScore = right.high * 3 + right.open * 2 + right.total;
    return rightScore - leftScore;
  });

  const topViolationEmployees = violationEmployeeStats.slice(0, 5).map((employee) => ({
    label: employee.name,
    value: employee.total,
    toneClass: 'bg-rose-400/90',
    detail: `${employee.company} · ${employee.position} · ${employee.high} high · ${employee.open} active`,
  }));

  const terminationReviewCandidates = violationEmployeeStats
    .filter(
      (employee) =>
        employee.high >= 2 || employee.total >= 4 || (employee.total >= 3 && employee.open >= 2)
    )
    .slice(0, 5);

  const companyViolationStats = Object.values(
    employees.reduce<
      Record<
        string,
        { company: string; employees: number; total: number; high: number; open: number }
      >
    >((totals, employee) => {
      const company = getEmployeeCompany(employee);
      const entry = totals[company] ?? {
        company,
        employees: 0,
        total: 0,
        high: 0,
        open: 0,
      };
      entry.employees += 1;
      totals[company] = entry;
      return totals;
    }, {})
  );

  for (const violation of violations) {
    const company =
      employeeDirectory.get(violation.user_id)?.company || violation.company?.trim() || 'Unassigned';
    const existing = companyViolationStats.find((entry) => entry.company === company);
    if (existing) {
      existing.total += 1;
      if (violation.severity === 'high') {
        existing.high += 1;
      }
      if (violation.case_status !== 'resolved') {
        existing.open += 1;
      }
    } else {
      companyViolationStats.push({
        company,
        employees: 0,
        total: 1,
        high: violation.severity === 'high' ? 1 : 0,
        open: violation.case_status !== 'resolved' ? 1 : 0,
      });
    }
  }

  const companyViolationRanking = [...companyViolationStats]
    .filter((company) => company.total > 0)
    .sort((left, right) => {
      const leftScore = left.high * 3 + left.open * 2 + left.total;
      const rightScore = right.high * 3 + right.open * 2 + right.total;
      return rightScore - leftScore;
    })
    .slice(0, 5)
    .map((company) => ({
      label: company.company,
      value: company.total,
      toneClass: 'bg-fuchsia-400/90',
      detail: `${company.open} active · ${company.high} high severity · ${company.employees} staff`,
    }));

  const mostViolationsCompany = [...companyViolationStats].sort((left, right) => {
    if (right.total !== left.total) {
      return right.total - left.total;
    }
    return right.open - left.open;
  })[0];

  const leastViolationsCompany = [...companyViolationStats].sort((left, right) => {
    if (left.total !== right.total) {
      return left.total - right.total;
    }
    return right.employees - left.employees;
  })[0];

  const cleanCompanyCount = companyViolationStats.filter((company) => company.total === 0).length;

  const rolePressure = Object.entries(
    violations.reduce<Record<string, { total: number; high: number; open: number }>>(
      (totals, violation) => {
        const role =
          employeeDirectory.get(violation.user_id)?.position ||
          violation.user_position?.trim() ||
          'Unassigned';
        const entry = totals[role] ?? { total: 0, high: 0, open: 0 };
        entry.total += 1;
        if (violation.severity === 'high') {
          entry.high += 1;
        }
        if (violation.case_status !== 'resolved') {
          entry.open += 1;
        }
        totals[role] = entry;
        return totals;
      },
      {}
    )
  )
    .sort((left, right) => {
      const leftScore = left[1].high * 3 + left[1].open * 2 + left[1].total;
      const rightScore = right[1].high * 3 + right[1].open * 2 + right[1].total;
      return rightScore - leftScore;
    })
    .slice(0, 5)
    .map(([label, counts]) => ({
      label,
      value: counts.total,
      toneClass: 'bg-amber-400/90',
      detail: `${counts.open} active · ${counts.high} high severity`,
    }));

  const staffingDistribution = positionCounts.slice(0, 5).map((position, index) => ({
    label: position.label,
    value: position.value,
    colorClass:
      index % 5 === 0
        ? 'bg-sky-400/90'
        : index % 5 === 1
          ? 'bg-cyan-400/90'
          : index % 5 === 2
            ? 'bg-violet-400/90'
            : index % 5 === 3
              ? 'bg-emerald-400/90'
              : 'bg-amber-400/90',
    detail: position.detail || `${position.value} staff member(s)`,
  }));


  const operationsBars = [
    {
      label: 'Pending Leave',
      value: leaveStatusCounts.pending,
      colorClass: 'bg-amber-400/90',
      detail: formatPercent(leaveStatusCounts.pending, leaveRequests.length),
    },
    {
      label: 'Approved Leave',
      value: leaveStatusCounts.approved,
      colorClass: 'bg-emerald-400/90',
      detail: formatPercent(leaveStatusCounts.approved, leaveRequests.length),
    },
    {
      label: 'Rejected Leave',
      value: leaveStatusCounts.rejected,
      colorClass: 'bg-rose-400/90',
      detail: formatPercent(leaveStatusCounts.rejected, leaveRequests.length),
    },
    {
      label: 'Open Cases',
      value: violationStatusCounts.open,
      colorClass: 'bg-fuchsia-400/90',
      detail: formatPercent(violationStatusCounts.open, violations.length),
    },
    {
      label: 'Under Review',
      value: violationStatusCounts['under-review'],
      colorClass: 'bg-violet-400/90',
      detail: formatPercent(violationStatusCounts['under-review'], violations.length),
    },
    {
      label: 'Resolved',
      value: violationStatusCounts.resolved,
      colorClass: 'bg-sky-400/90',
      detail: formatPercent(violationStatusCounts.resolved, violations.length),
    },
  ];
  const showQuickActions = mode === 'dashboard';

  if (mode === 'reports') {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader
            title="Reports & Charts"
            subtitle="Operational reporting for discipline risk, company exposure, and staffing pressure."
            right={
              onOpenView ? (
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button variant="secondary" size="sm" onClick={() => onOpenView('all-violation-cases')}>
                    Open Violation Cases
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => onOpenView('employee-accounts')}>
                    Open Employee Accounts
                  </Button>
                </div>
              ) : null
            }
          />
          <CardBody>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricStat
                label="Violation Cases"
                value={isViolationDataLoading ? '...' : String(violations.length)}
                tone="violet"
                description="All recorded employee violation cases currently available for reporting."
              />
              <MetricStat
                label="Employees Flagged"
                value={isViolationDataLoading ? '...' : String(violationEmployeeStats.length)}
                tone="amber"
                description="Unique employees with at least one violation case on record."
              />
              <MetricStat
                label="Termination Review"
                value={isViolationDataLoading ? '...' : String(terminationReviewCandidates.length)}
                tone="emerald"
                description="Employees meeting the watchlist threshold for escalation review."
              />
              <MetricStat
                label="Highest Company Load"
                value={isViolationDataLoading ? '...' : String(mostViolationsCompany?.total ?? 0)}
                tone="sky"
                description={
                  isViolationDataLoading
                    ? 'Loading company comparison...'
                    : `${mostViolationsCompany?.company || 'No company'} currently carries the heaviest violation load.`
                }
              />
            </div>
          </CardBody>
        </Card>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <RankedBars
            title="Employees With Most Violations"
            subtitle="Top employees ranked by case volume, active exposure, and high-severity weight."
            items={topViolationEmployees}
          />

          <Card>
            <CardHeader
              title="Termination Review Candidates"
              subtitle="Operational watchlist only: 4+ total cases, 2+ high severity, or 3+ total with 2+ active."
            />
            <CardBody>
              {terminationReviewCandidates.length === 0 ? (
                <div className="rounded-xl bg-slate-900/80 px-4 py-5 text-sm text-slate-400 ring-1 ring-inset ring-slate-800">
                  No employees currently meet the termination review threshold.
                </div>
              ) : (
                <div className="space-y-3">
                  {terminationReviewCandidates.map((candidate) => (
                    <div
                      key={candidate.userId}
                      className="rounded-2xl bg-slate-900/70 px-4 py-4 ring-1 ring-inset ring-slate-800"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-slate-100">{candidate.name}</div>
                          <div className="mt-1 text-xs text-slate-500">
                            {candidate.company} · {candidate.position}
                          </div>
                        </div>
                        <div className="rounded-full bg-rose-500/10 px-2.5 py-1 text-[11px] font-semibold text-rose-300 ring-1 ring-inset ring-rose-400/20">
                          {candidate.total} cases
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-3">
                        <div className="rounded-xl bg-slate-950/70 px-3 py-3 text-center ring-1 ring-inset ring-slate-800">
                          <div className="text-lg font-semibold text-slate-100">{candidate.total}</div>
                          <div className="mt-1 text-[11px] uppercase tracking-wide text-slate-500">
                            Total
                          </div>
                        </div>
                        <div className="rounded-xl bg-slate-950/70 px-3 py-3 text-center ring-1 ring-inset ring-slate-800">
                          <div className="text-lg font-semibold text-rose-300">{candidate.high}</div>
                          <div className="mt-1 text-[11px] uppercase tracking-wide text-slate-500">
                            High
                          </div>
                        </div>
                        <div className="rounded-xl bg-slate-950/70 px-3 py-3 text-center ring-1 ring-inset ring-slate-800">
                          <div className="text-lg font-semibold text-amber-300">{candidate.open}</div>
                          <div className="mt-1 text-[11px] uppercase tracking-wide text-slate-500">
                            Active
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <RankedBars
            title="Company Violation Load"
            subtitle="Compare which companies carry the highest discipline pressure."
            items={companyViolationRanking}
          />

          <Card>
            <CardHeader
              title="Company Violation Extremes"
              subtitle="Quick comparison between the most exposed and cleanest company groups."
            />
            <CardBody>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-rose-400/15 bg-rose-500/8 px-4 py-4 ring-1 ring-inset ring-rose-400/15">
                  <div className="text-xs font-semibold uppercase tracking-wide text-rose-300">
                    Most Violations
                  </div>
                  <div className="mt-2 text-lg font-semibold text-slate-50">
                    {mostViolationsCompany?.company || 'No company'}
                  </div>
                  <div className="mt-2 text-sm leading-6 text-slate-300">
                    {mostViolationsCompany
                      ? `${mostViolationsCompany.total} total cases, ${mostViolationsCompany.open} active, ${mostViolationsCompany.high} high severity.`
                      : 'No recorded cases yet.'}
                  </div>
                </div>

                <div className="rounded-2xl border border-emerald-400/15 bg-emerald-500/8 px-4 py-4 ring-1 ring-inset ring-emerald-400/15">
                  <div className="text-xs font-semibold uppercase tracking-wide text-emerald-300">
                    Least Violations
                  </div>
                  <div className="mt-2 text-lg font-semibold text-slate-50">
                    {leastViolationsCompany?.company || 'No company'}
                  </div>
                  <div className="mt-2 text-sm leading-6 text-slate-300">
                    {leastViolationsCompany
                      ? `${leastViolationsCompany.total} total cases across ${leastViolationsCompany.employees} staff member(s).`
                      : 'Company comparison will appear once staffing data is available.'}
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-900/75 px-4 py-3 ring-1 ring-inset ring-slate-800">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Clean Companies
                  </div>
                  <div className="mt-2 text-xl font-semibold text-slate-50">{cleanCompanyCount}</div>
                </div>
                <div className="rounded-xl bg-slate-900/75 px-4 py-3 ring-1 ring-inset ring-slate-800">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Tracked Companies
                  </div>
                  <div className="mt-2 text-xl font-semibold text-slate-50">
                    {companyViolationStats.length}
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <RankedBars
            title="Positions Under Pressure"
            subtitle="Roles accumulating the most discipline cases across the workforce."
            items={rolePressure}
          />

          <VerticalBarChart
            title="Staffing Distribution"
            subtitle="Top staffed roles by employee headcount for workforce planning."
            items={staffingDistribution}
          />
        </div>
      </div>
    );
  }

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
              label="Open Violations"
              value={isViolationDataLoading ? '...' : String(openViolationCount)}
              tone="violet"
              description="Violation cases that are still open or under active review."
            />
            <MetricStat
              label="Approval Rate"
              value={isLeaveDataLoading ? '...' : approvalRate}
              tone="emerald"
              description="Share of reviewed leave requests that were approved."
            />
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <PieChartCard
          title="Employee Access Mix"
          subtitle="A quick pie view of healthy, restricted, and banned accounts."
          items={[
            {
              label: `Active (${formatPercent(employeeStatusCounts.active, employees.length)})`,
              value: employeeStatusCounts.active,
              color: 'rgba(52, 211, 153, 0.95)',
              chipClass: 'bg-emerald-400',
            },
            {
              label: `Restricted (${formatPercent(employeeStatusCounts.restricted, employees.length)})`,
              value: employeeStatusCounts.restricted,
              color: 'rgba(251, 191, 36, 0.95)',
              chipClass: 'bg-amber-400',
            },
            {
              label: `Banned (${formatPercent(employeeStatusCounts.banned, employees.length)})`,
              value: employeeStatusCounts.banned,
              color: 'rgba(251, 113, 133, 0.95)',
              chipClass: 'bg-rose-400',
            },
          ]}
        />

        <VerticalBarChart
          title="Operations Pipeline"
          subtitle={
            isLeaveDataLoading || isViolationDataLoading
              ? 'Loading leave and violation analytics...'
              : 'Side-by-side bar graph for leave decisions and violation case movement.'
          }
          items={operationsBars}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <RankedBars
          title="Company Coverage"
          subtitle="Top companies by employee headcount across the tracked workforce."
          items={companyCounts}
        />

        <Card>
          <CardHeader
            title="Company Operations Snapshot"
            subtitle="Per-company pressure from pending leaves and active violation cases."
          />
          <CardBody>
            {topCompanyOperations.length === 0 ? (
              <div className="rounded-xl bg-slate-900/80 px-4 py-5 text-sm text-slate-400 ring-1 ring-inset ring-slate-800">
                Company analytics will appear once employee accounts are grouped under companies.
              </div>
            ) : (
              <div className="space-y-3">
                {topCompanyOperations.map((company) => (
                  <div
                    key={company.company}
                    className="rounded-2xl bg-slate-900/70 px-4 py-4 ring-1 ring-inset ring-slate-800"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-slate-100">{company.company}</div>
                      <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
                        Company
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-3">
                      <div className="rounded-xl bg-slate-950/70 px-3 py-3 text-center ring-1 ring-inset ring-slate-800">
                        <div className="text-lg font-semibold text-sky-300">{company.employees}</div>
                        <div className="mt-1 text-[11px] uppercase tracking-wide text-slate-500">
                          Employees
                        </div>
                      </div>
                      <div className="rounded-xl bg-slate-950/70 px-3 py-3 text-center ring-1 ring-inset ring-slate-800">
                        <div className="text-lg font-semibold text-amber-300">{company.pendingLeaves}</div>
                        <div className="mt-1 text-[11px] uppercase tracking-wide text-slate-500">
                          Pending Leave
                        </div>
                      </div>
                      <div className="rounded-xl bg-slate-950/70 px-3 py-3 text-center ring-1 ring-inset ring-slate-800">
                        <div className="text-lg font-semibold text-violet-300">{company.openViolations}</div>
                        <div className="mt-1 text-[11px] uppercase tracking-wide text-slate-500">
                          Open Cases
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <RankedBars
          title="Top Leave Demand"
          subtitle="Most requested leave types across the current filing history."
          items={leaveTypeDemand}
        />

        <PieChartCard
          title="Violation Severity Spread"
          subtitle="Pie graph showing how discipline risk is distributed by severity."
          items={[
            {
              label: `Low (${formatPercent(violationSeverityCounts.low, violations.length)})`,
              value: violationSeverityCounts.low,
              color: 'rgba(74, 222, 128, 0.95)',
              chipClass: 'bg-green-400',
            },
            {
              label: `Medium (${formatPercent(violationSeverityCounts.medium, violations.length)})`,
              value: violationSeverityCounts.medium,
              color: 'rgba(250, 204, 21, 0.95)',
              chipClass: 'bg-yellow-400',
            },
            {
              label: `High (${formatPercent(violationSeverityCounts.high, violations.length)})`,
              value: violationSeverityCounts.high,
              color: 'rgba(248, 113, 113, 0.95)',
              chipClass: 'bg-red-400',
            },
          ]}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <RankedBars
          title="Role Coverage"
          subtitle="Most common positions currently represented in the employee roster."
          items={positionCounts}
        />

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
                <div className="text-sm font-semibold text-slate-100">Violation Risk</div>
                <div className="mt-1 text-sm leading-6 text-slate-400">
                  {isViolationDataLoading
                    ? 'Violation analytics are still loading.'
                    : openViolationCount > 0
                      ? `${openViolationCount} case(s) remain active, including ${severeViolationCount} high-severity issue(s).`
                      : 'No active violation cases are currently open.'}
                </div>
              </div>
              <div className="rounded-2xl bg-slate-900/70 px-4 py-4 ring-1 ring-inset ring-slate-800">
                <div className="text-sm font-semibold text-slate-100">Workforce Experience</div>
                <div className="mt-1 text-sm leading-6 text-slate-400">
                  Average service stands at {averageServiceYears} years, with {recentHires} recent hire(s)
                  added in the last 90 days.
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
