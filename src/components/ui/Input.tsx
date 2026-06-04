import { ComponentPropsWithoutRef } from 'react';

export type InputProps = ComponentPropsWithoutRef<'input'>;

export function Input({ className = '', ...props }: InputProps) {
  return (
    <input
      className={[
        'h-11 w-full rounded-xl border border-slate-700/80 bg-slate-900/90 px-3 text-sm text-slate-100 shadow-sm sm:h-10',
        'placeholder:text-slate-500',
        'focus:outline-none focus:ring-2 focus:ring-sky-400/70',
        className,
      ].join(' ')}
      {...props}
    />
  );
}
