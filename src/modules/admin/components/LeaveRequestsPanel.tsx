'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { NotificationToggle } from '@/components/pwa/NotificationToggle';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Select } from '@/components/ui/Select';
import type { AdminLeaveRequest, ReviewLeaveRequestInput } from '@/modules/leave/types';
import {
  LeaveAttachmentPreviewModal,
  type LeaveAttachmentPreview,
} from '@/modules/leave/components/LeaveAttachmentPreviewModal';
import { getLeavePolicy } from '@/modules/leave/policy';
import {
  LEAVE_REVIEW_WINDOW_HOURS,
  getReviewDeadline,
  isUrgentReview,
  type ReviewUrgency,
} from '@/modules/leave/review-window';

const REQUESTS_PER_PAGE = 5;

function deadlineClass(urgency: ReviewUrgency) {
  switch (urgency) {
    case 'expired':
      return 'bg-rose-500/15 text-rose-200 ring-1 ring-inset ring-rose-400/40';
    case 'critical':
      return 'bg-rose-500/12 text-rose-300 ring-1 ring-inset ring-rose-400/25';
    case 'warning':
      return 'bg-amber-500/12 text-amber-300 ring-1 ring-inset ring-amber-400/25';
    default:
      return 'bg-slate-950/80 text-slate-400 ring-1 ring-inset ring-slate-800';
  }
}

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
  const [pendingApproveRequest, setPendingApproveRequest] = useState<AdminLeaveRequest | null>(null);
  const [approveNote, setApproveNote] = useState('');
  const [pendingRejectRequest, setPendingRejectRequest] = useState<AdminLeaveRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [previewAttachment, setPreviewAttachment] = useState<LeaveAttachmentPreview | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | AdminLeaveRequest['status']>('all');
  const [page, setPage] = useState(1);
  const [expandedRequestIds, setExpandedRequestIds] = useState<number[]>([]);

  const grouped = useMemo(() => {
    return {
      pending: requests.filter((request) => request.status === 'pending'),
      reviewed: requests.filter((request) => request.status !== 'pending'),
    };
  }, [requests]);

  const filteredRequests = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    const matches = requests.filter((request) => {
      if (statusFilter !== 'all' && request.status !== statusFilter) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const policy = getLeavePolicy(request.leave_type);
      const searchableFields = [
        request.user_name,
        request.user_email,
        request.user_company || '',
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

    // Pending first and oldest first within it, so whatever is closest to being
    // auto-rejected is the first thing on screen.
    return [...matches].sort((left, right) => {
      if (left.status === 'pending' && right.status !== 'pending') return -1;
      if (right.status === 'pending' && left.status !== 'pending') return 1;

      const leftFiled = new Date(left.created_at).getTime();
      const rightFiled = new Date(right.created_at).getTime();

      return left.status === 'pending' ? leftFiled - rightFiled : rightFiled - leftFiled;
    });
  }, [requests, searchTerm, statusFilter]);

  // One instant for the whole list, so every countdown is measured against the same
  // clock, refreshed each minute so the remaining time stays honest while the page sits open.
  const [reviewClock, setReviewClock] = useState(() => new Date());

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setReviewClock(new Date());
    }, 60_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const urgentPending = useMemo(
    () =>
      grouped.pending
        .map((request) => ({ request, deadline: getReviewDeadline(request.created_at, reviewClock) }))
        .filter((entry) => isUrgentReview(entry.deadline.urgency))
        .sort((left, right) => left.deadline.hoursRemaining - right.deadline.hoursRemaining),
    [grouped.pending, reviewClock]
  );

  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / REQUESTS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const paginatedRequests = filteredRequests.slice(
    (currentPage - 1) * REQUESTS_PER_PAGE,
    currentPage * REQUESTS_PER_PAGE
  );

  const review = async (
    requestId: number,
    action: ReviewLeaveRequestInput['action'],
    adminNotes?: string
  ) => {
    setActionError(null);
    setBusyRequestId(requestId);

    try {
      await onReview({
        requestId,
        action,
        adminNotes,
      });
    } catch (reviewError) {
      setActionError(reviewError instanceof Error ? reviewError.message : 'Failed to review leave request');
    } finally {
      setBusyRequestId(null);
    }
  };

  const approve = async () => {
    if (!pendingApproveRequest) return;

    const trimmedNote = approveNote.trim();
    if (!trimmedNote) {
      setActionError('Please add an admin note before approving the leave request');
      return;
    }

    try {
      await review(pendingApproveRequest.id, 'approve', trimmedNote);
      setPendingApproveRequest(null);
      setApproveNote('');
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

  const openAttachmentPreview = (attachment: AdminLeaveRequest['attachments'][number]) => {
    setPreviewAttachment({
      title: attachment.file_name,
      mimeType: attachment.mime_type,
      previewUrl: `${attachment.download_url}?preview=1`,
      downloadUrl: attachment.download_url,
      sizeLabel: `${(attachment.file_size / 1024).toFixed(0)} KB`,
    });
  };

  const toggleExpanded = (requestId: number) => {
    setExpandedRequestIds((current) =>
      current.includes(requestId)
        ? current.filter((id) => id !== requestId)
        : [...current, requestId]
    );
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
            {urgentPending.length > 0 ? (
              <div className="mt-1 text-[11px] font-medium text-rose-300">
                {urgentPending.length} nearing auto-rejection
              </div>
            ) : null}
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

      <NotificationToggle />

      {urgentPending.length > 0 ? (
        <div className="rounded-2xl border border-rose-400/25 bg-rose-500/10 px-4 py-3.5 ring-1 ring-inset ring-rose-400/10">
          <div className="flex flex-wrap items-center gap-2">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-4 w-4 shrink-0 text-rose-300">
              <path
                d="M12 8.75v4M12 16.25h.01M10.3 4.9 3.6 16.5a2 2 0 0 0 1.73 3h13.34a2 2 0 0 0 1.73-3L13.7 4.9a2 2 0 0 0-3.4 0Z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="text-sm font-semibold text-rose-200">
              {urgentPending.length} request{urgentPending.length === 1 ? '' : 's'} near the{' '}
              {LEAVE_REVIEW_WINDOW_HOURS}-hour limit
            </span>
          </div>
          <div className="mt-1.5 text-xs leading-5 text-rose-200/80">
            Requests left unreviewed past the limit are rejected automatically. Review these before
            that happens.
          </div>
          <ul className="mt-2.5 flex flex-col gap-1.5">
            {urgentPending.slice(0, 4).map(({ request, deadline }) => (
              <li key={request.id} className="flex flex-wrap items-center gap-2 text-xs">
                <span
                  className={[
                    'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold',
                    deadlineClass(deadline.urgency),
                  ].join(' ')}
                >
                  {deadline.label}
                </span>
                <span className="font-medium text-slate-100">{request.user_name}</span>
                <span className="text-slate-400">
                  {getLeavePolicy(request.leave_type).label} · {request.total_days} day
                  {request.total_days === 1 ? '' : 's'}
                </span>
              </li>
            ))}
          </ul>
          {urgentPending.length > 4 ? (
            <div className="mt-2 text-[11px] text-rose-200/70">
              and {urgentPending.length - 4} more below
            </div>
          ) : null}
        </div>
      ) : null}

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
                  placeholder="Search by name, email, company, position, leave type..."
                />
              </div>
              <div className="w-full sm:w-40">
                <Select
                  value={statusFilter}
                  onChange={(event) => {
                    setStatusFilter(event.target.value as 'all' | AdminLeaveRequest['status']);
                    setPage(1);
                  }}
                >
                  <option value="all">All status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </Select>
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
              description="Try another search using employee name, email, company, position, leave type, or status."
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
                const reviewDeadline =
                  request.status === 'pending'
                    ? getReviewDeadline(request.created_at, reviewClock)
                    : null;
                const isBusy = busyRequestId === request.id;
                const isExpanded = expandedRequestIds.includes(request.id);

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
                          {request.user_email}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className="inline-flex items-center rounded-full bg-cyan-500/10 px-2.5 py-1 text-[11px] font-semibold text-cyan-300 ring-1 ring-inset ring-cyan-400/20">
                            {request.user_company || 'Unassigned company'}
                          </span>
                          <span className="inline-flex items-center rounded-full bg-slate-950/80 px-2.5 py-1 text-[11px] font-medium text-slate-300 ring-1 ring-inset ring-slate-800">
                            {request.user_position || 'No position set'}
                          </span>
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
                      <div className="flex shrink-0 flex-wrap items-center gap-2">
                        <span
                          className={[
                            'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize',
                            statusClass(request.status),
                          ].join(' ')}
                        >
                          {request.status}
                        </span>
                        {reviewDeadline ? (
                          <span
                            title={`Auto-rejects ${reviewDeadline.deadline.toLocaleString()}`}
                            className={[
                              'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold',
                              deadlineClass(reviewDeadline.urgency),
                            ].join(' ')}
                          >
                            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-3 w-3">
                              <path
                                d="M12 6.75v5.5l3.25 2M12 4.75a7.25 7.25 0 1 1 0 14.5 7.25 7.25 0 0 1 0-14.5Z"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                            {reviewDeadline.label}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-3 text-sm lg:grid-cols-4">
                      <div className="rounded-xl bg-slate-950/55 px-3 py-2.5 ring-1 ring-inset ring-slate-800">
                        <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                          Filed
                        </div>
                        <div className="mt-1 text-sm text-slate-300">
                          {new Date(request.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="rounded-xl bg-slate-950/55 px-3 py-2.5 ring-1 ring-inset ring-slate-800">
                        <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                          Service Start
                        </div>
                        <div className="mt-1 text-sm text-slate-300">
                          {new Date(request.user_start_date).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="rounded-xl bg-slate-950/55 px-3 py-2.5 ring-1 ring-inset ring-slate-800">
                        <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                          Balance Effect
                        </div>
                        <div className="mt-1 text-sm text-slate-300">
                          {request.deduct_from_paid_balance ? 'Deducts paid balance' : 'No deduction'}
                        </div>
                      </div>
                      {request.reviewed_at ? (
                        <div className="rounded-xl bg-slate-950/55 px-3 py-2.5 ring-1 ring-inset ring-slate-800">
                          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                            Reviewed
                          </div>
                          <div className="mt-1 text-sm text-slate-300">
                            {new Date(request.reviewed_at).toLocaleDateString()}
                          </div>
                        </div>
                      ) : null}
                    </div>

                    <div className="mt-3 flex justify-end">
                      <Button variant="ghost" size="sm" onClick={() => toggleExpanded(request.id)}>
                        {isExpanded ? 'Hide Details' : 'View Details'}
                      </Button>
                    </div>

                    {isExpanded ? (
                      <>
                        <div className="mt-3 grid grid-cols-1 gap-3 text-sm md:grid-cols-3 xl:grid-cols-4">
                          <div>
                            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                              Company
                            </div>
                            <div className="mt-1 text-sm text-slate-300">
                              {request.user_company || 'Unassigned'}
                            </div>
                          </div>
                        </div>

                        <div className="mt-3">
                          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                            Reason
                          </div>
                          <div className="mt-1 text-sm leading-6 text-slate-400">{request.reason}</div>
                        </div>

                        <div className="mt-3">
                          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                            Supporting Documents
                          </div>
                          {request.attachments.length > 0 ? (
                            <div className="mt-2 space-y-2">
                              {request.attachments.map((attachment) => (
                                <button
                                  key={attachment.id}
                                  type="button"
                                  onClick={() => openAttachmentPreview(attachment)}
                                  className="flex items-center justify-between rounded-xl bg-slate-950/70 px-4 py-3 text-sm text-slate-300 ring-1 ring-inset ring-slate-800 transition-colors hover:bg-slate-900/90"
                                >
                                  <span className="truncate pr-3 text-left">{attachment.file_name}</span>
                                  <span className="whitespace-nowrap text-xs text-slate-400">
                                    Preview
                                  </span>
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="mt-1 text-sm text-slate-400">
                              No supporting documents uploaded.
                            </div>
                          )}
                        </div>
                      </>
                    ) : null}

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
                            onClick={() => {
                              setActionError(null);
                              setPendingApproveRequest(request);
                              setApproveNote(request.admin_notes ?? '');
                            }}
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
        <div className="app-overlay-scroll bg-slate-950/70 backdrop-blur-sm">
          <div className="app-overlay-panel max-w-md rounded-2xl border border-slate-800/80 bg-slate-950/95 p-6 shadow-[0_22px_60px_rgba(2,8,23,0.55)] ring-1 ring-inset ring-white/5">
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

      {pendingApproveRequest ? (
        <div className="app-overlay-scroll bg-slate-950/70 backdrop-blur-sm">
          <div className="app-overlay-panel max-w-md rounded-2xl border border-slate-800/80 bg-slate-950/95 p-6 shadow-[0_22px_60px_rgba(2,8,23,0.55)] ring-1 ring-inset ring-white/5">
            <div className="text-lg font-semibold text-slate-100">Approve Leave Request</div>
            <div className="mt-2 text-sm leading-6 text-slate-400">
              Add an admin note before approving {pendingApproveRequest.user_name}&apos;s leave
              request.
            </div>
            <div className="mt-4 rounded-xl bg-slate-900/80 px-4 py-3 text-sm text-slate-300 ring-1 ring-inset ring-slate-800">
              <div>
                <span className="font-medium text-slate-100">Leave Type:</span>{' '}
                {getLeavePolicy(pendingApproveRequest.leave_type).label}
              </div>
              <div className="mt-2">
                <span className="font-medium text-slate-100">Date Range:</span>{' '}
                {new Date(pendingApproveRequest.start_date).toLocaleDateString()} to{' '}
                {new Date(pendingApproveRequest.end_date).toLocaleDateString()}
              </div>
            </div>
            <div className="mt-4">
              <div className="text-sm font-medium text-slate-300">Admin Note</div>
              <div className="mt-1">
                <textarea
                  value={approveNote}
                  onChange={(event) => setApproveNote(event.target.value)}
                  rows={4}
                  className="w-full rounded-xl border border-slate-700/80 bg-slate-900/90 px-3 py-2.5 text-sm text-slate-100 shadow-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-400/70"
                  placeholder="Add context for the approval, reminders, or next steps."
                />
              </div>
            </div>
            <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end sm:gap-3">
              <Button
                className="w-full sm:w-auto"
                variant="secondary"
                onClick={() => {
                  if (busyRequestId !== pendingApproveRequest.id) {
                    setPendingApproveRequest(null);
                    setApproveNote('');
                  }
                }}
                disabled={busyRequestId === pendingApproveRequest.id}
              >
                Cancel
              </Button>
              <Button
                className="w-full sm:w-auto"
                onClick={approve}
                disabled={busyRequestId === pendingApproveRequest.id}
              >
                {busyRequestId === pendingApproveRequest.id ? 'Please wait...' : 'Approve Request'}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {previewAttachment ? (
        <LeaveAttachmentPreviewModal
          attachment={previewAttachment}
          onClose={() => setPreviewAttachment(null)}
        />
      ) : null}
    </div>
  );
}
