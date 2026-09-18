'use client';

import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

/**
 * Bottom sheet holding account details and the actions that used to sit permanently
 * in the mobile header. Phones have a header's worth of width, not two rows of it, so
 * secondary detail belongs one tap away rather than on every screen.
 */
export function AccountSheet({
  isOpen,
  onClose,
  children,
  labelledBy,
}: {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  labelledBy: string;
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

  return createPortal(
    <>
      <div className="app-sheet-backdrop" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className="app-sheet rounded-t-3xl border-t border-slate-800 bg-slate-950 shadow-[0_-20px_60px_rgba(8,6,4,0.7)]"
      >
        {/* Grab handle - the affordance people expect at the top of a sheet. */}
        <div className="flex justify-center pb-1 pt-2.5">
          <span aria-hidden="true" className="h-1 w-9 rounded-full bg-slate-700" />
        </div>
        <div className="px-4 pb-4">{children}</div>
      </div>
    </>,
    document.body
  );
}
