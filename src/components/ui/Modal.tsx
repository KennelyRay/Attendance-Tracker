'use client';

import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/Button';

export type ModalTone = 'default' | 'success' | 'error';

const toneRing: Record<ModalTone, string> = {
  default: 'ring-sky-400/20 bg-slate-900/90 text-sky-300',
  success: 'ring-emerald-400/25 bg-emerald-500/10 text-emerald-300',
  error: 'ring-rose-400/25 bg-rose-500/10 text-rose-300',
};

function ToneIcon({ tone }: { tone: ModalTone }) {
  if (tone === 'success') {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-6 w-6">
        <path
          d="m6.5 12.5 3.5 3.5 7.5-8"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="app-check-draw"
        />
      </svg>
    );
  }

  if (tone === 'error') {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-6 w-6">
        <path
          d="M12 8.25v4.5M12 16.5h.01M10.3 4.9 3.6 16.5a2 2 0 0 0 1.73 3h13.34a2 2 0 0 0 1.73-3L13.7 4.9a2 2 0 0 0-3.4 0Z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-6 w-6">
      <path
        d="M12 8.75v4.5M12 16.25h.01M12 4.75a7.25 7.25 0 1 1 0 14.5 7.25 7.25 0 0 1 0-14.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * A dialog on a pointer screen, a bottom sheet on a phone.
 *
 * The two environments want different shapes: a centred panel tall enough to hold a
 * form runs off both ends of a phone, while a sheet anchored to the bottom always
 * fits and puts its actions under the thumb. The header and footer stay fixed and
 * only the body scrolls, so the confirm button is always reachable.
 */
export function Modal({
  isOpen,
  onClose,
  title,
  description,
  tone = 'default',
  size = 'md',
  children,
  footer,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  tone?: ModalTone;
  size?: 'md' | 'lg' | 'xl';
  children?: ReactNode;
  footer?: ReactNode;
}) {
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  const maxWidth =
    size === 'xl' ? 'sm:max-w-3xl' : size === 'lg' ? 'sm:max-w-xl' : 'sm:max-w-md';

  return createPortal(
    <div
      className="app-modal-scrim"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={[
          'app-modal-panel rounded-t-3xl border-t border-slate-800 bg-slate-950 shadow-[0_-20px_60px_rgba(2,8,23,0.7)]',
          'sm:rounded-2xl sm:border sm:shadow-[0_22px_60px_rgba(2,8,23,0.55)]',
          maxWidth,
        ].join(' ')}
      >
        {/* Grab handle, phone only - the affordance a sheet is expected to have. */}
        <div className="flex shrink-0 justify-center pb-1 pt-2.5 sm:hidden">
          <span aria-hidden="true" className="h-1 w-9 rounded-full bg-slate-700" />
        </div>

        <div className="flex shrink-0 items-start gap-3 px-5 pb-3 pt-3 sm:px-6 sm:pt-6">
          <span
            className={[
              'app-result-pop grid h-11 w-11 shrink-0 place-items-center rounded-2xl ring-1 ring-inset',
              toneRing[tone],
            ].join(' ')}
          >
            <ToneIcon tone={tone} />
          </span>
          <div className="min-w-0 flex-1 pt-0.5">
            <h2 className="text-base font-semibold leading-snug text-slate-50 sm:text-lg">
              {title}
            </h2>
            {description ? (
              <p className="mt-1 text-sm leading-6 text-slate-400">{description}</p>
            ) : null}
          </div>
        </div>

        {children ? (
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-2 sm:px-6">
            {children}
          </div>
        ) : null}

        <div className="shrink-0 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 sm:px-6 sm:pb-6">
          {footer ?? (
            <Button className="h-12 w-full sm:h-10 sm:w-auto" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
