'use client';

import { m } from 'framer-motion';

/**
 * The in-button indicator for a request that is already running.
 *
 * A loop is normally decoration, which is why the rest of the app avoids it. Here it
 * marks something genuinely pending and stops the moment the request resolves, so it
 * reports state rather than filling space. It is aria-hidden because the button's own
 * label already says what is happening.
 *
 * `onDark` is for the clay primary button, where the mark has to read against a light
 * fill instead of a dark one.
 */
export function ButtonSpinner({ onDark = false }: { onDark?: boolean }) {
  return (
    <m.span
      aria-hidden="true"
      className={[
        'h-3.5 w-3.5 shrink-0 rounded-full border-2',
        onDark ? 'border-slate-950/30 border-t-slate-950' : 'border-white/30 border-t-white',
      ].join(' ')}
      animate={{ rotate: 360 }}
      transition={{ duration: 0.8, ease: 'linear', repeat: Infinity }}
    />
  );
}
