'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';

/**
 * Route-level error boundary.
 *
 * Without one, a single failing panel takes the whole app down to a blank screen and
 * leaves nothing on record about what broke. This keeps the app usable and, more
 * importantly, shows the actual message so a fault reported from a phone can be
 * diagnosed instead of guessed at.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    console.error('App error boundary caught', {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    });
  }, [error]);

  return (
    <div className="flex min-h-[100dvh] items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-slate-800/80 bg-slate-950/85 p-5 text-center shadow-[0_28px_80px_rgba(2,8,23,0.65)] ring-1 ring-inset ring-white/5 sm:p-7">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-slate-900/90 ring-1 ring-inset ring-amber-400/20">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-6 w-6 text-amber-300">
            <path
              d="M12 8.75v4M12 16.25h.01M10.3 4.9 3.6 16.5a2 2 0 0 0 1.73 3h13.34a2 2 0 0 0 1.73-3L13.7 4.9a2 2 0 0 0-3.4 0Z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h1 className="mt-5 text-lg font-semibold text-slate-50 sm:text-xl">
          This section didn&rsquo;t load
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Something went wrong while opening this page. Your data is safe &mdash; nothing was
          changed.
        </p>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button onClick={() => reset()} className="w-full sm:w-auto">
            Try again
          </Button>
          <Button
            variant="secondary"
            onClick={() => window.location.reload()}
            className="w-full sm:w-auto"
          >
            Reload the app
          </Button>
        </div>

        <button
          type="button"
          onClick={() => setShowDetail((current) => !current)}
          aria-expanded={showDetail}
          className="mt-5 text-xs font-medium text-slate-500 underline-offset-4 transition-colors hover:text-sky-300 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70"
        >
          {showDetail ? 'Hide technical details' : 'Show technical details'}
        </button>

        {showDetail ? (
          <div className="mt-3 rounded-xl bg-slate-900/80 px-3 py-3 text-left ring-1 ring-inset ring-slate-800">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Error
            </div>
            <p className="mt-1 break-words font-mono text-[11px] leading-5 text-rose-300">
              {error.message || 'No message was provided.'}
            </p>
            {error.digest ? (
              <>
                <div className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Reference
                </div>
                <p className="mt-1 break-all font-mono text-[11px] text-slate-400">{error.digest}</p>
              </>
            ) : null}
            <p className="mt-3 text-[11px] leading-5 text-slate-500">
              Share this with your system administrator to help identify the cause.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
