export const GLOBAL_NAVIGATION_START_EVENT = 'app:navigation-start';

export type NavigationLoaderDetail = {
  title?: string;
  description?: string;
};

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
