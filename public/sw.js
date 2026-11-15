/**
 * AFTERLIGHT — Offline-First Museum Service Worker
 * Caches core app shell, fonts, textures, manifests, and 3D models
 * for rural schools and offline classroom kiosks.
 */

const CACHE_NAME = 'afterlight-v1';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/data/parts.moon.json',
  '/data/parts.perseverance.json',
  '/data/parts.insight.json',
  '/data/parts.mars.json',
  '/textures/moon/ldem_3_8bit.jpg',
  '/textures/moon/lroc_color_2k.jpg',
  '/textures/mars/mars_color_2k.jpg',
  '/textures/mars/mars_mola_dem_1024.jpg',
  '/images/apollo11_surface.jpg',
  '/images/spaceship-cursor-isolated.png',
];

// Install Event — pre-cache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[AFTERLIGHT SW] Pre-caching museum shell and planetary assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate Event — cleanup old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[AFTERLIGHT SW] Clearing legacy cache:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event — Network-first for dynamic queries, Cache-first for models & textures
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Cache-first for models, textures, and data JSONs
  if (
    url.pathname.startsWith('/models/') ||
    url.pathname.startsWith('/textures/') ||
    url.pathname.startsWith('/data/') ||
    url.pathname.startsWith('/images/')
  ) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // Network-first with cache fallback for HTML / JS / CSS
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          if (event.request.headers.get('accept')?.includes('text/html')) {
            return caches.match('/index.html');
          }
        });
      })
  );
});
