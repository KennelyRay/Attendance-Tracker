'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { RefreshButton } from '@/components/ui/RefreshButton';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { createHoliday, deleteHoliday, fetchHolidays } from '@/modules/admin/api';
import { holidayTypeLabel, type Holiday, type HolidayType } from '@/modules/holidays/types';
import { formatDateOnly } from '@/modules/leave/utils';

function typeClass(type: HolidayType) {
  return type === 'regular'
    ? 'bg-sky-500/12 text-sky-300 ring-1 ring-inset ring-sky-400/25'
    : 'bg-violet-500/12 text-violet-300 ring-1 ring-inset ring-violet-400/25';
}

function weekdayOf(date: string) {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toLocaleDateString(undefined, { weekday: 'long' });
}

function isWeekendDate(date: string) {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return false;
  const day = parsed.getDay();
  return day === 0 || day === 6;
}

export function HolidayCalendarPanel() {
  const currentYear = new Date().getFullYear();

  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [year, setYear] = useState(currentYear);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [date, setDate] = useState('');
  const [name, setName] = useState('');
  const [holidayType, setHolidayType] = useState<HolidayType>('regular');
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<number | null>(null);

  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    let isStale = false;

    const load = async () => {
      try {
        const items = await fetchHolidays();
        if (isStale) return;
        setHolidays(items);
        setLoadError(null);
      } catch (error) {
        if (isStale) return;
        setLoadError(
          error instanceof Error ? error.message : 'Failed to load the holiday calendar'
        );
      } finally {
        if (!isStale) setIsLoading(false);
      }
    };

    void load();

    return () => {
      isStale = true;
    };
  }, [refreshToken]);

  const years = useMemo(() => {
    const seen = new Set<number>([currentYear]);
    for (const holiday of holidays) {
      const parsed = Number(holiday.date.slice(0, 4));
      if (Number.isInteger(parsed)) seen.add(parsed);
    }
    return [...seen].sort((left, right) => right - left);
  }, [holidays, currentYear]);

  const visible = useMemo(
    () => holidays.filter((holiday) => holiday.date.startsWith(String(year))),
    [holidays, year]
  );

  const onAdd = async () => {
    setFormError(null);
    setNotice(null);

    if (!date || !name.trim()) {
      setFormError('Enter both a date and a name for the holiday.');
      return;
    }

    setIsSaving(true);
    try {
      const created = await createHoliday({ date, name: name.trim(), holidayType });
      setHolidays((current) =>
        [...current, created].sort((left, right) => left.date.localeCompare(right.date))
      );
      setYear(Number(created.date.slice(0, 4)));
      setDate('');
      setName('');
      setNotice(`${created.name} added. Leave requests will no longer be charged for that day.`);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Failed to add the holiday');
    } finally {
      setIsSaving(false);
    }
  };

  const onRemove = async (holiday: Holiday) => {
    setFormError(null);
    setNotice(null);
    setRemovingId(holiday.id);
    try {
      await deleteHoliday(holiday.id);
      setHolidays((current) => current.filter((entry) => entry.id !== holiday.id));
      setNotice(`${holiday.name} removed from the calendar.`);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Failed to remove the holiday');
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Holiday Calendar"
          action={
            <RefreshButton
              onClick={() => setRefreshToken((token) => token + 1)}
              isLoading={isLoading}
            />
          }
        />
        <CardBody>
          <div className="rounded-2xl border border-sky-400/15 bg-sky-500/10 px-4 py-3 text-sm leading-6 text-sky-100 ring-1 ring-inset ring-sky-400/20">
            Fixed-date holidays are filled in automatically. Movable ones set by annual
            proclamation &mdash; Holy Week, Eid&rsquo;l Fitr, Eid&rsquo;l Adha, Chinese New Year
            &mdash; need to be added here each year.
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label htmlFor="holiday-date" className="text-sm font-medium text-slate-300">
                Date
              </label>
              <div className="mt-1">
                <Input
                  id="holiday-date"
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                />
              </div>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="holiday-name" className="text-sm font-medium text-slate-300">
                Name
              </label>
              <div className="mt-1">
                <Input
                  id="holiday-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="e.g. Maundy Thursday"
                  maxLength={160}
                />
              </div>
            </div>
            <div>
              <label htmlFor="holiday-type" className="text-sm font-medium text-slate-300">
                Type
              </label>
              <div className="mt-1">
                <Select
                  id="holiday-type"
                  value={holidayType}
                  onChange={(event) => setHolidayType(event.target.value as HolidayType)}
                >
                  <option value="regular">Regular holiday</option>
                  <option value="special">Special non-working</option>
                </Select>
              </div>
            </div>
          </div>

          {date && isWeekendDate(date) ? (
            <div className="mt-3 rounded-xl bg-slate-900/80 px-4 py-2.5 text-xs text-slate-400 ring-1 ring-inset ring-slate-800">
              That date falls on a weekend, which is already excluded from leave counts. Adding it
              is harmless but changes nothing.
            </div>
          ) : null}

          {formError ? (
            <div className="mt-3 rounded-xl bg-rose-500/10 px-4 py-3 text-sm text-rose-300 ring-1 ring-inset ring-rose-400/20">
              {formError}
            </div>
          ) : null}

          {notice ? (
            <div className="mt-3 rounded-xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300 ring-1 ring-inset ring-emerald-400/20">
              {notice}
            </div>
          ) : null}

          <div className="mt-4">
            <Button onClick={() => void onAdd()} disabled={isSaving} className="w-full sm:w-auto">
              {isSaving ? 'Adding…' : 'Add holiday'}
            </Button>
          </div>
        </CardBody>
      </Card>

      {loadError ? (
        <div className="rounded-xl bg-rose-500/10 px-4 py-3 text-sm text-rose-300 ring-1 ring-inset ring-rose-400/20">
          {loadError}
        </div>
      ) : null}

      <Card>
        <CardHeader
          title={`${year} holidays`}
          subtitle={`${visible.length} day${visible.length === 1 ? '' : 's'} excluded from leave counting`}
          right={
            years.length > 1 ? (
              <Select
                id="holiday-year"
                value={String(year)}
                onChange={(event) => setYear(Number(event.target.value))}
                className="w-full sm:w-40"
              >
                {years.map((option) => (
                  <option key={option} value={String(option)}>
                    {option}
                  </option>
                ))}
              </Select>
            ) : undefined
          }
        />
        <CardBody>
          {isLoading ? (
            <div className="space-y-2" aria-hidden="true">
              {[0, 1, 2, 3].map((row) => (
                <div key={row} className="app-skeleton h-14 rounded-xl" />
              ))}
            </div>
          ) : visible.length === 0 ? (
            <EmptyState
              title={`No holidays recorded for ${year}`}
              description="Add the dates your company observes so leave requests spanning them are not charged against an employee's balance."
            />
          ) : (
            <ul className="flex flex-col gap-2">
              {visible.map((holiday) => (
                <li
                  key={holiday.id}
                  className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-slate-800/80 bg-slate-900/55 px-4 py-3 ring-1 ring-inset ring-white/5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-slate-100">
                      {holiday.name}
                    </div>
                    <div className="mt-0.5 text-xs text-slate-400">
                      {formatDateOnly(holiday.date)} · {weekdayOf(holiday.date)}
                    </div>
                  </div>
                  <span
                    className={[
                      'inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold',
                      typeClass(holiday.holiday_type),
                    ].join(' ')}
                  >
                    {holidayTypeLabel[holiday.holiday_type]}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => void onRemove(holiday)}
                    disabled={removingId === holiday.id}
                  >
                    {removingId === holiday.id ? 'Removing…' : 'Remove'}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
