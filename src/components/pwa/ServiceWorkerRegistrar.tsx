'use client';

import { useEffect } from 'react';

const RELOAD_GUARD_KEY = 'hris:stale-build-reload';
const RELOAD_GUARD_MS = 15_000;

/**
 * Reloads once to pick up a fresh build, with a short guard so a genuinely broken
 * page cannot put the app into a reload loop.
 */
function reloadOnce() {
  try {
    const last = Number(window.sessionStorage.getItem(RELOAD_GUARD_KEY) ?? 0);
    if (Date.now() - last < RELOAD_GUARD_MS) return;
    window.sessionStorage.setItem(RELOAD_GUARD_KEY, String(Date.now()));
  } catch {
    // Private mode can throw on sessionStorage; a single reload is still worth trying.
  }

  window.location.reload();
}

/**
 * An installed app keeps its page alive across deploys. The HTML it is holding points
 * at hashed chunk files that the new build no longer serves, so the first navigation
 * to a route whose chunk was never loaded fails outright - the browser reports
 * "The page couldn't load". Recovering means reloading to fetch the current HTML.
 */
function isStaleBuildError(message: string) {
  return (
    /ChunkLoadError/i.test(message) ||
    /Loading chunk [\w-]+ failed/i.test(message) ||
    /Failed to fetch dynamically imported module/i.test(message) ||
    /Importing a module script failed/i.test(message)
  );
}

/**
 * Registers the service worker in production only.
 *
 * Running it under `next dev` makes local changes appear not to take effect, so the
 * dev workflow is left exactly as it was. Any worker left over from a production
 * visit on the same origin is unregistered instead, so a developer who once loaded
 * the deployed app is not served its cache locally.
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      if (isStaleBuildError(event.message ?? '')) reloadOnce();
    };

    const onRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const message =
        reason instanceof Error ? `${reason.name}: ${reason.message}` : String(reason ?? '');
      if (isStaleBuildError(message)) reloadOnce();
    };

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);

    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    if (process.env.NODE_ENV !== 'production') {
      void navigator.serviceWorker
        .getRegistrations()
        .then((registrations) => {
          for (const registration of registrations) {
            void registration.unregister();
          }
        })
        .catch(() => undefined);
      return;
    }

    // True only when a worker was already in control, so a first install does not
    // reload the page the user just opened.
    const hadController = Boolean(navigator.serviceWorker.controller);

    const onControllerChange = () => {
      if (hadController) reloadOnce();
    };

    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

    const register = () => {
      void navigator.serviceWorker.register('/sw.js').catch(() => {
        // Registration failing is not fatal - the app runs exactly as before.
      });
    };

    if (document.readyState === 'complete') {
      register();
    } else {
      window.addEventListener('load', register);
    }

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
      window.removeEventListener('load', register);
    };
  }, []);

  return null;
}
