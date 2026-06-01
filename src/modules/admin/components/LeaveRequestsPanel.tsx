'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import type { AdminLeaveRequest, ReviewLeaveRequestInput } from '@/modules/leave/types';
import { getLeavePolicy } from '@/modules/leave/policy';

const REQUESTS_PER_PAGE = 5;

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
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingRejectRequest, setPendingRejectRequest] = useState<AdminLeaveRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);

  const grouped = useMemo(() => {
    return {
      pending: requests.filter((request) => request.status === 'pending'),
      reviewed: requests.filter((request) => request.status !== 'pending'),
    };
  }, [requests]);

  const filteredRequests = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) {
      return requests;
    }

    return requests.filter((request) => {
      const policy = getLeavePolicy(request.leave_type);
      const searchableFields = [
        request.user_name,
        request.user_email,
        request.user_position || '',
        request.leave_type,
        policy.label,
        request.status,
        request.reason,
        request.admin_notes || '',
        request.start_date,
        request.end_date,
        request.user_start_date,
        String(request.total_days),
        String(request.user_leave_remaining),
        String(request.user_leave_entitlement),
      ];

      return searchableFields.some((value) => value.toLowerCase().includes(normalizedSearch));
    });
  }, [requests, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / REQUESTS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const paginatedRequests = filteredRequests.slice(
    (currentPage - 1) * REQUESTS_PER_PAGE,
    currentPage * REQUESTS_PER_PAGE
  );

  const review = async (requestId: number, action: ReviewLeaveRequestInput['action']) => {
    setActionError(null);
    setBusyRequestId(requestId);

    try {
      await onReview({
        requestId,
        action,
      });
    } catch (reviewError) {
      setActionError(reviewError instanceof Error ? reviewError.message : 'Failed to review leave request');
    } finally {
      setBusyRequestId(null);
    }
  };

  const reject = async () => {
    if (!pendingRejectRequest) return;

    const trimmedReason = rejectReason.trim();
    if (!trimmedReason) {
      setActionError('Please provide a rejection reason before rejecting the leave request');
      return;
    }

    setActionError(null);
    setBusyRequestId(pendingRejectRequest.id);

    try {
      await onReview({
        requestId: pendingRejectRequest.id,
        action: 'reject',
        adminNotes: trimmedReason,
      });
      setPendingRejectRequest(null);
      setRejectReason('');
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
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <div className="w-full sm:w-[22rem]">
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(event) => {
                    setSearchTerm(event.target.value);
                    setPage(1);
                  }}
                  className="w-full rounded-xl border border-slate-700/80 bg-slate-900/90 px-3 py-2.5 text-sm text-slate-100 shadow-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-400/70"
                  placeholder="Search by name, email, position, leave type..."
                />
              </div>
              <Button variant="secondary" onClick={onRefresh} disabled={isLoading}>
                {isLoading ? 'Refreshing...' : 'Refresh'}
              </Button>
            </div>
          }
        />
        <CardBody>
          {requests.length === 0 && !isLoading ? (
            <EmptyState
              title="No leave requests yet"
              description="Employee leave applications will appear here once they submit one."
            />
          ) : filteredRequests.length === 0 ? (
            <EmptyState
              title="No matching leave requests"
              description="Try another search using employee name, email, position, leave type, or status."
            />
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-slate-400">
                  Showing {paginatedRequests.length} of {filteredRequests.length} matching requests
                </div>
                <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Page {currentPage} of {totalPages}
                </div>
              </div>

              {paginatedRequests.map((request) => {
                const policy = getLeavePolicy(request.leave_type);
                const isBusy = busyRequestId === request.id;

                return (
                  <div
                    key={request.id}
                    className="rounded-2xl border border-slate-800/80 bg-slate-900/55 p-3.5 ring-1 ring-inset ring-white/5"
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-100 sm:text-base">
                          {request.user_name}
                        </div>
                        <div className="mt-1 text-xs text-slate-400 sm:text-sm">
                          {request.user_email} · {request.user_position || 'No position set'}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className="inline-flex items-center rounded-full bg-sky-500/10 px-2.5 py-1 text-[11px] font-semibold text-sky-300 ring-1 ring-inset ring-sky-400/20">
                            {policy.label}
                          </span>
                          <span className="inline-flex items-center rounded-full bg-slate-950/80 px-2.5 py-1 text-[11px] font-medium text-slate-300 ring-1 ring-inset ring-slate-800">
                            {new Date(request.start_date).toLocaleDateString()} to{' '}
                            {new Date(request.end_date).toLocaleDateString()}
                          </span>
                          <span className="inline-flex items-center rounded-full bg-slate-950/80 px-2.5 py-1 text-[11px] font-medium text-slate-300 ring-1 ring-inset ring-slate-800">
                            {request.total_days} day{request.total_days === 1 ? '' : 's'}
                          </span>
                          <span className="inline-flex items-center rounded-full bg-slate-950/80 px-2.5 py-1 text-[11px] font-medium text-slate-300 ring-1 ring-inset ring-slate-800">
                            Balance {request.user_leave_remaining}/{request.user_leave_entitlement}
                          </span>
                        </div>
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

                    <div className="mt-3 grid grid-cols-1 gap-3 text-sm md:grid-cols-3 xl:grid-cols-4">
                      <div>
                        <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                          Service Start
                        </div>
                        <div className="mt-1 text-sm text-slate-300">
                          {new Date(request.user_start_date).toLocaleDateString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                          Balance Effect
                        </div>
                        <div className="mt-1 text-sm text-slate-300">
                          {request.deduct_from_paid_balance ? 'Deducts paid balance' : 'No paid balance deduction'}
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                          Filed
                        </div>
                        <div className="mt-1 text-sm text-slate-300">
                          {new Date(request.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      {request.reviewed_at ? (
                        <div>
                          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                            Reviewed
                          </div>
                          <div className="mt-1 text-sm text-slate-300">
                            {new Date(request.reviewed_at).toLocaleDateString()}
                          </div>
                        </div>
                      ) : null}
                    </div>

                    <div className="mt-3">
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        Reason
                      </div>
                      <div className="mt-1 text-sm leading-6 text-slate-400">{request.reason}</div>
                    </div>

                    {request.status === 'pending' ? (
                      <div className="mt-3">
                        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                          <Button
                            className="w-full sm:w-auto"
                            variant="danger"
                            disabled={isBusy}
                            onClick={() => {
                              setActionError(null);
                              setPendingRejectRequest(request);
                              setRejectReason('');
                            }}
                          >
                            Reject
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
                      <div className="mt-3 rounded-xl bg-slate-950/70 px-4 py-3 text-sm text-slate-300 ring-1 ring-inset ring-slate-800">
                        <span className="font-medium text-slate-100">Admin note:</span>{' '}
                        {request.admin_notes}
                      </div>
                    ) : (
                      <div className="mt-3 rounded-xl bg-slate-950/55 px-4 py-3 text-sm text-slate-400 ring-1 ring-inset ring-slate-800">
                        No admin note added.
                      </div>
                    )}
                  </div>
                );
              })}

              {totalPages > 1 ? (
                <div className="flex flex-col gap-3 border-t border-slate-800/80 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm text-slate-400">
                    Browse filtered leave requests 5 at a time.
                  </div>
                  <div className="flex gap-2 sm:justify-end">
                    <Button
                      variant="secondary"
                      onClick={() => setPage((current) => Math.max(1, current - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </CardBody>
      </Card>

      {pendingRejectRequest ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-800/80 bg-slate-950/95 p-6 shadow-[0_22px_60px_rgba(2,8,23,0.55)] ring-1 ring-inset ring-white/5">
            <div className="text-lg font-semibold text-slate-100">Reject Leave Request</div>
            <div className="mt-2 text-sm leading-6 text-slate-400">
              Add the reason for rejecting {pendingRejectRequest.user_name}&apos;s leave request.
            </div>
            <div className="mt-4 rounded-xl bg-slate-900/80 px-4 py-3 text-sm text-slate-300 ring-1 ring-inset ring-slate-800">
              <div>
                <span className="font-medium text-slate-100">Leave Type:</span>{' '}
                {getLeavePolicy(pendingRejectRequest.leave_type).label}
              </div>
              <div className="mt-2">
                <span className="font-medium text-slate-100">Date Range:</span>{' '}
                {new Date(pendingRejectRequest.start_date).toLocaleDateString()} to{' '}
                {new Date(pendingRejectRequest.end_date).toLocaleDateString()}
              </div>
            </div>
            <div className="mt-4">
              <div className="text-sm font-medium text-slate-300">Rejection Reason</div>
              <div className="mt-1">
                <textarea
                  value={rejectReason}
                  onChange={(event) => setRejectReason(event.target.value)}
                  rows={4}
                  className="w-full rounded-xl border border-slate-700/80 bg-slate-900/90 px-3 py-2.5 text-sm text-slate-100 shadow-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-400/70"
                  placeholder="Explain why this leave request is being rejected."
                />
              </div>
            </div>
            <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end sm:gap-3">
              <Button
                className="w-full sm:w-auto"
                variant="secondary"
                onClick={() => {
                  if (busyRequestId !== pendingRejectRequest.id) {
                    setPendingRejectRequest(null);
                    setRejectReason('');
                  }
                }}
                disabled={busyRequestId === pendingRejectRequest.id}
              >
                Cancel
              </Button>
              <Button
                className="w-full sm:w-auto"
                variant="danger"
                onClick={reject}
                disabled={busyRequestId === pendingRejectRequest.id}
              >
                {busyRequestId === pendingRejectRequest.id ? 'Please wait...' : 'Reject Request'}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
