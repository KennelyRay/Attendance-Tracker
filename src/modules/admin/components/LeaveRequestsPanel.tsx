'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import type { AdminLeaveRequest, ReviewLeaveRequestInput } from '@/modules/leave/types';
import { getLeavePolicy } from '@/modules/leave/policy';

function statusClass(status: AdminLeaveRequest['status']) {
  switch (status) {
    case 'approved':
      return 'bg-emerald-500/12 text-emerald-300 ring-1 ring-inset ring-emerald-400/20';
    case 'rejected':
      return 'bg-rose-500/12 text-rose-300 ring-1 ring-inset ring-rose-400/20';
    default:
      return 'bg-amber-500/12 text-amber-300 ring-1 ring-inset ring-amber-400/20';
  }
}

export function LeaveRequestsPanel({
  requests,
  isLoading,
  error,
  onReview,
  onRefresh,
}: {
  requests: AdminLeaveRequest[];
  isLoading: boolean;
  error: string | null;
  onReview: (input: ReviewLeaveRequestInput) => Promise<void>;
  onRefresh: () => Promise<void>;
}) {
  const [busyRequestId, setBusyRequestId] = useState<number | null>(null);
  const [notesByRequest, setNotesByRequest] = useState<Record<number, string>>({});
  const [actionError, setActionError] = useState<string | null>(null);

  const grouped = useMemo(() => {
    return {
      pending: requests.filter((request) => request.status === 'pending'),
      reviewed: requests.filter((request) => request.status !== 'pending'),
    };
  }, [requests]);

  const review = async (requestId: number, action: ReviewLeaveRequestInput['action']) => {
    setActionError(null);
    setBusyRequestId(requestId);

    try {
      await onReview({
        requestId,
        action,
        adminNotes: notesByRequest[requestId]?.trim() || undefined,
      });
    } catch (reviewError) {
      setActionError(reviewError instanceof Error ? reviewError.message : 'Failed to review leave request');
    } finally {
      setBusyRequestId(null);
    }
  };

  if (error) {
    return (
      <EmptyState
        title="Could not load leave requests"
        description={error}
        action={
          <Button variant="secondary" onClick={onRefresh}>
            Retry
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardBody>
            <div className="text-xs font-semibold uppercase tracking-wide text-amber-300">Pending</div>
            <div className="mt-2 text-2xl font-semibold text-slate-50">{grouped.pending.length}</div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="text-xs font-semibold uppercase tracking-wide text-emerald-300">Approved</div>
            <div className="mt-2 text-2xl font-semibold text-slate-50">
              {requests.filter((request) => request.status === 'approved').length}
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="text-xs font-semibold uppercase tracking-wide text-rose-300">Rejected</div>
            <div className="mt-2 text-2xl font-semibold text-slate-50">
              {requests.filter((request) => request.status === 'rejected').length}
            </div>
          </CardBody>
        </Card>
      </div>

      {actionError ? (
        <div className="rounded-xl bg-rose-500/10 px-4 py-3 text-sm text-rose-300 ring-1 ring-inset ring-rose-400/20">
          {actionError}
        </div>
      ) : null}

      <Card>
        <CardHeader
          title="Leave Requests"
          subtitle="Approve or reject leave filings and keep attendance aligned with approved dates."
          right={
            <Button variant="secondary" onClick={onRefresh} disabled={isLoading}>
              {isLoading ? 'Refreshing...' : 'Refresh'}
            </Button>
          }
        />
        <CardBody>
          {requests.length === 0 && !isLoading ? (
            <EmptyState
              title="No leave requests yet"
              description="Employee leave applications will appear here once they submit one."
            />
          ) : (
            <div className="space-y-4">
              {requests.map((request) => {
                const policy = getLeavePolicy(request.leave_type);
                const isBusy = busyRequestId === request.id;

                return (
                  <div
                    key={request.id}
                    className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 ring-1 ring-inset ring-white/5"
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="text-base font-semibold text-slate-100">{request.user_name}</div>
                        <div className="mt-1 text-sm text-slate-400">
                          {request.user_email} · {request.user_position || 'No position set'}
                        </div>
                        <div className="mt-2 text-sm text-sky-300">{policy.label}</div>
                      </div>
                      <span
                        className={[
                          'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize',
                          statusClass(request.status),
                        ].join(' ')}
                      >
                        {request.status}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
                      <div>
                        <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                          Date Range
                        </div>
                        <div className="mt-1 text-sm text-slate-300">
                          {new Date(request.start_date).toLocaleDateString()} to{' '}
                          {new Date(request.end_date).toLocaleDateString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                          Days
                        </div>
                        <div className="mt-1 text-sm text-slate-300">{request.total_days}</div>
                      </div>
                      <div>
                        <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                          Paid Leave Balance
                        </div>
                        <div className="mt-1 text-sm text-slate-300">
                          {request.user_leave_remaining} / {request.user_leave_entitlement} remaining
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                          Service Start
                        </div>
                        <div className="mt-1 text-sm text-slate-300">
                          {new Date(request.user_start_date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 text-sm leading-6 text-slate-400">{request.reason}</div>

                    <div className="mt-4 rounded-xl bg-slate-950/70 px-4 py-3 text-sm text-slate-300 ring-1 ring-inset ring-slate-800">
                      <span className="font-medium text-slate-100">Balance effect:</span>{' '}
                      {request.deduct_from_paid_balance
                        ? 'This request deducts from the employee paid leave pool once approved.'
                        : 'This request does not deduct from the paid leave pool.'}
                    </div>

                    {request.status === 'pending' ? (
                      <div className="mt-4 space-y-3">
                        <textarea
                          value={notesByRequest[request.id] ?? ''}
                          onChange={(event) =>
                            setNotesByRequest((current) => ({
                              ...current,
                              [request.id]: event.target.value,
                            }))
                          }
                          rows={3}
                          className="w-full rounded-xl border border-slate-700/80 bg-slate-900/90 px-3 py-2.5 text-sm text-slate-100 shadow-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-400/70"
                          placeholder="Optional admin note for approval or rejection."
                        />
                        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                          <Button
                            className="w-full sm:w-auto"
                            variant="danger"
                            disabled={isBusy}
                            onClick={() => review(request.id, 'reject')}
                          >
                            {isBusy ? 'Please wait...' : 'Reject'}
                          </Button>
                          <Button
                            className="w-full sm:w-auto"
                            disabled={isBusy}
                            onClick={() => review(request.id, 'approve')}
                          >
                            {isBusy ? 'Please wait...' : 'Approve'}
                          </Button>
                        </div>
                      </div>
                    ) : request.admin_notes ? (
                      <div className="mt-4 rounded-xl bg-slate-950/70 px-4 py-3 text-sm text-slate-300 ring-1 ring-inset ring-slate-800">
                        <span className="font-medium text-slate-100">Admin note:</span>{' '}
                        {request.admin_notes}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
