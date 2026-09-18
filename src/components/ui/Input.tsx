import { ComponentPropsWithoutRef } from 'react';

export type InputProps = ComponentPropsWithoutRef<'input'>;

export function Input({ className = '', ...props }: InputProps) {
  return (
    <input
      className={[
        // 16px on phones: iOS zooms the whole page when a field under 16px is focused, and the
        // zoom persists after navigating, which made the app appear to load zoomed in.
        'h-11 w-full rounded-xl border border-field bg-slate-950 px-3 text-base text-slate-100 sm:h-10 sm:text-sm',
        'placeholder:text-slate-500',
        'focus:outline-none focus:ring-2 focus:ring-sky-400/70',
        className,
      ].join(' ')}
      {...props}
    />
  );
}
