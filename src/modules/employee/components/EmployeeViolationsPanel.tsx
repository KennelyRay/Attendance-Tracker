'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { appealMyViolation } from '@/modules/employee/api';
import type { EmployeePortalProfile, EmployeeViolationRecord } from '@/modules/employee/types';
import type { ViolationCaseStatus, ViolationSeverity } from '@/modules/admin/types';

const PAGE_SIZE = 5;

function severityClass(severity: ViolationSeverity) {
  switch (severity) {
    case 'high':
      return 'bg-red-500/12 text-red-300 ring-1 ring-inset ring-red-400/20';
    case 'medium':
      return 'bg-yellow-500/12 text-yellow-300 ring-1 ring-inset ring-yellow-400/20';
    default:
      return 'bg-emerald-500/12 text-emerald-300 ring-1 ring-inset ring-emerald-400/20';
  }
}

function statusClass(status: ViolationCaseStatus) {
  switch (status) {
    case 'resolved':
      return 'bg-emerald-500/12 text-emerald-300 ring-1 ring-inset ring-emerald-400/20';
    case 'under-review':
      return 'bg-amber-500/12 text-amber-300 ring-1 ring-inset ring-amber-400/20';
    default:
      return 'bg-slate-900/90 text-slate-300 ring-1 ring-inset ring-slate-700';
  }
}

function canAppealViolation(violation: EmployeeViolationRecord) {
  return (
    !violation.appeal_message &&
    (violation.case_status === 'open' || violation.case_status === 'under-review')
  );
}

export function EmployeeViolationsPanel({
  employeeProfile,
  violations,
  isLoading,
  error,
  onRefresh,
}: {
  employeeProfile?: EmployeePortalProfile | null;
  violations: EmployeeViolationRecord[];
  isLoading: boolean;
  error: string | null;
  onRefresh: () => Promise<void>;
}) {
  const [page, setPage] = useState(1);
  const [severityFilter, setSeverityFilter] = useState<'all' | ViolationSeverity>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | ViolationCaseStatus>('all');
  const [expandedViolationIds, setExpandedViolationIds] = useState<number[]>([]);
  const [appealingViolationId, setAppealingViolationId] = useState<number | null>(null);
  const [appealMessage, setAppealMessage] = useState('');
  const [appealError, setAppealError] = useState<string | null>(null);
  const [isSubmittingAppeal, setIsSubmittingAppeal] = useState(false);

  const filteredViolations = useMemo(
    () =>
      violations.filter((violation) => {
        if (severityFilter !== 'all' && violation.severity !== severityFilter) {
          return false;
        }

        if (statusFilter !== 'all' && violation.case_status !== statusFilter) {
          return false;
        }

        return true;
      }),
    [severityFilter, statusFilter, violations]
  );
  const summary = useMemo(
    () => ({
      open: violations.filter((violation) => violation.case_status === 'open').length,
      underReview: violations.filter((violation) => violation.case_status === 'under-review').length,
      resolved: violations.filter((violation) => violation.case_status === 'resolved').length,
      high: violations.filter((violation) => violation.severity === 'high').length,
    }),
    [violations]
  );
  const totalPages = Math.max(1, Math.ceil(filteredViolations.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedViolations = useMemo(
    () => filteredViolations.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [currentPage, filteredViolations]
  );

  const toggleExpanded = (violationId: number) => {
    setExpandedViolationIds((current) =>
      current.includes(violationId)
        ? current.filter((id) => id !== violationId)
        : [...current, violationId]
    );
  };

  const openAppealForm = (violationId: number) => {
    setAppealError(null);
    setAppealMessage('');
    setAppealingViolationId(violationId);
  };

  const closeAppealForm = () => {
    setAppealError(null);
    setAppealMessage('');
    setAppealingViolationId(null);
  };

  const submitAppeal = async (violationId: number) => {
    const message = appealMessage.trim();

    if (!message) {
      setAppealError('Please explain why you are appealing this violation.');
      return;
    }

    setIsSubmittingAppeal(true);
    setAppealError(null);
    try {
      await appealMyViolation(violationId, message);
      closeAppealForm();
      await onRefresh();
    } catch (submitError) {
      setAppealError(
        submitError instanceof Error ? submitError.message : 'Failed to submit appeal'
      );
    } finally {
      setIsSubmittingAppeal(false);
    }
  };

  return (
    <Card>
      <CardHeader
        title="My Violations"
        subtitle="Review your recorded violation cases, their severity, latest status, and assigned company context."
        right={
          <Button variant="secondary" onClick={onRefresh} disabled={isLoading}>
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </Button>
        }
      />
      <CardBody>
        {error ? (
          <div className="rounded-xl bg-rose-500/10 px-4 py-3 text-sm text-rose-300 ring-1 ring-inset ring-rose-400/20">
            {error}
          </div>
        ) : null}

        {violations.length === 0 && !isLoading ? (
          <EmptyState
            title="No violations on record"
            description="Any recorded violations assigned to your account will appear here."
          />
        ) : isLoading && violations.length === 0 ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="app-skeleton h-20 rounded-2xl ring-1 ring-inset ring-slate-800" />
              <div className="app-skeleton h-20 rounded-2xl ring-1 ring-inset ring-slate-800" />
              <div className="app-skeleton h-20 rounded-2xl ring-1 ring-inset ring-slate-800" />
              <div className="app-skeleton h-20 rounded-2xl ring-1 ring-inset ring-slate-800" />
            </div>
            <div className="app-skeleton h-11 rounded-xl ring-1 ring-inset ring-slate-800" />
            <div className="app-skeleton h-36 rounded-2xl ring-1 ring-inset ring-slate-800" />
            <div className="app-skeleton h-36 rounded-2xl ring-1 ring-inset ring-slate-800" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-2xl bg-slate-900/80 px-4 py-3.5 ring-1 ring-inset ring-slate-800">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Open
                </div>
                <div className="mt-2 text-xl font-semibold text-slate-50">{summary.open}</div>
              </div>
              <div className="rounded-2xl bg-slate-900/80 px-4 py-3.5 ring-1 ring-inset ring-slate-800">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-amber-300">
                  Under Review
                </div>
                <div className="mt-2 text-xl font-semibold text-slate-50">{summary.underReview}</div>
              </div>
              <div className="rounded-2xl bg-slate-900/80 px-4 py-3.5 ring-1 ring-inset ring-slate-800">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-emerald-300">
                  Resolved
                </div>
                <div className="mt-2 text-xl font-semibold text-slate-50">{summary.resolved}</div>
              </div>
              <div className="rounded-2xl bg-slate-900/80 px-4 py-3.5 ring-1 ring-inset ring-slate-800">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-rose-300">
                  High Severity
                </div>
                <div className="mt-2 text-xl font-semibold text-slate-50">{summary.high}</div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center rounded-full bg-cyan-500/10 px-2.5 py-1 text-[11px] font-semibold text-cyan-300 ring-1 ring-inset ring-cyan-400/20">
                {employeeProfile?.company || 'Unassigned company'}
              </span>
              <span className="inline-flex items-center rounded-full bg-slate-950/80 px-2.5 py-1 text-[11px] font-medium text-slate-300 ring-1 ring-inset ring-slate-800">
                {employeeProfile?.position || 'No position set'}
              </span>
            </div>
            <div className="overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="flex min-w-max gap-2">
                {([
                  ['all', 'All'],
                  ['open', 'Open'],
                  ['under-review', 'Under Review'],
                  ['resolved', 'Resolved'],
                ] as const).map(([value, label]) => {
                  const isActive = statusFilter === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => {
                        setStatusFilter(value);
                        setPage(1);
                      }}
                      className={[
                        'inline-flex items-center rounded-full border px-3 py-2 text-sm font-medium transition-all ring-1 ring-inset',
                        isActive
                          ? 'border-sky-400/25 bg-sky-500/12 text-slate-50 ring-sky-400/20'
                          : 'border-slate-800/80 bg-slate-900/70 text-slate-300 ring-white/5',
                      ].join(' ')}
                    >
                      {label}
                    </button>
                  );
                })}
                {([
                  ['all', 'All Severity'],
                  ['low', 'Low'],
                  ['medium', 'Medium'],
                  ['high', 'High'],
                ] as const).map(([value, label]) => {
                  const isActive = severityFilter === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => {
                        setSeverityFilter(value);
                        setPage(1);
                      }}
                      className={[
                        'inline-flex items-center rounded-full border px-3 py-2 text-sm font-medium transition-all ring-1 ring-inset',
                        isActive
                          ? 'border-sky-400/25 bg-sky-500/12 text-slate-50 ring-sky-400/20'
                          : 'border-slate-800/80 bg-slate-900/70 text-slate-300 ring-white/5',
                      ].join(' ')}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-slate-400">
                Showing {paginatedViolations.length} of {filteredViolations.length} matching cases
              </div>
              <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Page {currentPage} of {totalPages}
              </div>
            </div>

            {filteredViolations.length === 0 ? (
              <div className="rounded-xl bg-slate-900/80 px-4 py-8 text-center text-sm text-slate-400 ring-1 ring-inset ring-slate-800">
                No violations match the current filters.
              </div>
            ) : (
              <div className="space-y-3">
              {paginatedViolations.map((violation) => (
                <div
                  key={violation.id}
                  className="rounded-2xl border border-slate-800/80 bg-slate-900/55 px-4 py-4 ring-1 ring-inset ring-white/5"
                >
                  {(() => {
                    const isExpanded = expandedViolationIds.includes(violation.id);
                    return (
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="text-sm font-semibold text-slate-100 sm:text-base">
                              {violation.violation_type}
                            </div>
                            <span className="inline-flex rounded-full bg-slate-950/80 px-2.5 py-1 text-[11px] font-medium text-slate-300 ring-1 ring-inset ring-slate-800">
                              {new Date(violation.incident_date).toLocaleDateString()}
                            </span>
                            {violation.company ? (
                              <span className="inline-flex rounded-full bg-slate-950/80 px-2.5 py-1 text-[11px] font-medium text-slate-300 ring-1 ring-inset ring-slate-800">
                                {violation.company}
                              </span>
                            ) : null}
                          </div>
                          <div className="mt-3 text-sm leading-6 text-slate-400 line-clamp-3">
                            {violation.description}
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <Button variant="ghost" size="sm" onClick={() => toggleExpanded(violation.id)}>
                              {isExpanded ? 'Hide Details' : 'View Details'}
                            </Button>
                            {canAppealViolation(violation) && appealingViolationId !== violation.id ? (
                              <Button variant="secondary" size="sm" onClick={() => openAppealForm(violation.id)}>
                                Appeal
                              </Button>
                            ) : null}
                          </div>
                          {appealingViolationId === violation.id ? (
                            <div className="mt-3 rounded-xl bg-slate-950/70 px-3 py-3 ring-1 ring-inset ring-slate-800">
                              <div className="text-sm font-medium text-slate-100">Appeal this violation</div>
                              <div className="mt-1 text-xs leading-5 text-slate-400">
                                Explain why this case should be reconsidered. Your appeal will be sent to the admins for review.
                              </div>
                              <textarea
                                value={appealMessage}
                                onChange={(event) => setAppealMessage(event.target.value)}
                                rows={3}
                                maxLength={2000}
                                placeholder="I would like to appeal this violation because..."
                                className="mt-3 w-full rounded-xl border border-slate-700/80 bg-slate-900/90 px-3 py-2.5 text-sm text-slate-100 shadow-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-400/70"
                              />
                              {appealError ? (
                                <div className="mt-2 rounded-xl bg-rose-500/10 px-3 py-2 text-sm text-rose-300 ring-1 ring-inset ring-rose-400/20">
                                  {appealError}
                                </div>
                              ) : null}
                              <div className="mt-3 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                                <Button variant="secondary" size="sm" onClick={closeAppealForm} disabled={isSubmittingAppeal}>
                                  Cancel
                                </Button>
                                <Button size="sm" onClick={() => void submitAppeal(violation.id)} disabled={isSubmittingAppeal}>
                                  {isSubmittingAppeal ? 'Submitting...' : 'Submit Appeal'}
                                </Button>
                              </div>
                            </div>
                          ) : null}
                          {violation.appeal_message ? (
                            <div className="mt-3 rounded-xl bg-sky-500/10 px-3 py-2.5 text-sm text-sky-200 ring-1 ring-inset ring-sky-400/20">
                              <span className="font-medium text-sky-100">
                                Appeal submitted
                                {violation.appealed_at
                                  ? ` on ${new Date(violation.appealed_at).toLocaleDateString()}`
                                  : ''}
                                :
                              </span>{' '}
                              {violation.appeal_message}
                            </div>
                          ) : null}
                          {violation.appeal_verdict ? (
                            <div className="mt-3 rounded-xl bg-emerald-500/10 px-3 py-2.5 text-sm text-emerald-200 ring-1 ring-inset ring-emerald-400/20">
                              <span className="font-medium text-emerald-100">
                                Final verdict
                                {violation.appeal_resolved_at
                                  ? ` on ${new Date(violation.appeal_resolved_at).toLocaleDateString()}`
                                  : ''}
                                :
                              </span>{' '}
                              {violation.appeal_verdict}
                            </div>
                          ) : null}
                          {isExpanded ? (
                            <>
                              <div className="mt-3 rounded-xl bg-slate-950/70 px-3 py-2.5 text-sm text-slate-300 ring-1 ring-inset ring-slate-800">
                                <span className="font-medium text-slate-100">Description:</span>{' '}
                                {violation.description}
                              </div>
                              {violation.action_taken ? (
                                <div className="mt-3 rounded-xl bg-slate-950/70 px-3 py-2.5 text-sm text-slate-300 ring-1 ring-inset ring-slate-800">
                                  <span className="font-medium text-slate-100">Action Taken:</span>{' '}
                                  {violation.action_taken}
                                </div>
                              ) : null}
                            </>
                          ) : null}
                        </div>
                        <div className="flex flex-wrap gap-2 lg:max-w-[220px] lg:justify-end">
                          <span className="inline-flex rounded-full bg-slate-950/80 px-2.5 py-1 text-[11px] font-medium text-slate-300 ring-1 ring-inset ring-slate-800">
                            {employeeProfile?.company || violation.company || 'Assigned company'}
                          </span>
                          <span
                            className={[
                              'inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize',
                              severityClass(violation.severity),
                            ].join(' ')}
                          >
                            {violation.severity}
                          </span>
                          <span
                            className={[
                              'inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize',
                              statusClass(violation.case_status),
                            ].join(' ')}
                          >
                            {violation.case_status.replace('-', ' ')}
                          </span>
                          {violation.appeal_message ? (
                            <span className="inline-flex rounded-full bg-sky-500/12 px-2.5 py-1 text-[11px] font-semibold text-sky-300 ring-1 ring-inset ring-sky-400/20">
                              Appealed
                            </span>
                          ) : null}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ))}
              </div>
            )}

            {filteredViolations.length > PAGE_SIZE ? (
              <div className="flex flex-col gap-3 border-t border-slate-800/80 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-slate-400">
                  Newer violation cases appear first.
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
  );
}
