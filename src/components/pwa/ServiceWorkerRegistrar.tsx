'use client';

import { useEffect } from 'react';

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

    const register = () => {
      void navigator.serviceWorker.register('/sw.js').catch(() => {
        // Registration failing is not fatal - the app runs exactly as before.
      });
    };

    // Wait for load so the worker never competes with the first render for bandwidth.
    if (document.readyState === 'complete') {
      register();
      return;
    }

    window.addEventListener('load', register);
    return () => window.removeEventListener('load', register);
  }, []);

  return null;
}
