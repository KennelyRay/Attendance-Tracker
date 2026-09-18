'use client';

import { BottomSheet } from '@/components/ui/BottomSheet';
import {
  SidebarIcon,
  adminNavigationGroups,
  type AdminView,
} from '@/modules/admin/components/AdminSidebar';

/** The destinations the phone bottom bar already shows. The sheet lists everything else. */
export const ADMIN_BOTTOM_BAR_VIEWS: AdminView[] = [
  'dashboard',
  'employees',
  'leave-requests',
  'smart-insights',
];

export function isAdminOverflowView(view: AdminView) {
  return !ADMIN_BOTTOM_BAR_VIEWS.includes(view);
}

/**
 * The phone replacement for the admin sidebar.
 *
 * The sidebar was a 320px desktop panel slid in from the left, 1050px tall on an 844px
 * screen, and most of it repeated the four tabs already in the bottom bar. This lists
 * only the sections the bar does not reach, grouped as the sidebar groups them, as
 * compact rows that fit on one screen without scrolling.
 */
export function AdminMoreSheet({
  isOpen,
  onClose,
  activeView,
  onSelect,
  attentionCount,
}: {
  isOpen: boolean;
  onClose: () => void;
  activeView: AdminView;
  onSelect: (view: AdminView) => void;
  attentionCount: number;
}) {
  const groups = adminNavigationGroups
    .map((group) => ({ ...group, items: group.items.filter((item) => isAdminOverflowView(item.view)) }))
    .filter((group) => group.items.length > 0);

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="More sections">
      <nav aria-label="More admin sections" className="space-y-4">
        {groups.map((group) => (
          <section key={group.heading}>
            <h3 className="px-2 pb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
              {group.heading}
            </h3>
            <ul className="space-y-1">
              {group.items.map((item) => {
                const isActive = activeView === item.view;
                const badge = item.view === 'employee-accounts' && attentionCount > 0 ? attentionCount : null;
                return (
                  <li key={item.view}>
                    <button
                      type="button"
                      aria-current={isActive ? 'page' : undefined}
                      onClick={() => onSelect(item.view)}
                      className={[
                        'flex min-h-14 w-full items-center gap-3 rounded-2xl px-2.5 py-2 text-left transition-colors',
                        'focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 active:bg-slate-800',
                        isActive ? 'bg-sky-500/10 text-sky-200' : 'text-slate-200 hover:bg-slate-900',
                      ].join(' ')}
                    >
                      <span
                        className={[
                          'grid h-10 w-10 shrink-0 place-items-center rounded-xl',
                          isActive ? 'bg-sky-500/15 text-sky-300' : 'bg-slate-800 text-slate-300',
                        ].join(' ')}
                      >
                        <SidebarIcon view={item.view} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[15px] font-medium">{item.label}</span>
                        <span className="block truncate text-xs text-slate-400">{item.description}</span>
                      </span>
                      {badge !== null ? (
                        <span className="shrink-0 rounded-full bg-sky-400 px-2 py-0.5 text-xs font-semibold tabular-nums text-slate-950">
                          {badge}
                          <span className="sr-only"> need attention</span>
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </nav>
    </BottomSheet>
  );
}
