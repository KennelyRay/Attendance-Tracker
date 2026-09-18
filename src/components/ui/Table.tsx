import { ReactNode } from 'react';

/**
 * Data table for pointer-sized screens.
 *
 * Every panel that uses this also ships a card list behind `md:hidden`, so this is
 * never the mobile experience and is free to be dense.
 *
 * The header sticks because these tables run long (a full roster, a year of cases) and
 * a column heading that scrolls away turns the fifth column into a guess. The surface
 * is flat for the same reason Card is: elevation is spent on overlays, not on every
 * panel.
 */
export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-800">
      <div className="max-h-[70vh] overflow-auto">
        <table className="min-w-full border-collapse">{children}</table>
      </div>
    </div>
  );
}

export function THead({ children }: { children: ReactNode }) {
  return (
    <thead className="sticky top-0 z-10 bg-slate-800 [&_th]:border-b [&_th]:border-slate-700">
      {children}
    </thead>
  );
}

export function TH({ children, align = 'left' }: { children: ReactNode; align?: 'left' | 'right' }) {
  return (
    <th
      scope="col"
      className={[
        'whitespace-nowrap px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-300 sm:px-5',
        align === 'right' ? 'text-right' : 'text-left',
      ].join(' ')}
    >
      {children}
    </th>
  );
}

export function TBody({ children }: { children: ReactNode }) {
  return (
    <tbody className="divide-y divide-slate-700 [&_tr]:transition-colors [&_tr:hover]:bg-slate-800/40">
      {children}
    </tbody>
  );
}

export function TD({
  children,
  className = '',
  numeric = false,
}: {
  children: ReactNode;
  className?: string;
  /** Dates, counts and balances line up column-wise and stop jittering as they update. */
  numeric?: boolean;
}) {
  return (
    <td
      className={[
        'px-3 py-3 text-sm text-slate-300 sm:px-5',
        numeric ? 'whitespace-nowrap tabular-nums' : '',
        className,
      ].join(' ')}
    >
      {children}
    </td>
  );
}
