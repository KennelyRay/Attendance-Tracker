import { ComponentPropsWithoutRef } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
type Size = 'sm' | 'md';

export type ButtonProps = ComponentPropsWithoutRef<'button'> & {
  variant?: Variant;
  size?: Size;
};

/* The primary was a sky-to-cyan gradient with a 30px coloured glow, which is the
 * single most over-represented CTA treatment there is, and the glow made the button
 * read as lit rather than pressable. A solid accent is the accent; hover shifts it. */
const variantClass: Record<Variant, string> = {
  primary:
    'bg-sky-400 text-slate-950 hover:bg-sky-300 focus-visible:outline-sky-300 active:bg-sky-400',
  secondary:
    'bg-slate-800 text-slate-100 ring-1 ring-inset ring-slate-700 hover:bg-slate-700 focus-visible:outline-sky-300 active:bg-slate-700',
  /* rose-500 put white text at 3.67:1 and failed AA. rose-600 is 4.70:1, and hover
   * deepens rather than lightens so the hover state stays above the line too. */
  danger:
    'bg-rose-600 text-white hover:bg-rose-700 focus-visible:outline-rose-300 active:bg-rose-600',
  ghost:
    'bg-transparent text-slate-300 hover:bg-slate-800 hover:text-slate-100 focus-visible:outline-sky-300 active:bg-slate-800',
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
