'use client';

import { m } from 'framer-motion';
import { arrive } from '@/components/motion/motion-tokens';

/**
 * The active-item background for a navigation group.
 *
 * Every item in a group shares one `layoutId`, so when the selection changes the
 * highlight travels from the old item to the new one instead of vanishing and
 * reappearing. That movement is information: it shows where you came from and where
 * you are now, which a colour swap alone does not.
 *
 * Render it only inside the active item. The parent needs `relative isolate` so the
 * highlight sits behind the label without escaping the item's stacking context.
 */
export function NavHighlight({
  layoutId,
  className = '',
}: {
  layoutId: string;
  className?: string;
}) {
  return (
    <m.span
      layoutId={layoutId}
      aria-hidden="true"
      transition={arrive}
      className={['absolute inset-0 -z-10', className].join(' ')}
    />
  );
}
