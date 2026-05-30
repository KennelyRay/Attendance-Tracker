import { ComponentPropsWithoutRef } from 'react';

export type SelectProps = ComponentPropsWithoutRef<'select'>;

export function Select({ className = '', ...props }: SelectProps) {
  return (
    <select
      className={[
        'h-10 w-full rounded-xl border border-slate-700/80 bg-slate-900/90 px-3 text-sm text-slate-100 shadow-sm',
        'focus:outline-none focus:ring-2 focus:ring-sky-400/70',
        className,
      ].join(' ')}
      {...props}
    />
  );
}
