'use client';

import { useMemo, useState } from 'react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import {
  attendanceStatusClass,
  attendanceStatusLabel,
  type AttendanceStatus,
} from '@/modules/attendance/types';
import type { Employee } from '@/modules/admin/types';

const attendanceStatusOptions: Array<{
  value: AttendanceStatus;
  description: string;
}> = [
  { value: 'present', description: 'Completed the full working day.' },
  { value: 'absent', description: 'Did not report to work for the day.' },
  { value: 'half-day', description: 'Worked only part of the scheduled shift.' },
  { value: 'leave', description: 'Was away on approved leave.' },
];

function AttendanceStatusIcon({ status }: { status: AttendanceStatus }) {
  switch (status) {
    case 'present':
      return (
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="h-4 w-4">
          <path
            d="M5 10.5L8.2 13.5L15 6.5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'absent':
      return (
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="h-4 w-4">
          <path
            d="M6.5 6.5L13.5 13.5M13.5 6.5L6.5 13.5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'half-day':
      return (
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="h-4 w-4">
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
    case 'leave':
      return (
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="h-4 w-4">
          <path
            d="M10 4.5V15.5M4.5 10H15.5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );
  }
}

export function AttendanceForm({
  employee,
  onSave,
  isSaving,
}: {
  employee: Employee;
  onSave: (input: { date: string; status: AttendanceStatus; notes?: string }) => Promise<void>;
  isSaving: boolean;
}) {
  const today = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [date, setDate] = useState(today);
  const [status, setStatus] = useState<AttendanceStatus>('present');
  const [notes, setNotes] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({ date, status, notes: notes.trim() ? notes.trim() : undefined });
    setNotes('');
  };

  return (
    <Card>
      <CardHeader
        title="Set Attendance"
        subtitle={`For ${employee.name}${employee.position ? ` · ${employee.position}` : ''}`}
        right={
          <div className={['inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold', attendanceStatusClass(status)].join(' ')}>
            <AttendanceStatusIcon status={status} />
            {attendanceStatusLabel(status)}
          </div>
        }
      />
      <CardBody>
        <form onSubmit={submit} className="space-y-5">
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 ring-1 ring-inset ring-white/5">
            <div className="text-sm font-medium text-slate-200">Choose status</div>
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              {attendanceStatusOptions.map((option) => {
                const isSelected = status === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setStatus(option.value)}
                    className={[
                      'rounded-2xl border px-4 py-4 text-left transition-all',
                      'ring-1 ring-inset',
                      isSelected
                        ? `${attendanceStatusClass(option.value)} border-current/20 shadow-[0_12px_30px_rgba(2,8,23,0.22)]`
                        : 'border-slate-800/80 bg-slate-950/70 text-slate-300 ring-white/5 hover:border-slate-700 hover:bg-slate-900/90',
                    ].join(' ')}
                  >
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <AttendanceStatusIcon status={option.value} />
                      {attendanceStatusLabel(option.value)}
                    </div>
                    <div className="mt-2 text-xs leading-5 text-slate-400">{option.description}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 ring-1 ring-inset ring-white/5">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <div className="text-sm font-medium text-slate-300">Date</div>
                  <div className="mt-2">
                    <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                  </div>
                </div>
                <div className="rounded-xl bg-slate-950/80 px-4 py-3 ring-1 ring-inset ring-slate-800">
                  <div className="text-xs font-semibold uppercase tracking-wide text-sky-300">Employee</div>
                  <div className="mt-2 text-sm font-medium text-slate-100">{employee.name}</div>
                  <div className="mt-1 text-xs text-slate-400">{employee.position || 'No position set'}</div>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 ring-1 ring-inset ring-white/5">
              <div className="text-sm font-medium text-slate-300">Notes</div>
              <div className="mt-2">
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional details for this attendance update"
                />
              </div>
              <div className="mt-3 text-xs leading-5 text-slate-500">
                Add a short note when the status needs extra context, such as leave reason or late
                arrival details.
              </div>
            </div>
          </div>
          <div className="flex items-center justify-end">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
