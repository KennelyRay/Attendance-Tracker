'use client';

import { ReactNode, useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Table, TBody, TD, TH, THead } from '@/components/ui/Table';
import type {
  CreateEmployeeInput,
  Employee,
  UpdateEmployeeAccountInput,
  UpdateEmployeeAccessInput,
} from '@/modules/admin/types';
import { employeeAccountStatus } from '@/modules/admin/types';

const restrictionOptions = [
  { label: '1 day', hours: 24 },
  { label: '3 days', hours: 72 },
  { label: '7 days', hours: 168 },
  { label: '30 days', hours: 720 },
] as const;

function accountStatusClass(employee: Employee) {
  const status = employeeAccountStatus(employee);

  switch (status) {
    case 'banned':
      return 'bg-rose-500/12 text-rose-300 ring-1 ring-inset ring-rose-400/20';
    case 'restricted':
      return 'bg-amber-500/12 text-amber-300 ring-1 ring-inset ring-amber-400/20';
    default:
      return 'bg-emerald-500/12 text-emerald-300 ring-1 ring-inset ring-emerald-400/20';
  }
}

function accountStatusLabel(employee: Employee) {
  return employeeAccountStatus(employee).replace('-', ' ');
}

function StatusIcon({ status, className = '' }: { status: 'active' | 'restricted' | 'banned'; className?: string }) {
  if (status === 'active') {
    return (
      <svg
        viewBox="0 0 20 20"
        fill="none"
        aria-hidden="true"
        className={['h-4 w-4', className].join(' ')}
      >
        <path
          d="M5 10.5L8.2 13.5L15 6.5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (status === 'restricted') {
    return (
      <svg
        viewBox="0 0 20 20"
        fill="none"
        aria-hidden="true"
        className={['h-4 w-4', className].join(' ')}
      >
        <path
          d="M10 5.5V10L12.8 11.7"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="10" cy="10" r="6.25" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      className={['h-4 w-4', className].join(' ')}
    >
      <path
        d="M6.5 8.5V6.8C6.5 4.9 8 3.5 10 3.5C12 3.5 13.5 4.9 13.5 6.8V8.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <rect x="5" y="8.5" width="10" height="8" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M10 11.5V13.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ConfirmationModal({
  isOpen,
  title,
  description,
  confirmLabel,
  confirmVariant = 'primary',
  isSubmitting,
  onCancel,
  onConfirm,
  children,
}: {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  confirmVariant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  isSubmitting: boolean;
  onCancel: () => void;
  onConfirm: () => Promise<void> | void;
  children?: ReactNode;
}) {
  if (!isOpen) return null;

  return (
    <div className="app-overlay-scroll bg-slate-950/70 backdrop-blur-sm">
      <div className="app-overlay-panel max-w-md rounded-2xl border border-slate-800/80 bg-slate-950/95 p-6 shadow-[0_22px_60px_rgba(2,8,23,0.55)] ring-1 ring-inset ring-white/5">
        <div className="text-lg font-semibold text-slate-100">{title}</div>
        <div className="mt-2 text-sm leading-6 text-slate-400">{description}</div>
        {children ? <div className="mt-4">{children}</div> : null}
        <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end sm:gap-3">
          <Button className="w-full sm:w-auto" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button className="w-full sm:w-auto" variant={confirmVariant} onClick={onConfirm} disabled={isSubmitting}>
            {isSubmitting ? 'Please wait...' : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

function FeedbackModal({
  isOpen,
  title,
  description,
  onClose,
}: {
  isOpen: boolean;
  title: string;
  description: string;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="app-overlay-scroll bg-slate-950/70 backdrop-blur-sm">
      <div className="app-overlay-panel max-w-md rounded-2xl border border-slate-800/80 bg-slate-950/95 p-6 shadow-[0_22px_60px_rgba(2,8,23,0.55)] ring-1 ring-inset ring-white/5">
        <div className="text-lg font-semibold text-slate-100">{title}</div>
        <div className="mt-2 text-sm leading-6 text-slate-400">{description}</div>
        <div className="mt-6 flex justify-end">
          <Button className="w-full sm:w-auto" onClick={onClose}>OK</Button>
        </div>
      </div>
    </div>
  );
}

export function AccountManagementPanel({
  accounts,
  onCreate,
  onUpdateAccount,
  onUpdateAccess,
  onDelete,
}: {
  accounts: Employee[];
  onCreate: (input: CreateEmployeeInput) => Promise<void>;
  onUpdateAccount: (input: UpdateEmployeeAccountInput) => Promise<void>;
  onUpdateAccess: (input: UpdateEmployeeAccessInput) => Promise<void>;
  onDelete: (userId: number) => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [position, setPosition] = useState('');
  const [startDate, setStartDate] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [busyAccountId, setBusyAccountId] = useState<number | null>(null);
  const [restrictionHoursByUser, setRestrictionHoursByUser] = useState<Record<number, string>>({});
  const [pendingCreate, setPendingCreate] = useState<CreateEmployeeInput | null>(null);
  const [pendingEdit, setPendingEdit] = useState<Employee | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Employee | null>(null);
  const [feedbackModal, setFeedbackModal] = useState<{ title: string; description: string } | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editCompany, setEditCompany] = useState('');
  const [editPosition, setEditPosition] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'restricted' | 'banned'>('all');

  const filteredAccounts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return [...accounts]
      .filter((account) => {
        const status = employeeAccountStatus(account);
        if (statusFilter !== 'all' && status !== statusFilter) {
          return false;
        }

        if (!normalizedQuery) {
          return true;
        }

        return [
          account.name,
          account.email,
          account.company || '',
          account.position || '',
          status,
        ].some((value) => value.toLowerCase().includes(normalizedQuery));
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [accounts, query, statusFilter]);

  const statusSummary = useMemo(
    () =>
      accounts.reduce(
        (totals, account) => {
          totals[employeeAccountStatus(account)] += 1;
          return totals;
        },
        {
          active: 0,
          restricted: 0,
          banned: 0,
        }
      ),
    [accounts]
  );

  const createAccount = async (input: CreateEmployeeInput) => {
    setError(null);
    setFeedbackModal(null);
    setIsCreating(true);

    try {
      await onCreate(input);
      setName('');
      setEmail('');
      setCompany('');
      setPosition('');
      setStartDate('');
      setPassword('');
      setPendingCreate(null);
      setFeedbackModal({
        title: 'Account Created',
        description: `The account for ${input.name} is now available in the employee list.`,
      });
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Failed to create account');
    } finally {
      setIsCreating(false);
    }
  };

  const submitCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setFeedbackModal(null);
    setPendingCreate({
      name: name.trim(),
      email: email.trim(),
      company: company.trim(),
      position: position.trim(),
      startDate,
      password,
    });
  };

  const openEditModal = (account: Employee) => {
    setError(null);
    setFeedbackModal(null);
    setPendingEdit(account);
    setEditName(account.name);
    setEditEmail(account.email);
    setEditCompany(account.company ?? '');
    setEditPosition(account.position ?? '');
    setEditStartDate(account.start_date);
    setEditPassword('');
  };

  const saveEditedAccount = async () => {
    if (!pendingEdit) return;

    if (editPassword && editPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setError(null);
    setFeedbackModal(null);
    setBusyAccountId(pendingEdit.id);

    try {
      await onUpdateAccount({
        userId: pendingEdit.id,
        name: editName.trim(),
        email: editEmail.trim(),
        company: editCompany.trim(),
        position: editPosition.trim(),
        startDate: editStartDate,
        password: editPassword || undefined,
      });
      const passwordWasUpdated = Boolean(editPassword);
      setPendingEdit(null);
      setEditPassword('');
      setFeedbackModal({
        title: 'Account Updated',
        description: passwordWasUpdated
          ? `${editName.trim()} has been updated successfully, including a new password.`
          : `${editName.trim()} has been updated successfully.`,
      });
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Failed to update account');
    } finally {
      setBusyAccountId(null);
    }
  };

  const runAccountAction = async (
    userId: number,
    action: () => Promise<void>,
    successTitle: string,
    successDescription: string
  ) => {
    setError(null);
    setFeedbackModal(null);
    setBusyAccountId(userId);

    try {
      await action();
      setFeedbackModal({
        title: successTitle,
        description: successDescription,
      });
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Failed to update account');
    } finally {
      setBusyAccountId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.5fr_0.9fr]">
        <Card>
          <CardHeader
            title="Create Employee Account"
            subtitle="Add a new employee account and make it available immediately in the dashboard."
          />
          <CardBody>
            <form onSubmit={submitCreate} className="space-y-3.5 sm:space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <div className="text-sm font-medium text-slate-300">Name</div>
                  <div className="mt-1">
                    <Input
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="Employee name"
                      required
                    />
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-300">Email</div>
                  <div className="mt-1">
                    <Input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="employee@company.com"
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <div className="text-sm font-medium text-slate-300">Company</div>
                  <div className="mt-1">
                    <Input
                      value={company}
                      onChange={(event) => setCompany(event.target.value)}
                      placeholder="e.g. Head Office"
                      required
                    />
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-300">Position</div>
                  <div className="mt-1">
                    <Input
                      value={position}
                      onChange={(event) => setPosition(event.target.value)}
                      placeholder="e.g. Team Lead"
                      required
                    />
                  </div>
                </div>
              </div>
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
                <div className="text-sm font-medium text-slate-300">Password</div>
                <div className="mt-1">
                  <Input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="At least 6 characters"
                    required
                    minLength={6}
                  />
                </div>
              </div>
              {error ? (
                <div className="rounded-xl bg-rose-500/10 px-4 py-3 text-sm text-rose-300 ring-1 ring-inset ring-rose-400/20">
                  {error}
                </div>
              ) : null}
              <div className="flex items-center justify-end">
                <Button className="w-full sm:w-auto" type="submit" disabled={isCreating}>
                  {isCreating ? 'Creating...' : 'Add Employee'}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Access Rules"
            subtitle="Quick reference for how account controls work."
          />
          <CardBody>
            <div className="space-y-3 sm:space-y-4">
              <div className="rounded-xl bg-slate-900/80 px-4 py-3.5 ring-1 ring-inset ring-slate-800 sm:py-4">
                <div className="text-sm font-semibold text-slate-100">Restrict</div>
                <div className="mt-1 text-sm leading-6 text-slate-400">
                  Temporarily blocks login for the selected duration. Access automatically returns
                  when the restriction expires.
                </div>
              </div>
              <div className="rounded-xl bg-slate-900/80 px-4 py-3.5 ring-1 ring-inset ring-slate-800 sm:py-4">
                <div className="text-sm font-semibold text-slate-100">Ban</div>
                <div className="mt-1 text-sm leading-6 text-slate-400">
                  Permanently blocks login until an admin restores the account.
                </div>
              </div>
              <div className="rounded-xl bg-slate-900/80 px-4 py-3.5 ring-1 ring-inset ring-slate-800 sm:py-4">
                <div className="text-sm font-semibold text-slate-100">Remove</div>
                <div className="mt-1 text-sm leading-6 text-slate-400">
                  Permanently deletes the employee account and any linked attendance records.
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {accounts.length === 0 ? (
        <EmptyState
          title="No employee accounts"
          description="Create an employee account to manage access and attendance."
        />
      ) : (
        <Card>
          <CardHeader
            title="Employee Accounts"
            subtitle={`${filteredAccounts.length} employee account(s) shown with live access controls`}
          />
          <CardBody>
            <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-slate-900/80 px-4 py-3 ring-1 ring-inset ring-slate-800">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-emerald-300">
                  Active
                </div>
                <div className="mt-2 text-2xl font-semibold text-slate-50">{statusSummary.active}</div>
              </div>
              <div className="rounded-xl bg-slate-900/80 px-4 py-3 ring-1 ring-inset ring-slate-800">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-amber-300">
                  Restricted
                </div>
                <div className="mt-2 text-2xl font-semibold text-slate-50">{statusSummary.restricted}</div>
              </div>
              <div className="rounded-xl bg-slate-900/80 px-4 py-3 ring-1 ring-inset ring-slate-800">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-rose-300">
                  Banned
                </div>
                <div className="mt-2 text-2xl font-semibold text-slate-50">{statusSummary.banned}</div>
              </div>
            </div>

            <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_180px]">
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by employee, email, company, position, or status..."
              />
              <Select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as 'all' | 'active' | 'restricted' | 'banned')
                }
              >
                <option value="all">All status</option>
                <option value="active">Active</option>
                <option value="restricted">Restricted</option>
                <option value="banned">Banned</option>
              </Select>
            </div>

            {filteredAccounts.length === 0 ? (
              <div className="rounded-xl bg-slate-900/80 px-4 py-8 text-center text-sm text-slate-400 ring-1 ring-inset ring-slate-800">
                No employee accounts match the current search or status filter.
              </div>
            ) : null}

            <div className="space-y-4 md:hidden">
              {filteredAccounts.map((account) => {
                const status = employeeAccountStatus(account);
                const restrictionHours = restrictionHoursByUser[account.id] ?? String(restrictionOptions[0].hours);
                const isBusy = busyAccountId === account.id;

                return (
                  <div
                    key={account.id}
                    className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-3.5 ring-1 ring-inset ring-white/5 sm:p-4"
                  >
                    <div className="flex flex-col gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-100">{account.name}</div>
                        <div className="mt-1 break-all text-xs text-slate-400">{account.email}</div>
                      </div>
                      <div className="grid grid-cols-1 gap-3">
                        <div>
                          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Company</div>
                          <div className="mt-1 text-sm text-slate-300">{account.company || 'Not set'}</div>
                        </div>
                        <div>
                          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Position</div>
                          <div className="mt-1 text-sm text-slate-300">{account.position || 'Not set'}</div>
                        </div>
                        <div>
                          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Start Date</div>
                          <div className="mt-1 text-sm text-slate-300">
                            {new Date(account.start_date).toLocaleDateString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Status</div>
                          <div className="mt-2">
                            <span
                              className={[
                                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold capitalize',
                                accountStatusClass(account),
                              ].join(' ')}
                            >
                              <StatusIcon status={status} />
                              {accountStatusLabel(account)}
                            </span>
                          </div>
                        </div>
                        <div>
                          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Access Until</div>
                          <div className="mt-1 text-sm text-slate-300">
                            {status === 'restricted' && account.restricted_until
                              ? new Date(account.restricted_until).toLocaleString()
                              : status === 'banned'
                                ? 'Permanent'
                                : 'Active'}
                          </div>
                        </div>
                        <div>
                          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Restrict For</div>
                          <div className="mt-2">
                            <Select
                              value={restrictionHours}
                              onChange={(event) =>
                                setRestrictionHoursByUser((current) => ({
                                  ...current,
                                  [account.id]: event.target.value,
                                }))
                              }
                              disabled={isBusy}
                            >
                              {restrictionOptions.map((option) => (
                                <option key={option.hours} value={option.hours}>
                                  {option.label}
                                </option>
                              ))}
                            </Select>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-2 min-[380px]:grid-cols-2">
                        <Button variant="secondary" size="sm" disabled={isBusy} onClick={() => openEditModal(account)}>
                          Edit
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={isBusy}
                          onClick={() =>
                            runAccountAction(
                              account.id,
                              () =>
                                onUpdateAccess({
                                  userId: account.id,
                                  action: 'restrict',
                                  durationHours: Number(restrictionHours),
                                }),
                              'Account Restricted',
                              `${account.name} is now temporarily restricted from logging in.`
                            )
                          }
                        >
                          Restrict
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={isBusy || status === 'active'}
                          onClick={() =>
                            runAccountAction(
                              account.id,
                              () =>
                                onUpdateAccess({
                                  userId: account.id,
                                  action: 'restore',
                                }),
                              'Access Restored',
                              `${account.name} can now log in again.`
                            )
                          }
                        >
                          Restore
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          disabled={isBusy || status === 'banned'}
                          onClick={() =>
                            runAccountAction(
                              account.id,
                              () =>
                                onUpdateAccess({
                                  userId: account.id,
                                  action: 'ban',
                                }),
                              'Account Banned',
                              `${account.name} has been permanently blocked from logging in.`
                            )
                          }
                        >
                          Ban
                        </Button>
                        <Button
                          className="min-[380px]:col-span-2"
                          variant="ghost"
                          size="sm"
                          disabled={isBusy}
                          onClick={() => setPendingDelete(account)}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className={filteredAccounts.length === 0 ? 'hidden' : 'hidden md:block'}>
              <Table>
                <THead>
                  <tr>
                    <TH>Employee</TH>
                    <TH>Company</TH>
                    <TH>Position</TH>
                    <TH>Start Date</TH>
                    <TH>Status</TH>
                    <TH>Access Until</TH>
                    <TH>Restrict For</TH>
                    <TH>Actions</TH>
                  </tr>
                </THead>
                <TBody>
                  {filteredAccounts.map((account) => {
                    const status = employeeAccountStatus(account);
                    const restrictionHours = restrictionHoursByUser[account.id] ?? String(restrictionOptions[0].hours);
                    const isBusy = busyAccountId === account.id;

                    return (
                      <tr key={account.id} className="transition-colors hover:bg-slate-900/90">
                        <TD>
                          <div className="font-medium text-slate-100">{account.name}</div>
                          <div className="mt-1 text-xs text-slate-400">{account.email}</div>
                        </TD>
                        <TD className="whitespace-nowrap text-slate-300">
                          {account.company || 'Not set'}
                        </TD>
                        <TD className="whitespace-nowrap text-slate-300">
                          {account.position || 'Not set'}
                        </TD>
                        <TD className="whitespace-nowrap text-slate-300">
                          {new Date(account.start_date).toLocaleDateString()}
                        </TD>
                        <TD className="whitespace-nowrap">
                          <span
                            className={[
                              'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold capitalize',
                              accountStatusClass(account),
                            ].join(' ')}
                          >
                            <StatusIcon status={status} />
                            {accountStatusLabel(account)}
                          </span>
                        </TD>
                        <TD className="whitespace-nowrap text-slate-400">
                          {status === 'restricted' && account.restricted_until
                            ? new Date(account.restricted_until).toLocaleString()
                            : status === 'banned'
                              ? 'Permanent'
                              : 'Active'}
                        </TD>
                        <TD className="min-w-36">
                          <Select
                            value={restrictionHours}
                            onChange={(event) =>
                              setRestrictionHoursByUser((current) => ({
                                ...current,
                                [account.id]: event.target.value,
                              }))
                            }
                            disabled={isBusy}
                          >
                            {restrictionOptions.map((option) => (
                              <option key={option.hours} value={option.hours}>
                                {option.label}
                              </option>
                            ))}
                          </Select>
                        </TD>
                        <TD>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              disabled={isBusy}
                              onClick={() => openEditModal(account)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              disabled={isBusy}
                              onClick={() =>
                                runAccountAction(
                                  account.id,
                                  () =>
                                    onUpdateAccess({
                                      userId: account.id,
                                      action: 'restrict',
                                      durationHours: Number(restrictionHours),
                                    }),
                                  'Account Restricted',
                                  `${account.name} is now temporarily restricted from logging in.`
                                )
                              }
                            >
                              Restrict
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              disabled={isBusy || status === 'active'}
                              onClick={() =>
                                runAccountAction(
                                  account.id,
                                  () =>
                                    onUpdateAccess({
                                      userId: account.id,
                                      action: 'restore',
                                    }),
                                  'Access Restored',
                                  `${account.name} can now log in again.`
                                )
                              }
                            >
                              Restore
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              disabled={isBusy || status === 'banned'}
                              onClick={() =>
                                runAccountAction(
                                  account.id,
                                  () =>
                                    onUpdateAccess({
                                      userId: account.id,
                                      action: 'ban',
                                    }),
                                  'Account Banned',
                                  `${account.name} has been permanently blocked from logging in.`
                                )
                              }
                            >
                              Ban
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={isBusy}
                              onClick={() => setPendingDelete(account)}
                            >
                              Remove
                            </Button>
                          </div>
                        </TD>
                      </tr>
                    );
                  })}
                </TBody>
              </Table>
            </div>
          </CardBody>
        </Card>
      )}

      <ConfirmationModal
        isOpen={Boolean(pendingCreate)}
        title="Create Employee Account"
        description="Please confirm that you want to create this employee account."
        confirmLabel="Create Account"
        isSubmitting={isCreating}
        onCancel={() => {
          if (!isCreating) {
            setPendingCreate(null);
          }
        }}
        onConfirm={async () => {
          if (!pendingCreate) return;
          await createAccount(pendingCreate);
        }}
      >
        {pendingCreate ? (
          <div className="rounded-xl bg-slate-900/80 px-4 py-4 ring-1 ring-inset ring-slate-800">
            <div className="text-sm text-slate-300">
              <span className="font-medium text-slate-100">Name:</span> {pendingCreate.name}
            </div>
            <div className="mt-2 text-sm text-slate-300">
              <span className="font-medium text-slate-100">Email:</span> {pendingCreate.email}
            </div>
            <div className="mt-2 text-sm text-slate-300">
              <span className="font-medium text-slate-100">Company:</span> {pendingCreate.company}
            </div>
            <div className="mt-2 text-sm text-slate-300">
              <span className="font-medium text-slate-100">Position:</span> {pendingCreate.position}
            </div>
            <div className="mt-2 text-sm text-slate-300">
              <span className="font-medium text-slate-100">Start Date:</span>{' '}
              {new Date(pendingCreate.startDate).toLocaleDateString()}
            </div>
          </div>
        ) : null}
      </ConfirmationModal>

      <ConfirmationModal
        isOpen={Boolean(pendingEdit)}
        title="Edit Employee Account"
        description="Update the employee details below."
        confirmLabel="Save Changes"
        isSubmitting={busyAccountId === pendingEdit?.id}
        onCancel={() => {
          if (busyAccountId !== pendingEdit?.id) {
            setPendingEdit(null);
            setEditPassword('');
            setError(null);
          }
        }}
        onConfirm={saveEditedAccount}
      >
        {pendingEdit ? (
          <div className="space-y-4">
            <div>
              <div className="text-sm font-medium text-slate-300">Name</div>
              <div className="mt-1">
                <Input
                  value={editName}
                  onChange={(event) => setEditName(event.target.value)}
                  placeholder="Employee name"
                  required
                />
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-slate-300">Email</div>
              <div className="mt-1">
                <Input
                  type="email"
                  value={editEmail}
                  onChange={(event) => setEditEmail(event.target.value)}
                  placeholder="employee@company.com"
                  required
                />
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-slate-300">Company</div>
              <div className="mt-1">
                <Input
                  value={editCompany}
                  onChange={(event) => setEditCompany(event.target.value)}
                  placeholder="e.g. Head Office"
                  required
                />
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-slate-300">Position</div>
              <div className="mt-1">
                <Input
                  value={editPosition}
                  onChange={(event) => setEditPosition(event.target.value)}
                  placeholder="e.g. Team Lead"
                  required
                />
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-slate-300">Start Date</div>
              <div className="mt-1">
                <Input
                  type="date"
                  value={editStartDate}
                  onChange={(event) => setEditStartDate(event.target.value)}
                  required
                />
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-slate-300">New Password</div>
              <div className="mt-1">
                <Input
                  type="password"
                  value={editPassword}
                  onChange={(event) => setEditPassword(event.target.value)}
                  placeholder="Leave blank to keep the current password"
                  minLength={6}
                />
              </div>
              <div className="mt-1 text-xs leading-5 text-slate-500">
                Leave this blank if the employee should keep the existing password.
              </div>
            </div>
            {error ? (
              <div className="rounded-xl bg-rose-500/10 px-4 py-3 text-sm text-rose-300 ring-1 ring-inset ring-rose-400/20">
                {error}
              </div>
            ) : null}
          </div>
        ) : null}
      </ConfirmationModal>

      <ConfirmationModal
        isOpen={Boolean(pendingDelete)}
        title="Remove Employee Account"
        description="This will permanently remove the employee account and its related attendance records. This action cannot be undone."
        confirmLabel="Remove Account"
        confirmVariant="danger"
        isSubmitting={busyAccountId === pendingDelete?.id}
        onCancel={() => {
          if (busyAccountId !== pendingDelete?.id) {
            setPendingDelete(null);
          }
        }}
        onConfirm={async () => {
          if (!pendingDelete) return;
          await runAccountAction(
            pendingDelete.id,
            async () => {
              await onDelete(pendingDelete.id);
              setPendingDelete(null);
            },
            'Account Removed',
            `${pendingDelete.name}'s account has been deleted from the system.`
          );
        }}
      >
        {pendingDelete ? (
          <div className="rounded-xl bg-slate-900/80 px-4 py-4 ring-1 ring-inset ring-slate-800">
            <div className="text-sm text-slate-300">
              <span className="font-medium text-slate-100">Employee:</span> {pendingDelete.name}
            </div>
            <div className="mt-2 text-sm text-slate-300">
              <span className="font-medium text-slate-100">Email:</span> {pendingDelete.email}
            </div>
          </div>
        ) : null}
      </ConfirmationModal>

      <FeedbackModal
        isOpen={Boolean(feedbackModal)}
        title={feedbackModal?.title ?? ''}
        description={feedbackModal?.description ?? ''}
        onClose={() => setFeedbackModal(null)}
      />
    </div>
  );
}
