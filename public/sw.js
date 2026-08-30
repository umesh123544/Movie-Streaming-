// Minimal service worker: enables "Add to Home Screen" installability
// and caches a few static assets. Movie pages/streams are always
// fetched fresh from the network (never cached — they're dynamic and,
// for streams, far too large to cache anyway).
const CACHE_NAME = 'reelhouse-v1';
const PRECACHE_URLS = ['/', '/manifest.json', '/icon-192.png', '/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Never intercept API calls, streaming, or non-GET requests — those
  // must always hit the network directly.
  if (
    request.method !== 'GET' ||
    request.url.includes('/api/') ||
    request.url.includes('/_next/')
  ) {
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone)).catch(() => {});
        return response;
      })
      .catch(() => caches.match(request))
  );
});
