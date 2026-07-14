'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import type { Employee } from '@/modules/admin/types';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

const PAGE_SIZE = 9;
const UNASSIGNED = '__unassigned__';

type ViolationFilter = 'all' | 'with-violations' | 'open-cases' | 'no-violations';

export function EmployeeList({
  employees,
  selectedEmployeeId,
  onSelect,
  isLoading,
}: {
  employees: Employee[];
  selectedEmployeeId: number | null;
  onSelect: (employee: Employee) => void;
  isLoading: boolean;
}) {
  const [query, setQuery] = useState('');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [positionFilter, setPositionFilter] = useState('all');
  const [violationFilter, setViolationFilter] = useState<ViolationFilter>('all');
  const [page, setPage] = useState(1);

  const companies = useMemo(
    () =>
      Array.from(
        new Set(employees.map((employee) => employee.company?.trim()).filter(Boolean) as string[])
      ).sort((a, b) => a.localeCompare(b)),
    [employees]
  );

  const positions = useMemo(
    () =>
      Array.from(
        new Set(employees.map((employee) => employee.position?.trim()).filter(Boolean) as string[])
      ).sort((a, b) => a.localeCompare(b)),
    [employees]
  );

  const hasActiveFilters =
    query.trim() !== '' ||
    companyFilter !== 'all' ||
    positionFilter !== 'all' ||
    violationFilter !== 'all';

  const resetFilters = () => {
    setQuery('');
    setCompanyFilter('all');
    setPositionFilter('all');
    setViolationFilter('all');
    setPage(1);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return employees.filter((e) => {
      if (companyFilter !== 'all') {
        const company = e.company?.trim() || '';
        if (companyFilter === UNASSIGNED ? company !== '' : company !== companyFilter) {
          return false;
        }
      }

      if (positionFilter !== 'all') {
        const position = e.position?.trim() || '';
        if (positionFilter === UNASSIGNED ? position !== '' : position !== positionFilter) {
          return false;
        }
      }

      if (violationFilter === 'with-violations' && !(e.violation_count > 0)) {
        return false;
      }

      if (violationFilter === 'open-cases' && !(e.open_violation_count > 0)) {
        return false;
      }

      if (violationFilter === 'no-violations' && e.violation_count > 0) {
        return false;
      }

      if (!q) return true;

      return (
        e.name.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        (e.company ?? '').toLowerCase().includes(q) ||
        (e.position ?? '').toLowerCase().includes(q)
      );
    });
  }, [companyFilter, employees, positionFilter, query, violationFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  const pagedEmployees = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [currentPage, filtered]);

  return (
    <Card>
      <CardHeader
        title="Employees"
        subtitle={
          hasActiveFilters ? `${filtered.length} of ${employees.length} shown` : `${employees.length} total`
        }
        right={
          <div className="w-full sm:w-44">
            <Input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search name, email, company..."
              aria-label="Search employees"
            />
          </div>
        }
      />
      <CardBody>
        {isLoading ? (
          <div className="space-y-3">
            <div className="h-10 rounded-xl bg-slate-900/80 ring-1 ring-inset ring-slate-800" />
            <div className="h-10 rounded-xl bg-slate-900/80 ring-1 ring-inset ring-slate-800" />
            <div className="h-10 rounded-xl bg-slate-900/80 ring-1 ring-inset ring-slate-800" />
          </div>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-1 gap-2 pb-1 min-[400px]:grid-cols-2 xl:grid-cols-3">
              <Select
                value={companyFilter}
                onChange={(event) => {
                  setCompanyFilter(event.target.value);
                  setPage(1);
                }}
                aria-label="Filter by company"
              >
                <option value="all">All companies</option>
                {companies.map((company) => (
                  <option key={company} value={company}>
                    {company}
                  </option>
                ))}
                <option value={UNASSIGNED}>Unassigned company</option>
              </Select>
              <Select
                value={positionFilter}
                onChange={(event) => {
                  setPositionFilter(event.target.value);
                  setPage(1);
                }}
                aria-label="Filter by position"
              >
                <option value="all">All positions</option>
                {positions.map((position) => (
                  <option key={position} value={position}>
                    {position}
                  </option>
                ))}
                <option value={UNASSIGNED}>No position set</option>
              </Select>
              <Select
                value={violationFilter}
                onChange={(event) => {
                  setViolationFilter(event.target.value as ViolationFilter);
                  setPage(1);
                }}
                aria-label="Filter by violations"
              >
                <option value="all">All violations</option>
                <option value="with-violations">With violations</option>
                <option value="open-cases">With open cases</option>
                <option value="no-violations">No violations</option>
              </Select>
            </div>
            {hasActiveFilters ? (
              <div className="flex justify-end pb-1">
                <Button variant="ghost" size="sm" onClick={resetFilters}>
                  Reset Filters
                </Button>
              </div>
            ) : null}
            {pagedEmployees.map((employee) => {
              const isSelected = selectedEmployeeId === employee.id;
              return (
                <button
                  key={employee.id}
                  type="button"
                  onClick={() => onSelect(employee)}
                  className={[
                    'w-full rounded-lg px-3 py-2 text-left transition-colors',
                    'ring-1 ring-inset',
                    isSelected
                      ? 'bg-sky-500/12 ring-sky-400/30 shadow-[0_10px_24px_rgba(34,211,238,0.08)]'
                      : 'bg-slate-900/80 ring-slate-800 hover:bg-slate-900',
                  ].join(' ')}
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="text-sm font-semibold text-slate-100">
                        {employee.name}
                      </div>
                      <div className="break-all text-xs text-slate-400">{employee.email}</div>
                      <div className="mt-1 text-[11px] font-medium text-cyan-300">
                        {employee.company || 'Unassigned company'}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 sm:flex-col sm:items-end">
                      <div className="self-start rounded-full bg-slate-800/90 px-2.5 py-1 text-[10px] font-medium text-sky-300 ring-1 ring-inset ring-slate-700 sm:self-auto sm:text-[11px]">
                        {employee.position || 'No position'}
                      </div>
                      {employee.open_violation_count > 0 ? (
                        <div className="self-start rounded-full bg-rose-500/12 px-2.5 py-1 text-[10px] font-semibold text-rose-300 ring-1 ring-inset ring-rose-400/20 sm:self-auto sm:text-[11px]">
                          {employee.open_violation_count} open case
                          {employee.open_violation_count === 1 ? '' : 's'}
                        </div>
                      ) : employee.violation_count > 0 ? (
                        <div className="self-start rounded-full bg-slate-800/90 px-2.5 py-1 text-[10px] font-medium text-slate-300 ring-1 ring-inset ring-slate-700 sm:self-auto sm:text-[11px]">
                          {employee.violation_count} violation
                          {employee.violation_count === 1 ? '' : 's'}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </button>
              );
            })}
            {filtered.length === 0 ? (
              <div className="rounded-xl bg-slate-900/80 px-3 py-4 text-sm text-slate-400 ring-1 ring-inset ring-slate-800">
                No employees match the current filters.
              </div>
            ) : null}
            {filtered.length > 0 ? (
              <div className="flex flex-col gap-3 border-t border-slate-800/80 pt-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-[11px] text-slate-500 sm:text-xs">
                  Showing {(currentPage - 1) * PAGE_SIZE + 1}-{Math.min(currentPage * PAGE_SIZE, filtered.length)} of{' '}
                  {filtered.length}
                </div>
                {totalPages > 1 ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={currentPage === 1}
                      onClick={() => setPage((current) => Math.max(1, current - 1))}
                    >
                      Previous
                    </Button>
                    <div className="text-xs font-medium text-slate-400">
                      Page {currentPage} / {totalPages}
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={currentPage === totalPages}
                      onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                    >
                      Next
                    </Button>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
