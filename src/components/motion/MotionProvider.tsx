'use client';

import { LazyMotion, MotionConfig, domMax } from 'framer-motion';
import type { ReactNode } from 'react';

/**
 * Motion setup for the whole app.
 *
 * `reducedMotion="user"` is the important line: Framer then drops transform and layout
 * animations for anyone whose system asks for reduced motion, without every component
 * having to remember. Opacity still cross-fades, so state changes stay legible rather
 * than snapping.
 *
 * `LazyMotion` loads a feature subset instead of the full library. It is `domMax` rather
 * than the lighter `domAnimation` because the nav highlight and filtered lists use layout
 * animations (`layoutId`, `layout`), which `domAnimation` does not include. Under
 * `strict` those would not error, they would silently not animate.
 * `strict` makes the saving enforceable: it rejects `motion.*` and requires `m.*`, so a
 * stray import cannot quietly pull the whole library back in.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domMax} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}
