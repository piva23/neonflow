const CACHE_NAME = 'neonflow-pwa-v2.0.2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg'
];

// Install Event: Pre-cache core shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: Robust Cache-First and Stale-While-Revalidate with guaranteed Response return
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests or external API calls / streaming media
  if (request.method !== 'GET') return;
  if (
    url.origin.includes('youtube.com') ||
    url.origin.includes('ytimg.com') ||
    url.origin.includes('googlevideo.com') ||
    url.origin.includes('rapidapi.com') ||
    url.hostname.includes('rapidapi')
  ) {
    return;
  }

  // HTML Navigation Requests -> Network First, fallback to cached index.html or offline response
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put('/', responseClone));
          }
          return response;
        })
        .catch(async () => {
          try {
            const cachedRoot = await caches.match('/');
            if (cachedRoot) return cachedRoot;
            const cachedIndex = await caches.match('/index.html');
            if (cachedIndex) return cachedIndex;
          } catch (e) {
            // Ignore cache read errors
          }
          return new Response('<html><body><h1>NeonFlow Offline</h1><p>Conecte-se à internet para carregar esta página.</p></body></html>', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
          });
        })
    );
    return;
  }

  // Static Assets (JS, CSS, Images, Fonts) -> Cache First / Stale-While-Revalidate with fail-safe Response
  event.respondWith(
    caches.match(request).then(async (cachedResponse) => {
      if (cachedResponse) {
        // Trigger background update if online
        fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
              caches.open(CACHE_NAME).then((cache) => cache.put(request, networkResponse.clone()));
            }
          })
          .catch(() => {
            // Silently ignore background fetch failure
          });
        return cachedResponse;
      }

      try {
        const networkResponse = await fetch(request);
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseToCache));
        }
        return networkResponse;
      } catch (networkErr) {
        // Return a valid Response error so Service Worker does not crash
        return Response.error();
      }
    })
  );
});

// Listen for message to skip waiting
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
