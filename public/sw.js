// -----------------------------------------------------------------
// AshokaManas Service Worker (V1 - Play Store Edition)
// -----------------------------------------------------------------
// This file ensures the app loads even when the user has no internet,
// preventing the "Offline Dino" page which causes Play Store rejections.

const CACHE_NAME = 'ashokamanas-cache-v1';

// We cache the monolith (index.html) and critical assets.
// We also cache the Firebase logo to prevent flicker.
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
  'https://firebasestorage.googleapis.com/v0/b/ashokamanas.firebasestorage.app/o/assets%2Flogo.png?alt=media&token=5355e65d-33b4-4698-95b6-dcc09469d78c'
];

// 1. INSTALL PHASE
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching AshokaManas Core Assets');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting(); // Force activation
});

// 2. ACTIVATE PHASE (Cleanup old caches)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.log('[SW] Clearing old cache:', name);
            return caches.delete(name);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. FETCH PHASE (Network First, falling back to Cache)
self.addEventListener('fetch', (event) => {
  // Ignore non-GET requests (like Firebase POSTs)
  if (event.request.method !== 'GET') return;

  // Ignore cross-origin requests unless it's our specific logo
  if (!event.request.url.startsWith(self.location.origin) && 
      !event.request.url.includes('firebasestorage.googleapis.com')) {
    return;
  }

  event.respondWith(
    fetch(event.request).catch(() => {
      console.log('[SW] Network failed, serving from cache:', event.request.url);
      return caches.match(event.request);
    })
  );
});
