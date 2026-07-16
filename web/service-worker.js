// ZaLo Marketplace Smart Sync Update: 2026-07-16
// ZaLo Smart Multivendor Marketplace - Service Worker (service-worker.js)
// Version: zalo-v8
// Manages offline assets caching, dynamic routing, and strict cache-invalidation / update propagation.

const CACHE_NAME = 'zalo-v9';
const ASSETS = [
  './',
  './index.html',
  './login.html',
  './dashboard-store.html',
  './dashboard-admin.html',
  './customer-home.html',
  './assets/logo.svg',
  './css/style.css',
  './assets/icon-192.svg',
  './assets/icon-512.svg',
  './manifest.json',
  './offline.html'
];

// Install Event - Pre-cache critical application assets resiliently
self.addEventListener('install', (e) => {
  console.log(`[Service Worker] Installation initiated for ${CACHE_NAME}`);
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        ASSETS.map(asset => {
          return cache.add(asset).catch(err => {
            console.warn(`[Service Worker] Failed to pre-cache asset during install: ${asset}`, err);
          });
        })
      );
    })
  );
  // Force active state immediately without waiting for page reload
  self.skipWaiting();
});

// Activate Event - Clean up stale cache versions instantly (Strict Cache Purge)
self.addEventListener('activate', (e) => {
  console.log(`[Service Worker] Activation initiated. Purging legacy caches...`);
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log(`[Service Worker] Deleting obsolete cache: ${key}`);
            return caches.delete(key);
          }
        })
      );
    }).then(() => {
      console.log(`[Service Worker] Legacy cache purged completely.`);
      // Take control of all open pages immediately
      return self.clients.claim();
    })
  );
});

// Fetch Event - Network-First Cache-Fallback strategy for reliability
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);

  // Focus only on local assets (ignore CDNs, external database connections)
  if (url.origin !== self.location.origin) {
    return;
  }

  // Bypass service worker caching for version.json to ensure accurate updates
  if (url.pathname.endsWith('version.json')) {
    e.respondWith(fetch(e.request));
    return;
  }

  e.respondWith(
    fetch(e.request)
      .then((response) => {
        // Cache newly fetched valid asset responses dynamically
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache if offline
        return caches.match(e.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // If HTML navigation, redirect to offline page
          if (e.request.mode === 'navigate' || (e.request.headers.get('accept') && e.request.headers.get('accept').includes('text/html'))) {
            return caches.match('./offline.html');
          }
        });
      })
  );
});

// Listener for custom skipWaiting and update commands
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
