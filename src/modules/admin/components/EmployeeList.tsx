'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import type { Employee } from '@/modules/admin/types';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

const PAGE_SIZE = 9;

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
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter((e) => {
      return (
        e.name.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        (e.position ?? '').toLowerCase().includes(q)
      );
    });
  }, [employees, query]);

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
        subtitle={`${employees.length} total`}
        right={
          <div className="w-44">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search..."
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
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-100">
                        {employee.name}
                      </div>
                      <div className="text-xs text-slate-400">{employee.email}</div>
                    </div>
                    <div className="rounded-full bg-slate-800/90 px-2.5 py-1 text-[11px] font-medium text-sky-300 ring-1 ring-inset ring-slate-700">
                      {employee.position || 'No position'}
                    </div>
                  </div>
                </button>
              );
            })}
            {filtered.length === 0 ? (
              <div className="rounded-xl bg-slate-900/80 px-3 py-4 text-sm text-slate-400 ring-1 ring-inset ring-slate-800">
                No employees match your search.
              </div>
            ) : null}
            {filtered.length > 0 ? (
              <div className="flex items-center justify-between gap-3 border-t border-slate-800/80 pt-3">
                <div className="text-xs text-slate-500">
                  Showing {(currentPage - 1) * PAGE_SIZE + 1}-{Math.min(currentPage * PAGE_SIZE, filtered.length)} of{' '}
                  {filtered.length}
                </div>
                {totalPages > 1 ? (
                  <div className="flex items-center gap-2">
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
