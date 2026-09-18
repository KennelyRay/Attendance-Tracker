import { ReactNode } from 'react';

/**
 * The default surface: a flat panel separated by tint and a border.
 *
 * It previously carried backdrop-blur, an inset ring and a 60px shadow on every
 * instance. When every panel is lifted and frosted, elevation stops meaning anything
 * and the page reads as floating glass. Elevation is now spent only where something
 * genuinely sits above the page, which is dialogs and the sheet.
 */
export function Card({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60">
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  right,
  action,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  /**
   * A small control that acts on the whole card, such as refresh. On phones it sits
   * beside the title, where it stays in reach without taking a row of its own; from
   * `sm:` up it closes the header row after `right`.
   */
  action?: ReactNode;
}) {
  if (action) {
    return (
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 gap-y-4 border-b border-slate-800/80 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:px-6 sm:py-5">
        <div className="min-w-0">
          <div className="text-base font-semibold text-slate-100">{title}</div>
          {subtitle ? <div className="mt-1 text-sm text-slate-400">{subtitle}</div> : null}
        </div>
        {right ? (
          <div className="col-span-2 row-start-2 sm:col-span-1 sm:col-start-2 sm:row-start-1">
            {right}
          </div>
        ) : null}
        <div className="col-start-2 row-start-1 sm:col-start-3">{action}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-4 border-b border-slate-800/80 px-5 py-4 sm:flex-row sm:justify-between sm:px-6 sm:py-5">
      <div className="min-w-0">
        <div className="text-base font-semibold text-slate-100">{title}</div>
        {subtitle ? (
          <div className="mt-1 text-sm text-slate-400">{subtitle}</div>
        ) : null}
      </div>
      {right ? <div className="w-full sm:w-auto sm:shrink-0">{right}</div> : null}
    </div>
  );
}

export function CardBody({ children }: { children: ReactNode }) {
  return <div className="px-5 py-4 sm:px-6 sm:py-5">{children}</div>;
}
