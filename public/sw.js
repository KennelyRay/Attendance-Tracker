/*
 * HRIS service worker.
 *
 * Deliberately minimal. This app shows attendance, leave balances and disciplinary
 * records, so serving a stale copy of any of it would be worse than showing nothing.
 * The rules are therefore:
 *
 *   - /api/ is never cached or intercepted. Ever.
 *   - Page navigations go to the network first, and fall back to an offline notice
 *     only when the network actually fails.
 *   - Only the app icons and the offline page are precached.
 *   - Anything else (Next.js assets, RSC payloads, documents) is left alone so the
 *     browser handles it exactly as it would without a service worker.
 *
 * Bump CACHE_VERSION to retire old caches on deploy.
 */

const CACHE_VERSION = 'hris-v1';
const OFFLINE_URL = '/offline.html';

const PRECACHE_URLS = [
  OFFLINE_URL,
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-192.png',
  '/icons/icon-maskable-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      // A precache miss must not block activation, or a single renamed asset
      // would leave the app without a working service worker.
      .catch(() => undefined)
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }

  if (url.origin !== self.location.origin) return;

  // Never touch API traffic - authentication and freshness both depend on it
  // reaching the server untouched.
  if (url.pathname.startsWith('/api/')) return;

  // Real page loads: network first, offline notice only on genuine failure.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => {
        const cached = await caches.match(OFFLINE_URL);
        return (
          cached ??
          new Response('You are offline.', {
            status: 503,
            headers: { 'Content-Type': 'text/plain' },
          })
        );
      })
    );
    return;
  }

  // Icons are immutable for the life of a cache version.
  if (url.pathname.startsWith('/icons/')) {
    event.respondWith(
      caches.match(request).then((cached) => cached ?? fetch(request))
    );
    return;
  }

  // Everything else is left to the browser.
});
