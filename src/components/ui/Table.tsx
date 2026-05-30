import { ReactNode } from 'react';

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-950/80 shadow-[0_16px_40px_rgba(2,8,23,0.28)] ring-1 ring-inset ring-white/5">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-800">{children}</table>
      </div>
    </div>
  );
}

export function THead({ children }: { children: ReactNode }) {
  return <thead className="bg-slate-900/95">{children}</thead>;
}

export function TH({ children }: { children: ReactNode }) {
  return (
    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
      {children}
    </th>
  );
}

export function TBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-slate-800/80 bg-slate-950/70">{children}</tbody>;
}

export function TD({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <td className={['px-5 py-3 text-sm text-slate-300', className].join(' ')}>
      {children}
    </td>
  );
}
