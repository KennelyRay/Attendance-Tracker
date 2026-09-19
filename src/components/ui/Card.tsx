import { ReactNode } from 'react';

/**
 * A section of a page.
 *
 * A `section` has no box at any width. The panel border, tint and radius used to frame
 * every section, and because the data inside is itself made of tiles and tables with
 * their own edges, a screen ended up three frames deep with the content shrinking inside
 * them. What separates sections now is the rule under each title and the space between
 * them, which is also what lets a section hold a full-width table without fighting it.
 *
 * A `surface` keeps the box, for something that stands alone on an otherwise empty page,
 * like the sign-in form. Elevation stays reserved for what genuinely sits above the page:
 * dialogs and the sheet.
 *
 * `--card-px` carries the inset to CardHeader and CardBody, so they line up with
 * whichever variant they sit in. A section takes its gutter from the page.
 */
export function Card({
  children,
  variant = 'section',
}: {
  children: ReactNode;
  variant?: 'section' | 'surface';
}) {
  return (
    <div
      className={
        variant === 'surface'
          ? 'rounded-2xl border border-slate-800 bg-slate-900/60 [--card-px:1.25rem] [--card-pt:1.25rem] sm:[--card-px:1.5rem] sm:[--card-pt:1.5rem]'
          : '[--card-px:0px] [--card-pt:0px] py-1 sm:py-3'
      }
    >
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
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 gap-y-3 border-b border-slate-800/80 px-[var(--card-px)] pb-3 pt-[var(--card-pt)] sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center sm:gap-y-4 sm:pb-4">
        <div className="min-w-0">
          <h2 className="text-base font-semibold tracking-tight text-slate-50 sm:text-lg">
            {title}
          </h2>
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
    <div className="flex flex-col items-start gap-3 border-b border-slate-800/80 px-[var(--card-px)] pb-3 pt-[var(--card-pt)] sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:pb-4">
      <div className="min-w-0">
        <h2 className="text-base font-semibold tracking-tight text-slate-50 sm:text-lg">{title}</h2>
        {subtitle ? <div className="mt-1 text-sm text-slate-400">{subtitle}</div> : null}
      </div>
      {right ? <div className="w-full sm:w-auto sm:shrink-0">{right}</div> : null}
    </div>
  );
}

export function CardBody({ children }: { children: ReactNode }) {
  return <div className="px-[var(--card-px)] pb-[var(--card-pt)] pt-4 sm:pt-5">{children}</div>;
}
