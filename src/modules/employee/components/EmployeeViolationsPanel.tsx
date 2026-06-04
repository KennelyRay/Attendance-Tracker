'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import type { EmployeeViolationRecord } from '@/modules/employee/types';
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

export function EmployeeViolationsPanel({
  violations,
  isLoading,
  error,
  onRefresh,
}: {
  violations: EmployeeViolationRecord[];
  isLoading: boolean;
  error: string | null;
  onRefresh: () => Promise<void>;
}) {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(violations.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedViolations = useMemo(
    () => violations.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [currentPage, violations]
  );

  return (
    <Card>
      <CardHeader
        title="My Violations"
        subtitle="Review your recorded violation cases, their severity, and the latest status."
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
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-slate-400">
                Showing {paginatedViolations.length} of {violations.length} recorded cases
              </div>
              <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Page {currentPage} of {totalPages}
              </div>
            </div>

            <div className="space-y-3">
              {paginatedViolations.map((violation) => (
                <div
                  key={violation.id}
                  className="rounded-2xl border border-slate-800/80 bg-slate-900/55 px-4 py-4 ring-1 ring-inset ring-white/5"
                >
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
                      <div className="mt-3 text-sm leading-6 text-slate-400">
                        {violation.description}
                      </div>
                      {violation.action_taken ? (
                        <div className="mt-3 rounded-xl bg-slate-950/70 px-3 py-2.5 text-sm text-slate-300 ring-1 ring-inset ring-slate-800">
                          <span className="font-medium text-slate-100">Action Taken:</span>{' '}
                          {violation.action_taken}
                        </div>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-2 lg:max-w-[220px] lg:justify-end">
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
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 ? (
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
