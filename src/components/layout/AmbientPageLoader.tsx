'use client';

import Image from 'next/image';
import { m } from 'framer-motion';
import { SegmentedProgress } from '@/components/motion/SegmentedProgress';

type AmbientPageLoaderProps = {
  title?: string;
  description?: string;
};

/**
 * The handoff between one view and the next: the whole screen, not a panel floating on a
 * dimmed page.
 *
 * It was a centred card with backdrop blur, a glowing ring, a spinner and three pulsing
 * dots, which is four treatments telling you the same single fact. Full screen says it
 * once, and carrying the same ground, logo and segmented motif as the sign-in page makes
 * the wait read as the app continuing rather than as a dialog interrupting it.
 */
export function AmbientPageLoader({
  title = 'Loading',
  description = 'Opening the next page.',
}: AmbientPageLoaderProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[70] flex flex-col items-center justify-center gap-7 overflow-hidden bg-[#15120f] px-6 text-center"
    >
      {/* The same warm lift the sign-in page uses, so the two screens read as one place. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(90rem_50rem_at_50%_42%,rgba(229,138,98,0.10),transparent_62%)]"
      />

      <m.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24, ease: 'easeOut' }}
        className="relative flex flex-col items-center gap-7"
      >
        <Image
          src="/hris-logo.svg"
          alt=""
          width={48}
          height={48}
          priority
          unoptimized
          className="h-12 w-12 rounded-2xl"
        />

        <div>
          <div className="text-lg font-semibold tracking-tight text-slate-50 sm:text-xl">
            {title}
          </div>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-400">{description}</p>
        </div>

        <SegmentedProgress mode="loading" />
      </m.div>
    </div>
  );
}
