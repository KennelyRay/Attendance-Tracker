import type { Transition, Variants } from 'framer-motion';

/**
 * One motion vocabulary for the whole app.
 *
 * Scattered per-component timings are what make an interface feel assembled rather than
 * designed, so every animation draws its curve and duration from here. The dial is
 * MOTION 3, which buys choreography on arrival; it does not buy delay on the work
 * itself, so anything on an action path uses `immediate`.
 */

/** Settling, slightly springy. Panels, sheets, anything arriving. */
export const arrive: Transition = {
  type: 'spring',
  stiffness: 320,
  damping: 34,
  mass: 0.9,
};

/** Quick and flat. Hover, press, and anything a person is waiting on. */
export const immediate: Transition = {
  duration: 0.14,
  ease: [0.25, 0.1, 0.25, 1],
};

/** Leaving should be faster than arriving, or dismissal feels sticky. */
export const depart: Transition = {
  duration: 0.16,
  ease: [0.4, 0, 1, 1],
};

/** Gap between siblings in a choreographed group. Long enough to read as a sequence. */
export const STAGGER_STEP = 0.045;

export const panelGroup: Variants = {
  hidden: {},
  shown: {
    transition: { staggerChildren: STAGGER_STEP, delayChildren: 0.02 },
  },
};

export const panelItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  shown: { opacity: 1, y: 0, transition: arrive },
};

/** Dialogs rise on a phone and settle in place on a pointer screen. */
export const dialog: Variants = {
  hidden: { opacity: 0, scale: 0.97, y: 8 },
  shown: { opacity: 1, scale: 1, y: 0, transition: arrive },
  gone: { opacity: 0, scale: 0.98, y: 6, transition: depart },
};

export const scrim: Variants = {
  hidden: { opacity: 0 },
  shown: { opacity: 1, transition: { duration: 0.18 } },
  gone: { opacity: 0, transition: depart },
};

/** Content revealed as it scrolls into view. Runs once; re-animating on every pass
 *  turns a page into a slideshow. */
export const reveal: Variants = {
  hidden: { opacity: 0, y: 24 },
  shown: { opacity: 1, y: 0, transition: arrive },
};
