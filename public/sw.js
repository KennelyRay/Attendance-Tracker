/*
 * HRIS service worker.
 *
 * Deliberately minimal. This app shows attendance, leave balances and disciplinary
 * records, so serving a stale copy of any of it would be worse than showing nothing.
 * The rules are therefore:
 *
 *   - /api/ is never cached or intercepted. Ever.
 *   - Navigations are NOT intercepted. `/` redirects by role, and a navigation
 *     answered from a service worker with a redirected response fails outright -
 *     Chrome reports "The page couldn't load". Letting the browser handle its own
 *     navigations removes that whole class of failure; an offline shell is not worth
 *     standing between an employee and the app.
 *   - Only the app icons are precached.
 *   - Anything else (Next.js assets, RSC payloads, documents) is left alone so the
 *     browser handles it exactly as it would without a service worker.
 *
 * Bump CACHE_VERSION to retire old caches on deploy.
 */

const CACHE_VERSION = 'hris-v3';

const PRECACHE_URLS = [
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

  // Navigations are handled by the browser. See the note at the top of this file.
  if (request.mode === 'navigate') return;

  // Icons are immutable for the life of a cache version.
  if (url.pathname.startsWith('/icons/')) {
    event.respondWith(
      caches.match(request).then((cached) => cached ?? fetch(request))
    );
    return;
  }

  // Everything else is left to the browser.
});

/* ---------------------------------------------------------------------------
 * Push notifications
 * ------------------------------------------------------------------------ */

self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = {};
  }

  const title = payload.title || 'HRIS';
  const options = {
    body: payload.body || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: payload.tag || undefined,
    // Replace rather than stack, so five leave decisions do not bury the phone.
    renotify: Boolean(payload.tag),
    data: { url: payload.url || '/' },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus an open window if one is already on the app rather than opening another.
      for (const client of clientList) {
        if ('focus' in client) {
          if ('navigate' in client) {
            return client.focus().then(() => client.navigate(targetUrl));
          }
          return client.focus();
        }
      }

      return self.clients.openWindow ? self.clients.openWindow(targetUrl) : undefined;
    })
  );
});
