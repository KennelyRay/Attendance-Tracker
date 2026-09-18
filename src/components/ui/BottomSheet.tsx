'use client';

import { AnimatePresence, m, useDragControls, type PanInfo } from 'framer-motion';
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { arrive, depart } from '@/components/motion/motion-tokens';

/**
 * A sheet anchored to the bottom of the screen, for phone-sized views.
 *
 * Bottom-anchored because that is where the thumb already is: every option lands in
 * reach without a stretch to the top corner. It can be dismissed four ways, so nobody
 * is stuck with the one they don't know: drag it down by the handle, tap the scrim,
 * press Escape, or use the labelled close control.
 *
 * Drag starts only from the handle area. If the whole sheet were draggable, scrolling
 * a long list inside it would fight the dismiss gesture.
 */
export function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const titleId = useId();
  const dragControls = useDragControls();
  const panelRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    returnFocusRef.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);

    // Move focus into the sheet so keyboard and screen-reader users land in it.
    const focusTimer = window.setTimeout(() => panelRef.current?.focus(), 0);

    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
      // Hand focus back to whatever opened the sheet.
      returnFocusRef.current?.focus?.();
    };
  }, [isOpen, onClose]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    // Far enough, or flicked fast enough, counts as a dismissal.
    if (info.offset.y > 120 || info.velocity.y > 600) onClose();
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen ? (
        <m.div
          key="sheet-scrim"
          className="fixed inset-0 z-[60] bg-[rgba(8,6,4,0.62)]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.18 } }}
          exit={{ opacity: 0, transition: depart }}
          onClick={onClose}
          aria-hidden="true"
        />
      ) : null}
      {isOpen ? (
        <m.div
          key="sheet-panel"
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          tabIndex={-1}
          className="fixed inset-x-0 bottom-0 z-[61] flex max-h-[85dvh] flex-col rounded-t-3xl border-t border-slate-700 bg-slate-950 pb-[env(safe-area-inset-bottom)] shadow-[0_-18px_48px_rgba(8,6,4,0.6)] outline-none"
          initial={{ y: '100%' }}
          animate={{ y: 0, transition: arrive }}
          exit={{ y: '100%', transition: depart }}
          drag="y"
          dragListener={false}
          dragControls={dragControls}
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0, bottom: 0.6 }}
          onDragEnd={onDragEnd}
        >
          <div
            className="flex shrink-0 touch-none cursor-grab items-center justify-between gap-3 px-5 pb-2 pt-3 active:cursor-grabbing"
            onPointerDown={(event) => dragControls.start(event)}
          >
            <span aria-hidden="true" className="absolute left-1/2 top-2 h-1 w-10 -translate-x-1/2 rounded-full bg-slate-600" />
            <h2 id={titleId} className="pt-3 text-base font-semibold text-slate-50">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              onPointerDown={(event) => event.stopPropagation()}
              className="mt-2 grid h-11 min-w-11 place-items-center rounded-xl px-3 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
            >
              Close
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-4">{children}</div>
        </m.div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}
