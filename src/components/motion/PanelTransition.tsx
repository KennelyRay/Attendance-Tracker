'use client';

import { AnimatePresence, m } from 'framer-motion';
import type { ReactNode } from 'react';
import { panelGroup, panelItem } from '@/components/motion/motion-tokens';

/**
 * Choreographs a dashboard view as it arrives.
 *
 * Keyed on the active view, so switching sections plays the outgoing view out and the
 * incoming one in rather than swapping instantly. Children marked with `<PanelItem>`
 * arrive in sequence, which gives the eye an order to read the screen in instead of
 * presenting everything at once.
 *
 * Choreography sits on arrival only. Once the view has settled nothing keeps moving,
 * and no control waits on an animation before it responds.
 */
export function PanelTransition({
  viewKey,
  children,
  className = '',
}: {
  viewKey: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <m.div
        key={viewKey}
        variants={panelGroup}
        initial="hidden"
        animate="shown"
        exit={{ opacity: 0, transition: { duration: 0.12 } }}
        className={className}
      >
        {children}
      </m.div>
    </AnimatePresence>
  );
}

/** One step in the sequence. Wrap the blocks that should arrive in order. */
export function PanelItem({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <m.div variants={panelItem} className={className}>
      {children}
    </m.div>
  );
}
