'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import type {
  AdminViolationRecord,
  CreateViolationInput,
  Employee,
  ViolationCaseStatus,
  ViolationSeverity,
} from '@/modules/admin/types';

const severityOptions: Array<{ value: ViolationSeverity; label: string }> = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

const statusOptions: Array<{ value: ViolationCaseStatus; label: string }> = [
  { value: 'open', label: 'Open' },
  { value: 'under-review', label: 'Under Review' },
  { value: 'resolved', label: 'Resolved' },
];

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

function todayDateOnly() {
  return new Date().toISOString().slice(0, 10);
}

export function NewViolationPanel({
  employees,
  violations,
  isLoading,
  error,
  onCreate,
  onRefresh,
}: {
  employees: Employee[];
  violations: AdminViolationRecord[];
  isLoading: boolean;
  error: string | null;
  onCreate: (input: CreateViolationInput) => Promise<void>;
  onRefresh: () => Promise<void>;
}) {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(employees[0]?.id ? String(employees[0].id) : '');
  const [violationType, setViolationType] = useState('');
  const [company, setCompany] = useState(employees[0]?.company ?? '');
  const [severity, setSeverity] = useState<ViolationSeverity>('medium');
  const [caseStatus, setCaseStatus] = useState<ViolationCaseStatus>('open');
  const [incidentDate, setIncidentDate] = useState(todayDateOnly());
  const [description, setDescription] = useState('');
  const [actionTaken, setActionTaken] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedEmployee = useMemo(
    () => employees.find((employee) => String(employee.id) === selectedEmployeeId) ?? null,
    [employees, selectedEmployeeId]
  );

  const employeeViolationHistory = useMemo(() => {
    if (!selectedEmployeeId) return [];
    return violations.filter((violation) => String(violation.user_id) === selectedEmployeeId).slice(0, 6);
  }, [selectedEmployeeId, violations]);

  const submit = async () => {
    setFormError(null);
    setFeedback(null);

    const userId = Number(selectedEmployeeId);
    if (!Number.isInteger(userId)) {
      setFormError('Please select an employee before recording a violation.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onCreate({
        userId,
        violationType: violationType.trim(),
        company: company.trim(),
        severity,
        caseStatus,
        incidentDate,
        description: description.trim(),
        actionTaken: actionTaken.trim(),
      });

      setViolationType('');
      setCompany('');
      setSeverity('medium');
      setCaseStatus('open');
      setIncidentDate(todayDateOnly());
      setDescription('');
      setActionTaken('');
      setFeedback('Violation case recorded successfully.');
    } catch (createError) {
      setFormError(
        createError instanceof Error ? createError.message : 'Failed to record violation case'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr]">
      <Card>
        <CardHeader
          title="Add Violation"
          subtitle="Log a new employee violation case and record the latest action taken."
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
          {formError ? (
            <div className="rounded-xl bg-rose-500/10 px-4 py-3 text-sm text-rose-300 ring-1 ring-inset ring-rose-400/20">
              {formError}
            </div>
          ) : null}
          {feedback ? (
            <div className="rounded-xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300 ring-1 ring-inset ring-emerald-400/20">
              {feedback}
            </div>
          ) : null}

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <div className="mb-2 text-sm font-medium text-slate-300">Employee</div>
              <Select
                value={selectedEmployeeId}
                onChange={(event) => {
                  const nextEmployeeId = event.target.value;
                  setSelectedEmployeeId(nextEmployeeId);
                  const nextEmployee =
                    employees.find((employee) => String(employee.id) === nextEmployeeId) ?? null;
                  setCompany(nextEmployee?.company ?? '');
                }}
              >
                {employees.length === 0 ? <option value="">No employees available</option> : null}
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name} - {employee.position || 'No position'}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <div className="mb-2 text-sm font-medium text-slate-300">Violation Type</div>
              <Input
                value={violationType}
                onChange={(event) => setViolationType(event.target.value)}
                placeholder="Late arrival, misconduct, insubordination..."
              />
            </div>

            <div>
              <div className="mb-2 text-sm font-medium text-slate-300">Company / Branch</div>
              <Input
                value={company}
                onChange={(event) => setCompany(event.target.value)}
                placeholder="Optional company or branch"
              />
            </div>

            <div>
              <div className="mb-2 text-sm font-medium text-slate-300">Severity</div>
              <Select value={severity} onChange={(event) => setSeverity(event.target.value as ViolationSeverity)}>
                {severityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <div className="mb-2 text-sm font-medium text-slate-300">Case Status</div>
              <Select value={caseStatus} onChange={(event) => setCaseStatus(event.target.value as ViolationCaseStatus)}>
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
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
                placeholder="Describe what happened and include the important case details."
              />
            </div>

            <div className="md:col-span-2">
              <div className="mb-2 text-sm font-medium text-slate-300">Action Taken</div>
              <textarea
                value={actionTaken}
                onChange={(event) => setActionTaken(event.target.value)}
                rows={3}
                className="w-full rounded-xl border border-slate-700/80 bg-slate-900/90 px-3 py-2.5 text-sm text-slate-100 shadow-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-400/70"
                placeholder="Optional follow-up, warning issued, coaching plan, or resolution note."
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button onClick={() => void submit()} disabled={isSubmitting || employees.length === 0}>
              {isSubmitting ? 'Saving...' : 'Record Violation'}
            </Button>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Employee Violation Record"
          subtitle={
            selectedEmployee
              ? `Recent violation history for ${selectedEmployee.name} from ${selectedEmployee.company || 'an unassigned company'}`
              : 'Select an employee to review recent violation history.'
          }
        />
        <CardBody>
          {!selectedEmployee ? (
            <EmptyState
              title="No employee selected"
              description="Choose an employee in the form to view their latest violation record."
            />
          ) : employeeViolationHistory.length === 0 ? (
            <EmptyState
              title="No violations on record"
              description="This employee does not have any recorded violation cases yet."
            />
          ) : (
            <div className="space-y-3">
              {employeeViolationHistory.map((violation) => (
                <div
                  key={violation.id}
                  className="rounded-2xl border border-slate-800/80 bg-slate-900/60 px-4 py-4 ring-1 ring-inset ring-white/5"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-sm font-semibold text-slate-100">{violation.violation_type}</div>
                    <span className="inline-flex rounded-full bg-slate-950/80 px-2.5 py-1 text-[11px] font-medium text-slate-300 ring-1 ring-inset ring-slate-800">
                      {new Date(violation.incident_date).toLocaleDateString()}
                    </span>
                    <span className="inline-flex rounded-full bg-cyan-500/10 px-2.5 py-1 text-[11px] font-semibold text-cyan-300 ring-1 ring-inset ring-cyan-400/20">
                      {violation.company || selectedEmployee.company || 'Unassigned company'}
                    </span>
                    <span
                      className={[
                        'inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium capitalize',
                        severityClass(violation.severity),
                      ].join(' ')}
                    >
                      {violation.severity}
                    </span>
                    <span className="inline-flex rounded-full bg-slate-950/80 px-2.5 py-1 text-[11px] font-medium capitalize text-slate-300 ring-1 ring-inset ring-slate-800">
                      {violation.case_status.replace('-', ' ')}
                    </span>
                  </div>
                  <div className="mt-2 text-sm leading-6 text-slate-400">{violation.description}</div>
                  {violation.action_taken ? (
                    <div className="mt-3 rounded-xl bg-slate-950/70 px-3 py-2.5 text-sm text-slate-300 ring-1 ring-inset ring-slate-800">
                      <span className="font-medium text-slate-100">Action:</span> {violation.action_taken}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
