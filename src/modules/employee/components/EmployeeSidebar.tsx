'use client';

export type EmployeeView = 'dashboard' | 'leave' | 'violations' | 'attendance';

type NavItem = {
  view: EmployeeView;
  label: string;
  description: string;
};

const navigationItems: NavItem[] = [
  {
    view: 'dashboard',
    label: 'Dashboard',
    description: 'Summary stats',
  },
  {
    view: 'leave',
    label: 'Leave',
    description: 'Apply and request history',
  },
  {
    view: 'violations',
    label: 'My Violations',
    description: 'Review recorded cases',
  },
  {
    view: 'attendance',
    label: 'Attendance History',
    description: 'Monthly attendance records',
  },
];

const iconClass = 'h-4 w-4 shrink-0';

function SidebarIcon({ view }: { view: EmployeeView }) {
  switch (view) {
    case 'dashboard':
      return (
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className={iconClass}>
          <path d="M4.5 10.5H8.5V15.5H4.5V10.5Z" stroke="currentColor" strokeWidth="1.5" />
          <path d="M11.5 4.5H15.5V15.5H11.5V4.5Z" stroke="currentColor" strokeWidth="1.5" />
          <path d="M4.5 4.5H8.5V8H4.5V4.5Z" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
    case 'leave':
      return (
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className={iconClass}>
          <path d="M6 4.5H14C14.8284 4.5 15.5 5.17157 15.5 6V16L10 13.2L4.5 16V6C4.5 5.17157 5.17157 4.5 6 4.5Z" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
    case 'violations':
      return (
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className={iconClass}>
          <rect x="4.5" y="4.5" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" />
          <path d="M7.5 8H12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M7.5 11H12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case 'attendance':
      return (
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className={iconClass}>
          <path d="M6 3.75V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M14 3.75V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <rect x="4.5" y="5.25" width="11" height="10.25" rx="2" stroke="currentColor" strokeWidth="1.5" />
          <path d="M4.5 8.5H15.5" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
  }
}

export function employeeViewLabel(view: EmployeeView) {
  return navigationItems.find((item) => item.view === view)?.label ?? 'Employee';
}

export function EmployeeSidebar({
  activeView,
  mode = 'desktop',
  onCloseMobile,
  onSelect,
}: {
  activeView: EmployeeView;
  mode?: 'desktop' | 'mobile';
  onCloseMobile?: () => void;
  onSelect: (view: EmployeeView) => void;
}) {
  const isMobile = mode === 'mobile';

  const sidebarContent = (
    <>
      <div className="flex items-center justify-between gap-3 border-b border-slate-800/80 px-5 py-4 sm:px-6 sm:py-5">
        <div className="min-w-0">
          <div className="text-base font-semibold text-slate-100">Employee Portal</div>
        </div>

        {isMobile && onCloseMobile ? (
          <button
            type="button"
            aria-label="Close employee navigation"
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
      </div>

      <div className="space-y-5 px-5 py-4 sm:px-6 sm:py-5">
        <div>
          <div className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Workspace
          </div>
          <div className="space-y-2">
            {navigationItems.map((item) => {
              const isActive = activeView === item.view;

              return (
                <button
                  key={item.view}
                  type="button"
                  onClick={() => onSelect(item.view)}
                  className={[
                    'w-full rounded-2xl border bg-slate-900/60 px-4 py-3 text-left transition-all ring-1 ring-inset',
                    isActive
                      ? 'border-sky-400/25 bg-sky-500/10 text-slate-50 ring-sky-400/20 shadow-[0_14px_34px_rgba(14,165,233,0.14)]'
                      : 'border-slate-800/80 text-slate-300 ring-white/5 hover:border-slate-700 hover:bg-slate-900/90',
                  ].join(' ')}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      <SidebarIcon view={item.view} />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">{item.label}</div>
                      <div className="mt-1 text-xs leading-5 text-slate-400">{item.description}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );

  return isMobile ? (
    <div className="overflow-hidden rounded-2xl border border-sky-400/10 bg-slate-950/80 shadow-[0_22px_60px_rgba(2,8,23,0.45)] ring-1 ring-inset ring-white/5 backdrop-blur-xl">
      {sidebarContent}
    </div>
  ) : (
    <aside className="h-full w-full text-slate-100">{sidebarContent}</aside>
  );
}
