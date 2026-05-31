'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { createLeaveRequest } from '@/modules/employee/api';
import { leavePolicies, getLeavePolicy } from '@/modules/leave/policy';
import type {
  CreateLeaveRequestInput,
  LeaveBalance,
  LeaveRequest,
  LeaveRequestStatus,
  LeaveType,
} from '@/modules/leave/types';

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
  const selectedPolicy = useMemo(() => getLeavePolicy(leaveType), [leaveType]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const payload: CreateLeaveRequestInput = {
        leaveType,
        startDate,
        endDate,
        reason,
        deductFromPaidBalance,
      };

      const response = await createLeaveRequest(payload);
      setRequests((current) => [response.request, ...current]);
      setBalance(response.balance);
      setStartDate('');
      setEndDate('');
      setReason('');
      setDeductFromPaidBalance(false);
      setLeaveType('paid-leave');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to submit leave request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.05fr_1.35fr]">
      <div className="space-y-6">
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
              Start date: {new Date(balance.startDate).toLocaleDateString()}. Paid leave starts at 5
              days and grows by 1 day for every completed year of service.
            </div>
          </CardBody>
        </Card>

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
                  {isSubmitting ? 'Submitting...' : 'Submit Leave Request'}
                </Button>
              </div>
            </form>
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
                          {new Date(request.start_date).toLocaleDateString()} to{' '}
                          {new Date(request.end_date).toLocaleDateString()}
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
    </div>
  );
}
