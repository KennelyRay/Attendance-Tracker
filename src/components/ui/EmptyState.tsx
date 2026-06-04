import { ReactNode } from 'react';

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-950/75 px-6 py-10 text-center shadow-[0_16px_40px_rgba(2,8,23,0.3)] ring-1 ring-inset ring-white/5">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.16),transparent_68%)]" />
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900/90 ring-1 ring-inset ring-sky-400/15 shadow-[0_16px_36px_rgba(34,211,238,0.12)]">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-6 w-6 text-sky-300">
          <path
            d="M7.75 9.25H16.25M7.75 13H13.25M6.75 4.75H17.25C18.3546 4.75 19.25 5.64543 19.25 6.75V17.25C19.25 18.3546 18.3546 19.25 17.25 19.25H6.75C5.64543 19.25 4.75 18.3546 4.75 17.25V6.75C4.75 5.64543 5.64543 4.75 6.75 4.75Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <div className="mt-5 text-base font-semibold text-slate-100">{title}</div>
      {description ? (
        <div className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">{description}</div>
      ) : null}
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </div>
  );
}
