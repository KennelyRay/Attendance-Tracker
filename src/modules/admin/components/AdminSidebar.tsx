'use client';

import { Card, CardBody } from '@/components/ui/Card';

export type AdminView =
  | 'dashboard'
  | 'employees'
  | 'leave-requests'
  | 'new-violation'
  | 'all-violation-cases'
  | 'reports-charts'
  | 'smart-insights'
  | 'audit-trail'
  | 'employee-accounts';

type NavItem = {
  view: AdminView;
  label: string;
  description: string;
  badge?: string;
};

type NavGroup = {
  heading: string;
  items: NavItem[];
};

const iconClass = 'h-4 w-4 shrink-0';

function SidebarIcon({ view }: { view: AdminView }) {
  switch (view) {
    case 'dashboard':
      return (
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className={iconClass}>
          <path d="M4.5 10.5H8.5V15.5H4.5V10.5Z" stroke="currentColor" strokeWidth="1.5" />
          <path d="M11.5 4.5H15.5V15.5H11.5V4.5Z" stroke="currentColor" strokeWidth="1.5" />
          <path d="M4.5 4.5H8.5V8H4.5V4.5Z" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
    case 'employees':
      return (
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className={iconClass}>
          <path
            d="M6.5 8C7.88071 8 9 6.88071 9 5.5C9 4.11929 7.88071 3 6.5 3C5.11929 3 4 4.11929 4 5.5C4 6.88071 5.11929 8 6.5 8Z"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M11.5 9C12.6046 9 13.5 8.10457 13.5 7C13.5 5.89543 12.6046 5 11.5 5C10.3954 5 9.5 5.89543 9.5 7C9.5 8.10457 10.3954 9 11.5 9Z"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path d="M3.5 15C3.9 12.9 5.1 12 6.6 12H8.2C9.7 12 10.9 12.9 11.3 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M10.8 15C11.15 13.55 12.1 12.8 13.3 12.8H14.2C15.4 12.8 16.35 13.55 16.7 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case 'leave-requests':
      return (
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className={iconClass}>
          <path d="M6 4.5H14C14.8284 4.5 15.5 5.17157 15.5 6V16L10 13.2L4.5 16V6C4.5 5.17157 5.17157 4.5 6 4.5Z" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
    case 'new-violation':
      return (
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className={iconClass}>
          <path d="M10 5V15" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          <path d="M5 10H15" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
    case 'all-violation-cases':
      return (
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className={iconClass}>
          <rect x="4.5" y="4.5" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" />
          <path d="M7.5 8H12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M7.5 11H12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case 'reports-charts':
      return (
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className={iconClass}>
          <path d="M5 14.5V10.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          <path d="M10 14.5V6.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          <path d="M15 14.5V8.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      );
    case 'smart-insights':
      return (
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className={iconClass}>
          <path d="M10 3.5C7.1 3.5 4.75 5.85 4.75 8.75C4.75 10.55 5.55 11.9 6.6 12.85C7.15 13.35 7.5 13.95 7.5 14.65V15.25H12.5V14.65C12.5 13.95 12.85 13.35 13.4 12.85C14.45 11.9 15.25 10.55 15.25 8.75C15.25 5.85 12.9 3.5 10 3.5Z" stroke="currentColor" strokeWidth="1.5" />
          <path d="M8 17H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case 'audit-trail':
      return (
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className={iconClass}>
          <circle cx="10" cy="10" r="6.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M10 6.5V10L12.5 11.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'employee-accounts':
      return (
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className={iconClass}>
          <path d="M10 10C11.933 10 13.5 8.433 13.5 6.5C13.5 4.567 11.933 3 10 3C8.067 3 6.5 4.567 6.5 6.5C6.5 8.433 8.067 10 10 10Z" stroke="currentColor" strokeWidth="1.5" />
          <path d="M4.5 16C5.15 13.55 6.95 12.25 9.2 12.25H10.8C13.05 12.25 14.85 13.55 15.5 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
  }
}

export const adminNavigationGroups: NavGroup[] = [
  {
    heading: 'Main',
    items: [
      {
        view: 'dashboard',
        label: 'Dashboard',
        description: 'Statistics and overview',
      },
      {
        view: 'employees',
        label: 'Employees',
        description: 'Attendance and employee details',
      },
    ],
  },
  {
    heading: 'Leave',
    items: [
      {
        view: 'leave-requests',
        label: 'Leave Requests',
        description: 'Review and process leave',
      },
    ],
  },
  {
    heading: 'Violations',
    items: [
      {
        view: 'new-violation',
        label: 'New Violation',
        description: 'Open a new case',
      },
      {
        view: 'all-violation-cases',
        label: 'All Violation Cases',
        description: 'Track all cases',
      },
    ],
  },
  {
    heading: 'Analytics',
    items: [
      {
        view: 'reports-charts',
        label: 'Reports & Charts',
        description: 'Detailed analytics',
      },
      {
        view: 'smart-insights',
        label: 'Smart Insights',
        description: 'Recommended focus areas',
      },
    ],
  },
  {
    heading: 'System',
    items: [
      {
        view: 'audit-trail',
        label: 'Audit Trail',
        description: 'System activity log',
      },
      {
        view: 'employee-accounts',
        label: 'Employee Accounts',
        description: 'Access and account controls',
      },
    ],
  },
];

export function adminViewLabel(view: AdminView) {
  for (const group of adminNavigationGroups) {
    const item = group.items.find((entry) => entry.view === view);
    if (item) {
      return item.label;
    }
  }

  return 'Admin';
}

export function AdminSidebar({
  activeView,
  pendingLeaveCount,
  attentionCount,
  isCollapsed = false,
  mode = 'desktop',
  onToggleCollapse,
  onCloseMobile,
  onSelect,
}: {
  activeView: AdminView;
  pendingLeaveCount: number;
  attentionCount: number;
  isCollapsed?: boolean;
  mode?: 'desktop' | 'mobile';
  onToggleCollapse?: () => void;
  onCloseMobile?: () => void;
  onSelect: (view: AdminView) => void;
}) {
  const groups = adminNavigationGroups.map((group) => ({
    ...group,
    items: group.items.map((item) => ({
      ...item,
      badge:
        item.view === 'leave-requests'
          ? pendingLeaveCount > 0
            ? String(pendingLeaveCount)
            : undefined
          : item.view === 'employee-accounts'
            ? attentionCount > 0
              ? String(attentionCount)
              : undefined
            : undefined,
    })),
  }));

  const renderToggleIcon = (collapsed: boolean) => (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="h-4 w-4">
      {collapsed ? (
        <path
          d="M7.5 5.5L12.5 10L7.5 14.5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <path
          d="M12.5 5.5L7.5 10L12.5 14.5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );

  const isMobile = mode === 'mobile';
  const showCollapsedDesktop = !isMobile && isCollapsed;

  return (
    <Card>
      <div
        className={[
          'flex items-center justify-between gap-3 border-b border-slate-800/80',
          showCollapsedDesktop ? 'px-3 py-3' : 'px-5 py-4 sm:px-6 sm:py-5',
        ].join(' ')}
      >
        {showCollapsedDesktop ? (
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-300 ring-1 ring-inset ring-sky-400/20">
            <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="h-5 w-5">
              <path d="M4.5 10.5H8.5V15.5H4.5V10.5Z" stroke="currentColor" strokeWidth="1.5" />
              <path d="M11.5 4.5H15.5V15.5H11.5V4.5Z" stroke="currentColor" strokeWidth="1.5" />
              <path d="M4.5 4.5H8.5V8H4.5V4.5Z" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </div>
        ) : (
          <div className="min-w-0">
            <div className="text-base font-semibold text-slate-100">Admin Console</div>
            <div className="mt-1 text-sm text-slate-400">
              Navigate the workspace by team, operations, and system tools.
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          {isMobile && onCloseMobile ? (
            <button
              type="button"
              aria-label="Close admin navigation"
              onClick={onCloseMobile}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800/80 bg-slate-950/80 text-slate-300 ring-1 ring-inset ring-white/5 transition-colors hover:bg-slate-900"
            >
              <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="h-4 w-4">
                <path
                  d="M6.5 6.5L13.5 13.5M13.5 6.5L6.5 13.5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          ) : null}

          {!isMobile && onToggleCollapse ? (
            <button
              type="button"
              aria-label={showCollapsedDesktop ? 'Expand admin sidebar' : 'Collapse admin sidebar'}
              onClick={onToggleCollapse}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800/80 bg-slate-950/80 text-slate-300 ring-1 ring-inset ring-white/5 transition-colors hover:bg-slate-900"
            >
              {renderToggleIcon(showCollapsedDesktop)}
            </button>
          ) : null}
        </div>
      </div>

      <CardBody>
        <div className={showCollapsedDesktop ? 'space-y-3' : 'space-y-5'}>
          {groups.map((group) => (
            <div key={group.heading}>
              {showCollapsedDesktop ? (
                <div className="mb-2 flex justify-center">
                  <div className="h-px w-8 bg-slate-800/90" />
                </div>
              ) : (
                <div className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {group.heading}
                </div>
              )}

              <div className="space-y-2">
                {group.items.map((item) => {
                  const isActive = activeView === item.view;

                  return (
                    <button
                      key={item.view}
                      type="button"
                      title={showCollapsedDesktop ? item.label : undefined}
                      onClick={() => onSelect(item.view)}
                      className={[
                        'w-full rounded-2xl border text-left transition-all',
                        'ring-1 ring-inset',
                        showCollapsedDesktop
                          ? 'px-0 py-3'
                          : 'px-4 py-3',
                        isActive
                          ? 'border-sky-400/25 bg-sky-500/10 text-slate-50 ring-sky-400/20 shadow-[0_14px_34px_rgba(14,165,233,0.14)]'
                          : 'border-slate-800/80 bg-slate-900/60 text-slate-300 ring-white/5 hover:border-slate-700 hover:bg-slate-900/90',
                      ].join(' ')}
                    >
                      <div
                        className={[
                          'flex gap-3',
                          showCollapsedDesktop
                            ? 'items-center justify-center'
                            : 'items-start justify-between',
                        ].join(' ')}
                      >
                        <div className={showCollapsedDesktop ? 'relative' : 'min-w-0'}>
                          <div
                            className={[
                              'flex text-sm font-semibold',
                              showCollapsedDesktop
                                ? 'items-center justify-center'
                                : 'items-center gap-2',
                            ].join(' ')}
                          >
                            <SidebarIcon view={item.view} />
                            {showCollapsedDesktop ? null : <span className="truncate">{item.label}</span>}
                          </div>
                          {showCollapsedDesktop ? null : (
                            <div className="mt-1 text-xs leading-5 text-slate-400">{item.description}</div>
                          )}
                          {showCollapsedDesktop && item.badge ? (
                            <span className="absolute -right-2 -top-2 inline-flex min-w-5 justify-center rounded-full bg-slate-950/95 px-1.5 py-0.5 text-[10px] font-semibold text-sky-300 ring-1 ring-inset ring-slate-700">
                              {item.badge}
                            </span>
                          ) : null}
                        </div>
                        {!showCollapsedDesktop && item.badge ? (
                          <span className="inline-flex min-w-7 justify-center rounded-full bg-slate-950/90 px-2 py-1 text-[11px] font-semibold text-sky-300 ring-1 ring-inset ring-slate-700">
                            {item.badge}
                          </span>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}
