'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { RefreshButton } from '@/components/ui/RefreshButton';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { fetchAuditLog } from '@/modules/admin/api';
import {
  auditActionLabel,
  auditCategoryLabel,
  isConsequentialAction,
  type AuditCategory,
  type AuditEvent,
  type AuditLogPage,
} from '@/modules/audit/types';

const PAGE_SIZE = 25;
const CATEGORIES: AuditCategory[] = ['account', 'attendance', 'leave', 'violation'];

type CategoryFilter = AuditCategory | 'all';

const categoryAccent: Record<AuditCategory, { dot: string; chip: string; rail: string }> = {
  account: {
    dot: 'bg-sky-400',
    chip: 'bg-sky-500/12 text-sky-300 ring-1 ring-inset ring-sky-400/25',
    rail: 'text-sky-300',
  },
  attendance: {
    dot: 'bg-violet-400',
    chip: 'bg-violet-500/12 text-violet-300 ring-1 ring-inset ring-violet-400/25',
    rail: 'text-violet-300',
  },
  leave: {
    dot: 'bg-emerald-400',
    chip: 'bg-emerald-500/12 text-emerald-300 ring-1 ring-inset ring-emerald-400/25',
    rail: 'text-emerald-300',
  },
  violation: {
    dot: 'bg-amber-400',
    chip: 'bg-amber-500/12 text-amber-300 ring-1 ring-inset ring-amber-400/25',
    rail: 'text-amber-300',
  },
};

function CategoryIcon({ category }: { category: AuditCategory }) {
  const paths: Record<AuditCategory, string> = {
    account: 'M12 12.75a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5ZM4.75 19.25a7.25 7.25 0 0 1 14.5 0',
    attendance: 'M7.75 4.75v2.5M16.25 4.75v2.5M4.75 9.75h14.5M6.75 6.25h10.5a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6.75a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2Z',
    leave: 'M12 6.75v5.5l3.25 2M12 4.75a7.25 7.25 0 1 1 0 14.5 7.25 7.25 0 0 1 0-14.5Z',
    violation: 'M12 8.75v4M12 16.25h.01M10.3 4.9 3.6 16.5a2 2 0 0 0 1.73 3h13.34a2 2 0 0 0 1.73-3L13.7 4.9a2 2 0 0 0-3.4 0Z',
  };

  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-3.5 w-3.5">
      <path
        d={paths[category]}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function parseTimestamp(value: string | Date | number) {
  // This panel is fed by JSON so it sees strings, but a TIMESTAMP reaching a client
  // component through RSC props stays a Date - handle both rather than assume.
  if (value instanceof Date) return value;
  if (typeof value === 'number') return new Date(value);

  const text = String(value);
  const normalized = /[zZ]|[+-]\d{2}:?\d{2}$/.test(text) ? text : `${text.replace(' ', 'T')}Z`;
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? new Date(text) : parsed;
}

function dayKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`;
}

function dayHeading(date: Date) {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (dayKey(date) === dayKey(today)) return 'Today';
  if (dayKey(date) === dayKey(yesterday)) return 'Yesterday';

  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: date.getFullYear() === today.getFullYear() ? undefined : 'numeric',
  });
}

function clockTime(date: Date) {
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

function relativeTime(date: Date) {
  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function detailLabel(key: string) {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (character) => character.toUpperCase())
    .trim();
}

function detailValue(value: unknown) {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
}

function initialsOf(name: string) {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || '?'
  );
}

function AuditEntry({ event }: { event: AuditEvent }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const accent = categoryAccent[event.category];
  const timestamp = parseTimestamp(event.created_at);
  const detailEntries = Object.entries(event.details ?? {});
  const isSystemActor = event.actor_id === null;

  return (
    <li className="relative pl-10">
      <span
        aria-hidden="true"
        className={[
          'absolute left-[13px] top-[18px] h-2.5 w-2.5 -translate-x-1/2 rounded-full ring-4 ring-slate-950',
          accent.dot,
        ].join(' ')}
      />
      <div
        className={[
          'rounded-xl border bg-slate-950/60 px-4 py-3 transition-colors',
          isConsequentialAction(event.action)
            ? 'border-slate-800/80 ring-1 ring-inset ring-rose-400/12'
            : 'border-slate-800/70',
        ].join(' ')}
      >
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
          <span
            className={[
              'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold',
              accent.chip,
            ].join(' ')}
          >
            <CategoryIcon category={event.category} />
            {auditActionLabel[event.action] ?? event.action}
          </span>
          <span className="text-[11px] text-slate-500" title={timestamp.toLocaleString()}>
            {clockTime(timestamp)} · {relativeTime(timestamp)}
          </span>
        </div>

        <div className="mt-2 text-sm leading-6 text-slate-200">{event.summary}</div>

        <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-2">
          <div className="flex min-w-0 items-center gap-2">
            <span
              className={[
                'grid h-6 w-6 shrink-0 place-items-center rounded-full text-[10px] font-semibold',
                isSystemActor
                  ? 'bg-slate-800 text-slate-400 ring-1 ring-inset ring-slate-700'
                  : 'bg-gradient-to-br from-sky-400 to-cyan-300 text-slate-950',
              ].join(' ')}
            >
              {isSystemActor ? 'SYS' : initialsOf(event.actor_name)}
            </span>
            <span className="truncate text-xs text-slate-400">
              {isSystemActor ? 'Automated rule' : event.actor_name}
            </span>
          </div>

          {event.target_user_name ? (
            <div className="flex min-w-0 items-center gap-1.5 text-xs text-slate-500">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-3.5 w-3.5 shrink-0">
                <path
                  d="M4.75 12h14.5m0 0-5-5m5 5-5 5"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="truncate">{event.target_user_name}</span>
            </div>
          ) : null}

          {detailEntries.length > 0 ? (
            <button
              type="button"
              onClick={() => setIsExpanded((current) => !current)}
              aria-expanded={isExpanded}
              className="ml-auto inline-flex items-center gap-1 rounded-lg px-1.5 py-0.5 text-xs font-medium text-slate-400 transition-colors hover:text-sky-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70"
            >
              {isExpanded ? 'Hide details' : 'Details'}
              <svg
                viewBox="0 0 20 20"
                fill="none"
                aria-hidden="true"
                className={[
                  'h-3.5 w-3.5 transition-transform duration-150',
                  isExpanded ? 'rotate-180' : '',
                ].join(' ')}
              >
                <path
                  d="M5.5 7.5 10 12l4.5-4.5"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          ) : null}
        </div>

        {isExpanded && detailEntries.length > 0 ? (
          <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 border-t border-slate-800/80 pt-3 sm:grid-cols-2">
            {detailEntries.map(([key, value]) => (
              <div key={key} className="flex min-w-0 items-baseline justify-between gap-3">
                <dt className="text-[11px] uppercase tracking-wide text-slate-500">
                  {detailLabel(key)}
                </dt>
                <dd className="min-w-0 truncate text-xs text-slate-300" title={detailValue(value)}>
                  {detailValue(value)}
                </dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>
    </li>
  );
}

function AuditSkeleton() {
  return (
    <div className="space-y-3" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((row) => (
        <div key={row} className="app-skeleton h-24 rounded-xl" />
      ))}
    </div>
  );
}

export function AuditTrailPanel() {
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [refreshToken, setRefreshToken] = useState(0);

  const [loaded, setLoaded] = useState<{
    key: string;
    data: AuditLogPage | null;
    error: string | null;
  }>({ key: '', data: null, error: null });

  const requestKey = `${category}|${search}|${page}|${refreshToken}`;
  const isLoading = loaded.key !== requestKey;

  // Debounce the search box so typing does not fire a request per keystroke.
  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    let isStale = false;

    const load = async () => {
      try {
        const data = await fetchAuditLog({
          category,
          search,
          page,
          pageSize: PAGE_SIZE,
        });
        if (!isStale) {
          setLoaded({ key: requestKey, data, error: null });
        }
      } catch (loadError) {
        if (!isStale) {
          setLoaded((previous) => ({
            key: requestKey,
            data: previous.data,
            error:
              loadError instanceof Error ? loadError.message : 'Failed to load the audit trail',
          }));
        }
      }
    };

    void load();

    return () => {
      isStale = true;
    };
  }, [category, search, page, requestKey]);

  const data = loaded.data;
  const events = useMemo(() => data?.events ?? [], [data]);

  const groupedByDay = useMemo(() => {
    const groups: Array<{ key: string; heading: string; events: AuditEvent[] }> = [];

    for (const event of events) {
      const timestamp = parseTimestamp(event.created_at);
      const key = dayKey(timestamp);
      const lastGroup = groups[groups.length - 1];

      if (lastGroup && lastGroup.key === key) {
        lastGroup.events.push(event);
      } else {
        groups.push({ key, heading: dayHeading(timestamp), events: [event] });
      }
    }

    return groups;
  }, [events]);

  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);
  const hasFilters = category !== 'all' || search.length > 0;

  const onSelectCategory = (next: CategoryFilter) => {
    setCategory(next);
    setPage(1);
  };

  const clearFilters = () => {
    setCategory('all');
    setSearchInput('');
    setSearch('');
    setPage(1);
  };

  const allCount = data
    ? CATEGORIES.reduce((sum, key) => sum + (data.categoryCounts[key] ?? 0), 0)
    : 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Audit Trail"
          action={
            <RefreshButton
              onClick={() => setRefreshToken((token) => token + 1)}
              isLoading={isLoading}
            />
          }
        />
        <CardBody>
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onSelectCategory('all')}
                aria-pressed={category === 'all'}
                className={[
                  'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70',
                  category === 'all'
                    ? 'bg-sky-500/15 text-sky-200 ring-1 ring-inset ring-sky-400/30'
                    : 'bg-slate-900/90 text-slate-400 ring-1 ring-inset ring-slate-700/80 hover:text-slate-200',
                ].join(' ')}
              >
                All activity
                <span className="text-[11px] tabular-nums text-slate-500">{allCount}</span>
              </button>

              {CATEGORIES.map((key) => {
                const isActive = category === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => onSelectCategory(key)}
                    aria-pressed={isActive}
                    className={[
                      'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70',
                      isActive
                        ? categoryAccent[key].chip
                        : 'bg-slate-900/90 text-slate-400 ring-1 ring-inset ring-slate-700/80 hover:text-slate-200',
                    ].join(' ')}
                  >
                    <span className={isActive ? '' : categoryAccent[key].rail}>
                      <CategoryIcon category={key} />
                    </span>
                    {auditCategoryLabel[key]}
                    <span className="text-[11px] tabular-nums text-slate-500">
                      {data?.categoryCounts[key] ?? 0}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Input
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search by employee, admin, or action…"
                aria-label="Search the audit trail"
                className="sm:max-w-sm"
              />
              {hasFilters ? (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="sm:w-auto">
                  Clear filters
                </Button>
              ) : null}
            </div>
          </div>
        </CardBody>
      </Card>

      {loaded.error ? (
        <div className="rounded-xl bg-rose-500/10 px-4 py-3 text-sm text-rose-300 ring-1 ring-inset ring-rose-400/20">
          {loaded.error}
        </div>
      ) : null}

      {isLoading && !data ? (
        <AuditSkeleton />
      ) : events.length === 0 ? (
        <EmptyState
          title={hasFilters ? 'No matching activity' : 'No activity recorded yet'}
          description={
            hasFilters
              ? 'Nothing in the audit trail matches these filters. Try a different category or search term.'
              : 'Administrative actions such as leave decisions, attendance edits, and account changes will appear here as they happen.'
          }
          action={
            hasFilters ? (
              <Button variant="secondary" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className={isLoading ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
          <div className="space-y-7">
            {groupedByDay.map((group) => (
              <div key={group.key}>
                <div className="mb-3 flex items-center gap-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    {group.heading}
                  </h3>
                  <div className="h-px flex-1 bg-slate-800/80" />
                  <span className="text-[11px] tabular-nums text-slate-600">
                    {group.events.length} {group.events.length === 1 ? 'entry' : 'entries'}
                  </span>
                </div>
                <ol className="relative space-y-3 before:absolute before:bottom-3 before:left-[13px] before:top-3 before:w-px before:bg-slate-800/70">
                  {group.events.map((event) => (
                    <AuditEntry key={event.id} event={event} />
                  ))}
                </ol>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-col items-center justify-between gap-3 border-t border-slate-800/80 pt-4 sm:flex-row">
            <div className="text-xs text-slate-500">
              Showing <span className="tabular-nums text-slate-300">{rangeStart}</span>–
              <span className="tabular-nums text-slate-300">{rangeEnd}</span> of{' '}
              <span className="tabular-nums text-slate-300">{total}</span>{' '}
              {total === 1 ? 'entry' : 'entries'}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page <= 1 || isLoading}
              >
                Previous
              </Button>
              <span className="text-xs tabular-nums text-slate-400">
                {page} / {totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={page >= totalPages || isLoading}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
