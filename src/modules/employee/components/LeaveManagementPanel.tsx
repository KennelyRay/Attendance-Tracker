'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { createLeaveRequest, fetchMyLeaveData } from '@/modules/employee/api';
import { leavePolicies, getLeavePolicy } from '@/modules/leave/policy';
import { formatDateOnly } from '@/modules/leave/utils';
import type {
  CreateLeaveRequestInput,
  LeaveBalance,
  LeaveRequest,
  LeaveRequestStatus,
  LeaveType,
} from '@/modules/leave/types';

const LEAVE_COOLDOWN_MS = 13 * 7 * 24 * 60 * 60 * 1000;
const MAX_TIMEOUT_MS = 2_147_483_647;

function statusClass(status: LeaveRequestStatus) {
  switch (status) {
    case 'approved':
      return 'bg-emerald-500/12 text-emerald-300 ring-1 ring-inset ring-emerald-400/20';
    case 'rejected':
      return 'bg-rose-500/12 text-rose-300 ring-1 ring-inset ring-rose-400/20';
    default:
      return 'bg-amber-500/12 text-amber-300 ring-1 ring-inset ring-amber-400/20';
  }
}

function addMilliseconds(dateString: string, milliseconds: number) {
  return new Date(new Date(dateString).getTime() + milliseconds);
}

export function LeaveManagementPanel({
  initialBalance,
  initialRequests,
}: {
  initialBalance: LeaveBalance;
  initialRequests: LeaveRequest[];
}) {
  const [balance, setBalance] = useState(initialBalance);
  const [requests, setRequests] = useState(initialRequests);
  const [leaveType, setLeaveType] = useState<LeaveType>('paid-leave');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [deductFromPaidBalance, setDeductFromPaidBalance] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingSubmission, setPendingSubmission] = useState<CreateLeaveRequestInput | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const selectedPolicy = useMemo(() => getLeavePolicy(leaveType), [leaveType]);
  const loadLeaveData = useCallback(async () => {
    try {
      const data = await fetchMyLeaveData();
      setBalance(data.balance);
      setRequests(data.requests);
    } catch {
      // Keep the last successful state if background refresh fails.
    }
  }, []);
  const nextBalanceRefreshAt = useMemo(() => {
    const futureCooldownEndTimes = requests
      .filter((request) => request.status === 'approved' && request.deduct_from_paid_balance)
      .map((request) =>
        addMilliseconds(request.reviewed_at ?? request.created_at, LEAVE_COOLDOWN_MS).getTime()
      )
      .filter((endTime) => endTime > now)
      .sort((left, right) => left - right);

    return futureCooldownEndTimes.length > 0 ? new Date(futureCooldownEndTimes[0]) : null;
  }, [now, requests]);

  useEffect(() => {
    let cancelled = false;

    const safeLoadLeaveData = async () => {
      await loadLeaveData();
      if (cancelled) return;
    };

    void safeLoadLeaveData();
    const intervalId = window.setInterval(() => {
      void safeLoadLeaveData();
    }, 10000);

    const handleFocus = () => {
      void safeLoadLeaveData();
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [loadLeaveData]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (!nextBalanceRefreshAt) {
      return;
    }

    const timeoutMs = Math.max(0, nextBalanceRefreshAt.getTime() - Date.now()) + 150;
    if (timeoutMs > MAX_TIMEOUT_MS) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void loadLeaveData();
    }, timeoutMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadLeaveData, nextBalanceRefreshAt]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    setPendingSubmission({
      leaveType,
      startDate,
      endDate,
      reason,
      deductFromPaidBalance,
    });
  };

  const confirmSubmit = async () => {
    if (!pendingSubmission) return;

    setIsSubmitting(true);

    try {
      const response = await createLeaveRequest(pendingSubmission);
      setRequests((current) => [response.request, ...current]);
      setBalance(response.balance);
      setStartDate('');
      setEndDate('');
      setReason('');
      setDeductFromPaidBalance(false);
      setLeaveType('paid-leave');
      setPendingSubmission(null);
      setSuccessMessage('Your leave request has been submitted and is now pending admin review.');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to submit leave request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader
            title="Apply For Leave"
            subtitle="Choose a leave type from the policy guide and send it for approval."
          />
          <CardBody>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <div className="text-sm font-medium text-slate-300">Leave Type</div>
                <div className="mt-1">
                  <Select
                    value={leaveType}
                    onChange={(event) => setLeaveType(event.target.value as LeaveType)}
                  >
                    {leavePolicies.map((policy) => (
                      <option key={policy.value} value={policy.value}>
                        {policy.label}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 ring-1 ring-inset ring-white/5">
                <div className="text-sm font-semibold text-slate-100">{selectedPolicy.label}</div>
                <div className="mt-2 text-sm leading-6 text-slate-400">{selectedPolicy.description}</div>
                <div className="mt-3 text-sm text-sky-300">{selectedPolicy.daysLabel}</div>
                <div className="mt-2 text-xs leading-5 text-slate-500">{selectedPolicy.filing}</div>
              </div>

              <div className="rounded-2xl border border-emerald-400/15 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100 ring-1 ring-inset ring-emerald-400/20">
                You can request leave while you still meet the policy rules and have remaining
                balance. Any approved paid leave deduction refreshes after 13 weeks.
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <div className="text-sm font-medium text-slate-300">Start Date</div>
                  <div className="mt-1">
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(event) => setStartDate(event.target.value)}
                      required
                    />
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-300">End Date</div>
                  <div className="mt-1">
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(event) => setEndDate(event.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              {selectedPolicy.canUsePaidBalance && !selectedPolicy.requiresPaidBalance ? (
                <label className="flex items-start gap-3 rounded-2xl border border-slate-800/80 bg-slate-900/60 px-4 py-3 text-sm text-slate-300 ring-1 ring-inset ring-white/5">
                  <input
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 rounded border-slate-700 bg-slate-900 text-sky-400"
                    checked={deductFromPaidBalance}
                    onChange={(event) => setDeductFromPaidBalance(event.target.checked)}
                  />
                  <span>
                    Deduct this request from my paid leave balance to make it paid.
                  </span>
                </label>
              ) : null}

              {selectedPolicy.requiresPaidBalance ? (
                <div className="rounded-2xl border border-sky-400/15 bg-sky-500/10 px-4 py-3 text-sm text-sky-100 ring-1 ring-inset ring-sky-400/20">
                  This leave type always uses your paid leave balance.
                </div>
              ) : null}

              <div>
                <div className="text-sm font-medium text-slate-300">Reason</div>
                <div className="mt-1">
                  <textarea
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    rows={4}
                    required
                    className="w-full rounded-xl border border-slate-700/80 bg-slate-900/90 px-3 py-2.5 text-sm text-slate-100 shadow-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-400/70"
                    placeholder="Add the reason and any note the admin should review."
                  />
                </div>
              </div>

              {error ? (
                <div className="rounded-xl bg-rose-500/10 px-4 py-3 text-sm text-rose-300 ring-1 ring-inset ring-rose-400/20">
                  {error}
                </div>
              ) : null}

              <div className="flex justify-end">
                <Button className="w-full sm:w-auto" type="submit" disabled={isSubmitting}>
                  Review Leave Request
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Leave Balance"
            subtitle="Your paid leave entitlement updates automatically from your years of service."
          />
          <CardBody>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-sky-500/10 px-4 py-4 ring-1 ring-inset ring-sky-400/20">
                <div className="text-xs font-semibold uppercase tracking-wide text-sky-300">
                  Remaining
                </div>
                <div className="mt-2 text-2xl font-semibold text-slate-50">{balance.remaining}</div>
              </div>
              <div className="rounded-2xl bg-slate-900/80 px-4 py-4 ring-1 ring-inset ring-slate-800">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Used
                </div>
                <div className="mt-2 text-2xl font-semibold text-slate-50">{balance.used}</div>
              </div>
              <div className="rounded-2xl bg-slate-900/80 px-4 py-4 ring-1 ring-inset ring-slate-800">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Annual Entitlement
                </div>
                <div className="mt-2 text-2xl font-semibold text-slate-50">
                  {balance.annualEntitlement}
                </div>
              </div>
              <div className="rounded-2xl bg-slate-900/80 px-4 py-4 ring-1 ring-inset ring-slate-800">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Years Of Service
                </div>
                <div className="mt-2 text-2xl font-semibold text-slate-50">{balance.serviceYears}</div>
              </div>
            </div>
            <div className="mt-4 text-sm leading-6 text-slate-400">
              Start date: {formatDateOnly(balance.startDate)}. Paid leave starts at 5 days and grows
              by 1 day for every completed year of service.
            </div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Leave Requests"
          subtitle="Track your submitted requests and the admin decision for each one."
        />
        <CardBody>
          {requests.length === 0 ? (
            <EmptyState
              title="No leave requests yet"
              description="Your submitted leave requests will appear here."
            />
          ) : (
            <div className="space-y-4">
              {requests.map((request) => {
                const policy = getLeavePolicy(request.leave_type);

                return (
                  <div
                    key={request.id}
                    className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 ring-1 ring-inset ring-white/5"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="text-base font-semibold text-slate-100">{policy.label}</div>
                        <div className="mt-1 text-sm text-slate-400">
                          {formatDateOnly(request.start_date)} to {formatDateOnly(request.end_date)}
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
                    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div>
                        <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                          Days
                        </div>
                        <div className="mt-1 text-sm text-slate-300">{request.total_days}</div>
                      </div>
                      <div>
                        <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                          Paid Balance
                        </div>
                        <div className="mt-1 text-sm text-slate-300">
                          {request.deduct_from_paid_balance ? 'Deducts from balance' : 'No deduction'}
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                          Submitted
                        </div>
                        <div className="mt-1 text-sm text-slate-300">
                          {new Date(request.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 text-sm leading-6 text-slate-400">{request.reason}</div>
                    {request.admin_notes ? (
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

      {pendingSubmission ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-800/80 bg-slate-950/95 p-6 shadow-[0_22px_60px_rgba(2,8,23,0.55)] ring-1 ring-inset ring-white/5">
            <div className="text-lg font-semibold text-slate-100">Confirm Leave Request</div>
            <div className="mt-2 text-sm leading-6 text-slate-400">
              Please confirm the details before sending your leave request for approval.
            </div>
            <div className="mt-4 rounded-xl bg-slate-900/80 px-4 py-4 ring-1 ring-inset ring-slate-800">
              <div className="text-sm text-slate-300">
                <span className="font-medium text-slate-100">Leave Type:</span>{' '}
                {getLeavePolicy(pendingSubmission.leaveType).label}
              </div>
              <div className="mt-2 text-sm text-slate-300">
                <span className="font-medium text-slate-100">Date Range:</span>{' '}
                {formatDateOnly(pendingSubmission.startDate)} to{' '}
                {formatDateOnly(pendingSubmission.endDate)}
              </div>
              <div className="mt-2 text-sm text-slate-300">
                <span className="font-medium text-slate-100">Paid Balance:</span>{' '}
                {pendingSubmission.deductFromPaidBalance ||
                getLeavePolicy(pendingSubmission.leaveType).requiresPaidBalance
                  ? 'This request deducts from your paid leave balance'
                  : 'This request does not deduct from your paid leave balance'}
              </div>
              <div className="mt-2 text-sm text-slate-300">
                <span className="font-medium text-slate-100">Reason:</span> {pendingSubmission.reason}
              </div>
            </div>
            <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end sm:gap-3">
              <Button
                className="w-full sm:w-auto"
                variant="secondary"
                onClick={() => {
                  if (!isSubmitting) {
                    setPendingSubmission(null);
                  }
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                className="w-full sm:w-auto"
                onClick={confirmSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Leave Request'}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {successMessage ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-800/80 bg-slate-950/95 p-6 shadow-[0_22px_60px_rgba(2,8,23,0.55)] ring-1 ring-inset ring-white/5">
            <div className="text-lg font-semibold text-slate-100">Leave Request Sent</div>
            <div className="mt-2 text-sm leading-6 text-slate-400">{successMessage}</div>
            <div className="mt-6 flex justify-end">
              <Button className="w-full sm:w-auto" onClick={() => setSuccessMessage(null)}>
                OK
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
