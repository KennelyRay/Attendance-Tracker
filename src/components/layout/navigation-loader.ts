export const GLOBAL_NAVIGATION_START_EVENT = 'app:navigation-start';
export const GLOBAL_NAVIGATION_END_EVENT = 'app:navigation-end';

/**
 * How long the sign-in and sign-out handoff is held on screen, at the owner's request.
 *
 * It is longer than the work usually takes, which is deliberate: signing in and out are
 * the two moments the product introduces itself, and they are worth a beat. It is capped
 * to these two transitions. Everything on the working side of the app stays immediate,
 * because a hold in front of an approve or a save would be a tax on every repetition.
 */
export const AUTH_HANDOFF_HOLD_MS = 2000;

export type NavigationLoaderDetail = {
  title?: string;
  description?: string;
  /** Keep the handoff up for at least this long once it has appeared. */
  minDurationMs?: number;
};

// Read by anything that needs to queue itself behind the handoff rather than appear
// underneath it, such as the signed-in confirmation.
let isActive = false;

export function isNavigationLoaderActive() {
  return isActive;
}

export function setNavigationLoaderActive(next: boolean) {
  isActive = next;
}

export function triggerGlobalNavigationLoader(detail: NavigationLoaderDetail = {}) {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<NavigationLoaderDetail>(GLOBAL_NAVIGATION_START_EVENT, {
      detail,
    })
  );
}
