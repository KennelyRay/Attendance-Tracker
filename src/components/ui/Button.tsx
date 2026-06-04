import { ComponentPropsWithoutRef } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
type Size = 'sm' | 'md';

export type ButtonProps = ComponentPropsWithoutRef<'button'> & {
  variant?: Variant;
  size?: Size;
};

const variantClass: Record<Variant, string> = {
  primary:
    'bg-gradient-to-r from-sky-500 to-cyan-400 text-slate-950 shadow-[0_12px_30px_rgba(34,211,238,0.28)] hover:from-sky-400 hover:to-cyan-300 hover:shadow-[0_16px_38px_rgba(34,211,238,0.34)] focus-visible:outline-sky-400 active:from-sky-500 active:to-cyan-400',
  secondary:
    'bg-slate-900/85 text-slate-100 shadow-sm ring-1 ring-inset ring-slate-700/80 hover:bg-slate-800 hover:shadow focus-visible:outline-sky-400 active:bg-slate-800',
  danger:
    'bg-rose-500/90 text-white shadow-sm hover:bg-rose-400 hover:shadow focus-visible:outline-rose-400 active:bg-rose-500',
  ghost:
    'bg-transparent text-slate-300 hover:bg-slate-800/80 focus-visible:outline-sky-400 active:bg-slate-800',
};

const sizeClass: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-4 text-sm sm:h-10',
};

export function Button({
  className = '',
  variant = 'primary',
  size = 'md',
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={[
        'inline-flex items-center justify-center gap-2 rounded-xl font-medium',
        'transform-gpu transition-[transform,background-color,color,box-shadow,opacity] duration-150 ease-out',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
        'active:scale-[0.98]',
        'disabled:pointer-events-none disabled:opacity-50',
        variantClass[variant],
        sizeClass[size],
        className,
      ].join(' ')}
      {...props}
    />
  );
}
