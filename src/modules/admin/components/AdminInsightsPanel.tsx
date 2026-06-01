'use client';

import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { employeeAccountStatus, type Employee } from '@/modules/admin/types';
import type { AdminView } from '@/modules/admin/components/AdminSidebar';
import type { AdminLeaveRequest } from '@/modules/leave/types';

type Insight = {
  title: string;
  description: string;
  toneClass: string;
  actionLabel?: string;
  actionView?: AdminView;
};

export function AdminInsightsPanel({
  employees,
  leaveRequests,
  isLeaveDataLoading,
  onOpenView,
}: {
  employees: Employee[];
  leaveRequests: AdminLeaveRequest[];
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

  const pendingLeaves = leaveRequests.filter((request) => request.status === 'pending');
  const reviewedLeaves = leaveRequests.filter((request) => request.status !== 'pending');
  const approvedLeaves = reviewedLeaves.filter((request) => request.status === 'approved');

  const topPosition = Object.entries(
    employees.reduce<Record<string, number>>((totals, employee) => {
      const key = employee.position?.trim() || 'Unassigned';
      totals[key] = (totals[key] ?? 0) + 1;
      return totals;
    }, {})
  ).sort((left, right) => right[1] - left[1])[0];

  const insights: Insight[] = [
    {
      title: 'Leave Queue Watch',
      description: isLeaveDataLoading
        ? 'Leave request data is still loading for insight generation.'
        : pendingLeaves.length > 0
          ? `${pendingLeaves.length} leave request(s) are waiting for review. Checking this queue first keeps employee schedules updated.`
          : 'No leave requests are currently waiting for review.',
      toneClass: 'border-amber-400/18 bg-amber-500/8 text-amber-200',
      actionLabel: pendingLeaves.length > 0 ? 'Open Leave Requests' : undefined,
      actionView: pendingLeaves.length > 0 ? 'leave-requests' : undefined,
    },
    {
      title: 'Access Risk',
      description:
        employeeStatusCounts.restricted + employeeStatusCounts.banned > 0
          ? `${employeeStatusCounts.restricted + employeeStatusCounts.banned} account(s) are restricted or banned, which may need follow-up with HR or operations.`
          : 'No access restrictions are active right now, which suggests account health is stable.',
      toneClass: 'border-rose-400/18 bg-rose-500/8 text-rose-200',
      actionLabel:
        employeeStatusCounts.restricted + employeeStatusCounts.banned > 0
          ? 'Open Employee Accounts'
          : undefined,
      actionView:
        employeeStatusCounts.restricted + employeeStatusCounts.banned > 0
          ? 'employee-accounts'
          : undefined,
    },
    {
      title: 'Role Concentration',
      description: topPosition
        ? `${topPosition[0]} is currently the most represented role with ${topPosition[1]} employee(s), which helps guide staffing balance decisions.`
        : 'Role coverage insights will appear once positions are assigned to employee accounts.',
      toneClass: 'border-sky-400/18 bg-sky-500/8 text-sky-200',
      actionLabel: topPosition ? 'Open Reports & Charts' : undefined,
      actionView: topPosition ? 'reports-charts' : undefined,
    },
    {
      title: 'Review Trend',
      description: isLeaveDataLoading
        ? 'Leave review analytics are still loading.'
        : reviewedLeaves.length > 0
          ? `${approvedLeaves.length} of ${reviewedLeaves.length} reviewed leave request(s) were approved, which helps indicate current review posture.`
          : 'There are no reviewed leave requests yet, so trend analysis will build over time.',
      toneClass: 'border-violet-400/18 bg-violet-500/8 text-violet-200',
      actionLabel: reviewedLeaves.length > 0 ? 'Review Analytics' : undefined,
      actionView: reviewedLeaves.length > 0 ? 'reports-charts' : undefined,
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Smart Insights"
          subtitle="Auto-generated cues based on the latest employee, leave, and access data."
        />
        <CardBody>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {insights.map((insight) => (
              <div
                key={insight.title}
                className={`rounded-2xl border px-5 py-5 ring-1 ring-inset ${insight.toneClass}`}
              >
                <div className="text-base font-semibold text-slate-50">{insight.title}</div>
                <div className="mt-2 text-sm leading-6 text-slate-300/90">{insight.description}</div>
                {insight.actionLabel && insight.actionView && onOpenView ? (
                  <div className="mt-4">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onOpenView(insight.actionView as AdminView)}
                    >
                      {insight.actionLabel}
                    </Button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
