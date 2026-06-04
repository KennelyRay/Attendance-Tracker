'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Table, TBody, TD, TH, THead } from '@/components/ui/Table';
import type {
  AdminViolationRecord,
  UpdateViolationInput,
  ViolationCaseStatus,
  ViolationSeverity,
} from '@/modules/admin/types';

const PAGE_SIZE = 5;
const severityOptions: ViolationSeverity[] = ['low', 'medium', 'high'];
const statusOptions: ViolationCaseStatus[] = ['open', 'under-review', 'resolved'];

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

function companyLabel(company: string | null) {
  return company?.trim() || 'Unassigned company';
}

function EditViolationModal({
  violation,
  isSubmitting,
  error,
  onClose,
  onSave,
}: {
  violation: AdminViolationRecord | null;
  isSubmitting: boolean;
  error: string | null;
  onClose: () => void;
  onSave: (input: UpdateViolationInput) => Promise<void>;
}) {
  const [violationType, setViolationType] = useState(violation?.violation_type ?? '');
  const [company, setCompany] = useState(violation?.company ?? '');
  const [severity, setSeverity] = useState<ViolationSeverity>(violation?.severity ?? 'medium');
  const [caseStatus, setCaseStatus] = useState<ViolationCaseStatus>(violation?.case_status ?? 'open');
  const [incidentDate, setIncidentDate] = useState(violation?.incident_date ?? '');
  const [description, setDescription] = useState(violation?.description ?? '');
  const [actionTaken, setActionTaken] = useState(violation?.action_taken ?? '');

  if (!violation) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-800/80 bg-slate-950/95 p-6 shadow-[0_22px_60px_rgba(2,8,23,0.55)] ring-1 ring-inset ring-white/5">
        <div className="text-lg font-semibold text-slate-100">Edit Violation Case</div>
        <div className="mt-2 text-sm leading-6 text-slate-400">
          Update the case details for {violation.user_name} from {companyLabel(violation.company)}.
        </div>
        {error ? (
          <div className="mt-4 rounded-xl bg-rose-500/10 px-4 py-3 text-sm text-rose-300 ring-1 ring-inset ring-rose-400/20">
            {error}
          </div>
        ) : null}

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <div className="mb-2 text-sm font-medium text-slate-300">Violation Type</div>
            <Input value={violationType} onChange={(event) => setViolationType(event.target.value)} />
          </div>
          <div>
            <div className="mb-2 text-sm font-medium text-slate-300">Company / Branch</div>
            <Input value={company} onChange={(event) => setCompany(event.target.value)} />
          </div>
          <div>
            <div className="mb-2 text-sm font-medium text-slate-300">Severity</div>
            <Select value={severity} onChange={(event) => setSeverity(event.target.value as ViolationSeverity)}>
              {severityOptions.map((option) => (
                <option key={option} value={option}>
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <div className="mb-2 text-sm font-medium text-slate-300">Case Status</div>
            <Select value={caseStatus} onChange={(event) => setCaseStatus(event.target.value as ViolationCaseStatus)}>
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {option.replace('-', ' ')}
                </option>
              ))}
            </Select>
          </div>
          <div className="md:col-span-2">
            <div className="mb-2 text-sm font-medium text-slate-300">Incident Date</div>
            <Input type="date" value={incidentDate} onChange={(event) => setIncidentDate(event.target.value)} />
          </div>
          <div className="md:col-span-2">
            <div className="mb-2 text-sm font-medium text-slate-300">Violation Details</div>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={5}
              className="w-full rounded-xl border border-slate-700/80 bg-slate-900/90 px-3 py-2.5 text-sm text-slate-100 shadow-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-400/70"
            />
          </div>
          <div className="md:col-span-2">
            <div className="mb-2 text-sm font-medium text-slate-300">Action Taken</div>
            <textarea
              value={actionTaken}
              onChange={(event) => setActionTaken(event.target.value)}
              rows={3}
              className="w-full rounded-xl border border-slate-700/80 bg-slate-900/90 px-3 py-2.5 text-sm text-slate-100 shadow-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-400/70"
            />
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end sm:gap-3">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={() =>
              void onSave({
                violationId: violation.id,
                violationType: violationType.trim(),
                company: company.trim(),
                severity,
                caseStatus,
                incidentDate,
                description: description.trim(),
                actionTaken: actionTaken.trim(),
              })
            }
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ViolationCasesPanel({
  violations,
  isLoading,
  error,
  onRefresh,
  onUpdate,
}: {
  violations: AdminViolationRecord[];
  isLoading: boolean;
  error: string | null;
  onRefresh: () => Promise<void>;
  onUpdate: (input: UpdateViolationInput) => Promise<void>;
}) {
  const [query, setQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'all' | ViolationSeverity>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | ViolationCaseStatus>('all');
  const [page, setPage] = useState(1);
  const [editingViolation, setEditingViolation] = useState<AdminViolationRecord | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyViolationId, setBusyViolationId] = useState<number | null>(null);

  const filteredViolations = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return violations.filter((violation) => {
      if (severityFilter !== 'all' && violation.severity !== severityFilter) {
        return false;
      }

      if (statusFilter !== 'all' && violation.case_status !== statusFilter) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const searchableFields = [
        violation.user_name,
        violation.user_email,
        violation.user_position || '',
        violation.violation_type,
        violation.company || '',
        violation.severity,
        violation.case_status,
        violation.description,
        violation.action_taken || '',
        violation.incident_date,
        violation.created_by_name || '',
      ];

      return searchableFields.some((value) => value.toLowerCase().includes(normalizedQuery));
    });
  }, [query, severityFilter, statusFilter, violations]);

  const totalPages = Math.max(1, Math.ceil(filteredViolations.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedViolations = filteredViolations.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const resetFilters = () => {
    setQuery('');
    setSeverityFilter('all');
    setStatusFilter('all');
    setPage(1);
  };

  const saveEdit = async (input: UpdateViolationInput) => {
    setActionError(null);
    setBusyViolationId(input.violationId);
    try {
      await onUpdate(input);
      setEditingViolation(null);
    } catch (updateError) {
      setActionError(
        updateError instanceof Error ? updateError.message : 'Failed to update violation case'
      );
    } finally {
      setBusyViolationId(null);
    }
  };

  return (
    <>
      <Card>
        <CardHeader
          title="All Violation Cases"
          subtitle="Review every employee violation case with the newest incidents shown first."
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
          {actionError ? (
            <div className="mt-4 rounded-xl bg-rose-500/10 px-4 py-3 text-sm text-rose-300 ring-1 ring-inset ring-rose-400/20">
              {actionError}
            </div>
          ) : null}

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_180px_180px_auto]">
            <Input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder="Search employee, company, violation type, email..."
            />
            <Select
              value={severityFilter}
              onChange={(event) => {
                setSeverityFilter(event.target.value as 'all' | ViolationSeverity);
                setPage(1);
              }}
            >
              <option value="all">All severity</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </Select>
            <Select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value as 'all' | ViolationCaseStatus);
                setPage(1);
              }}
            >
              <option value="all">All status</option>
              <option value="open">Open</option>
              <option value="under-review">Under Review</option>
              <option value="resolved">Resolved</option>
            </Select>
            <Button variant="secondary" onClick={resetFilters}>
              Reset Filters
            </Button>
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-slate-400">
              Showing {pagedViolations.length} of {filteredViolations.length} filtered cases
            </div>
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Page {currentPage} of {totalPages}
            </div>
          </div>

          {violations.length === 0 && !isLoading ? (
            <div className="mt-4">
              <EmptyState
                title="No violation cases yet"
                description="Violation cases will appear here after an admin records one."
              />
            </div>
          ) : filteredViolations.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                title="No matching cases"
                description="Try a different employee name, company, violation type, severity, or status."
              />
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              <div className="space-y-3 md:hidden">
                {pagedViolations.map((violation) => (
                  <div
                    key={violation.id}
                    className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 ring-1 ring-inset ring-white/5"
                  >
                    <div className="flex flex-col gap-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-slate-100">
                            {violation.user_name}
                          </div>
                          <div className="mt-1 break-all text-xs text-slate-400">
                            {violation.user_email}
                          </div>
                        </div>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setActionError(null);
                            setEditingViolation(violation);
                          }}
                          disabled={busyViolationId === violation.id}
                        >
                          {busyViolationId === violation.id ? 'Saving...' : 'Edit'}
                        </Button>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span className="inline-flex items-center rounded-full bg-cyan-500/10 px-2.5 py-1 text-[11px] font-semibold text-cyan-300 ring-1 ring-inset ring-cyan-400/20">
                          {companyLabel(violation.company)}
                        </span>
                        <span className="inline-flex items-center rounded-full bg-slate-950/80 px-2.5 py-1 text-[11px] font-medium text-slate-300 ring-1 ring-inset ring-slate-800">
                          {violation.user_position || 'No position set'}
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
                      </div>

                      <div className="rounded-xl bg-slate-950/70 px-3 py-3 ring-1 ring-inset ring-slate-800">
                        <div className="text-sm font-medium text-slate-100">
                          {violation.violation_type}
                        </div>
                        <div className="mt-2 text-sm leading-6 text-slate-400">
                          {violation.description}
                        </div>
                        {violation.action_taken ? (
                          <div className="mt-3 text-xs text-slate-500">
                            Action: {violation.action_taken}
                          </div>
                        ) : null}
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs text-slate-400">
                        <div className="rounded-xl bg-slate-950/55 px-3 py-2.5 ring-1 ring-inset ring-slate-800">
                          <div className="font-semibold uppercase tracking-wide text-slate-500">
                            Incident
                          </div>
                          <div className="mt-1 text-sm text-slate-300">
                            {new Date(violation.incident_date).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="rounded-xl bg-slate-950/55 px-3 py-2.5 ring-1 ring-inset ring-slate-800">
                          <div className="font-semibold uppercase tracking-wide text-slate-500">
                            Recorded
                          </div>
                          <div className="mt-1 text-sm text-slate-300">
                            {new Date(violation.created_at).toLocaleDateString()}
                          </div>
                          <div className="mt-1 text-xs text-slate-500">
                            {violation.created_by_name || 'System'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden md:block">
                <Table>
                  <THead>
                    <tr>
                      <TH>Employee</TH>
                      <TH>Case</TH>
                      <TH>Company</TH>
                      <TH>Severity</TH>
                      <TH>Status</TH>
                      <TH>Incident</TH>
                      <TH>Recorded</TH>
                      <TH>Actions</TH>
                    </tr>
                  </THead>
                  <TBody>
                    {pagedViolations.map((violation) => (
                      <tr key={violation.id}>
                        <TD>
                          <div className="font-medium text-slate-100">{violation.user_name}</div>
                          <div className="mt-1 text-xs text-slate-400">{violation.user_email}</div>
                          <div className="mt-1 text-xs text-slate-500">
                            {violation.user_position || 'No position set'}
                          </div>
                        </TD>
                        <TD>
                          <div className="font-medium text-slate-100">{violation.violation_type}</div>
                          <div className="mt-1 max-w-md text-xs leading-6 text-slate-400">
                            {violation.description}
                          </div>
                          {violation.action_taken ? (
                            <div className="mt-2 text-xs text-slate-500">
                              Action: {violation.action_taken}
                            </div>
                          ) : null}
                        </TD>
                        <TD>
                          <span className="inline-flex items-center rounded-full bg-cyan-500/10 px-2.5 py-1 text-[11px] font-semibold text-cyan-300 ring-1 ring-inset ring-cyan-400/20">
                            {companyLabel(violation.company)}
                          </span>
                        </TD>
                        <TD>
                          <span
                            className={[
                              'inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize',
                              severityClass(violation.severity),
                            ].join(' ')}
                          >
                            {violation.severity}
                          </span>
                        </TD>
                        <TD>
                          <span
                            className={[
                              'inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize',
                              statusClass(violation.case_status),
                            ].join(' ')}
                          >
                            {violation.case_status.replace('-', ' ')}
                          </span>
                        </TD>
                        <TD>{new Date(violation.incident_date).toLocaleDateString()}</TD>
                        <TD>
                          <div>{new Date(violation.created_at).toLocaleDateString()}</div>
                          <div className="mt-1 text-xs text-slate-500">
                            {violation.created_by_name || 'System'}
                          </div>
                        </TD>
                        <TD>
                          <Button
                            variant="secondary"
                            onClick={() => {
                              setActionError(null);
                              setEditingViolation(violation);
                            }}
                            disabled={busyViolationId === violation.id}
                          >
                            {busyViolationId === violation.id ? 'Saving...' : 'Edit'}
                          </Button>
                        </TD>
                      </tr>
                    ))}
                  </TBody>
                </Table>
              </div>

              {totalPages > 1 ? (
                <div className="flex flex-col gap-3 border-t border-slate-800/80 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm text-slate-400">
                    Most recent violation cases stay at the top of the list.
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

      <EditViolationModal
        key={editingViolation?.id ?? 0}
        violation={editingViolation}
        isSubmitting={busyViolationId === editingViolation?.id}
        error={actionError}
        onClose={() => {
          setActionError(null);
          setEditingViolation(null);
        }}
        onSave={saveEdit}
      />
    </>
  );
}
