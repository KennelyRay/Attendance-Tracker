import { ReactNode } from 'react';

export function Card({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-sky-400/10 bg-slate-950/70 shadow-[0_22px_60px_rgba(2,8,23,0.45)] ring-1 ring-inset ring-white/5 backdrop-blur-xl">
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
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
