'use client';

import { m, useReducedMotion } from 'framer-motion';
import { arrive, STAGGER_STEP } from '@/components/motion/motion-tokens';

const ACCENTED = new Set([0, 4, 5, 9]);

/**
 * The segmented blocks from DESIGN.md's identity motif: time and records as discrete,
 * countable units, the same idea as the broken stem in the logo mark. Equal blocks, never
 * varied heights, because varied heights read as a chart and imply data.
 *
 * `arrive` settles once and then holds still, for a page entrance. `loading` runs a wave
 * along the strip for as long as something is genuinely pending, which is the one case
 * where a loop is information rather than decoration.
 *
 * The wave is opacity, which Framer's reduced-motion handling does not strip, so this
 * checks the preference itself and renders the strip at rest instead.
 */
export function SegmentedProgress({
  mode = 'arrive',
  count = 14,
  className = '',
}: {
  mode?: 'arrive' | 'loading';
  count?: number;
  className?: string;
}) {
  const prefersReducedMotion = useReducedMotion();
  const blockClass = (index: number) =>
    ['h-2.5 w-4 rounded-[3px]', ACCENTED.has(index) ? 'bg-sky-400/80' : 'bg-slate-700/80'].join(
      ' '
    );
  const wrapperClass = ['flex items-center gap-1.5', className].join(' ');

  if (mode === 'loading') {
    return (
      <div aria-hidden="true" className={wrapperClass}>
        {Array.from({ length: count }, (_, index) =>
          prefersReducedMotion ? (
            <span key={index} className={blockClass(index)} />
          ) : (
            <m.span
              key={index}
              className={blockClass(index)}
              animate={{ opacity: [0.25, 1, 0.25] }}
              transition={{
                duration: 1.5,
                ease: 'easeInOut',
                repeat: Infinity,
                delay: index * 0.07,
              }}
            />
          )
        )}
      </div>
    );
  }

  return (
    <m.div
      aria-hidden="true"
      variants={{ hidden: {}, shown: { transition: { staggerChildren: STAGGER_STEP / 2 } } }}
      className={wrapperClass}
    >
      {Array.from({ length: count }, (_, index) => (
        <m.span
          key={index}
          variants={{
            hidden: { opacity: 0, scaleX: 0.2 },
            shown: { opacity: 1, scaleX: 1, transition: arrive },
          }}
          className={blockClass(index)}
        />
      ))}
    </m.div>
  );
}
