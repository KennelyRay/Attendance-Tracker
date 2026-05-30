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
    <div className="rounded-2xl border border-slate-800/80 bg-slate-950/75 px-6 py-10 text-center shadow-[0_16px_40px_rgba(2,8,23,0.3)] ring-1 ring-inset ring-white/5">
      <div className="text-base font-semibold text-slate-100">{title}</div>
      {description ? (
        <div className="mt-2 text-sm text-slate-400">{description}</div>
      ) : null}
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </div>
  );
}
