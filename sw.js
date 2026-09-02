/**
 * Enterprise Service Worker for Survey Lokasi PLN (SALKOT)
 * Cache Version: v1.0.0-salkot
 */

const CACHE_NAME = 'salkot-pwa-v1.0.0';

// Core assets to pre-cache on install
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './404.html',
  './manifest.json',
  './pwa-icon.svg',
  './icon-192.png',
  './icon-512.png'
];

// Install Event — Pre-cache static app shell
self.addEventListener('install', (event) => {
  console.log('[SW] Service Worker Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pre-caching Core App Shell');
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event — Clean up outdated caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[SW] Deleting Old Cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event — Offline Cache Strategy
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Ignore non-GET requests
  if (request.method !== 'GET') return;

  // Handle GAS API requests — Network First, Fallback to Cache
  if (url.hostname.includes('script.google.com') || url.pathname.includes('/macros/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return response;
        })
        .catch(() => {
          console.log('[SW] GAS Request Failed (Offline), Serving Cached Response');
          return caches.match(request);
        })
    );
    return;
  }

  // Handle Static Assets & Pages — Stale-While-Revalidate Strategy
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        })
        .catch(() => {
          // If offline and request is HTML document, serve cached index.html or 404.html
          if (request.headers.get('accept')?.includes('text/html')) {
            return caches.match('./index.html') || caches.match('./404.html');
          }
        });

      return cachedResponse || fetchPromise;
    })
  );
});

// Handle SW messages from application
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
