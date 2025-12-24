/**
 * Orbit Service Worker
 *
 * Provides offline support and caching for the Orbit app.
 * Strategy: Cache-first for static assets, network-first for API calls.
 */

const CACHE_NAME = 'orbit-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/bundle.js',
  '/sounds/Space Ambience.mp3',
  '/sounds/17640 futuristic prompt-full.mp3',
  '/sounds/Futuristic Reveal.wav',
  '/sounds/Futuristic Feature Select.mp3',
  '/sounds/Futuristic Power Generation.wav',
];

// =============================================================================
// Install Event
// =============================================================================

self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => {
      // Skip waiting to activate immediately
      return self.skipWaiting();
    })
  );
});

// =============================================================================
// Activate Event
// =============================================================================

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');

  event.waitUntil(
    // Clean up old caches
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => {
      // Take control of all clients immediately
      return self.clients.claim();
    })
  );
});

// =============================================================================
// Fetch Event
// =============================================================================

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) return;

  // Use cache-first strategy for static assets
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Use stale-while-revalidate for everything else
  event.respondWith(staleWhileRevalidate(request));
});

// =============================================================================
// Caching Strategies
// =============================================================================

/**
 * Cache-first: Return cached version if available, fall back to network
 */
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.error('[SW] Cache-first fetch failed:', error);
    return new Response('Offline', { status: 503 });
  }
}

/**
 * Stale-while-revalidate: Return cached version immediately, update in background
 */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  // Start network request in background
  const networkPromise = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch((error) => {
    console.error('[SW] Network request failed:', error);
    return null;
  });

  // Return cached version immediately if available
  if (cached) {
    return cached;
  }

  // Wait for network if no cache
  const networkResponse = await networkPromise;
  if (networkResponse) {
    return networkResponse;
  }

  return new Response('Offline', { status: 503 });
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Check if a path is a static asset
 */
function isStaticAsset(pathname) {
  const staticExtensions = ['.js', '.css', '.html', '.png', '.jpg', '.svg', '.mp3', '.wav'];
  return staticExtensions.some((ext) => pathname.endsWith(ext)) || pathname === '/';
}

// =============================================================================
// Background Sync (for future use)
// =============================================================================

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-items') {
    console.log('[SW] Background sync triggered');
    // Future: sync items with server
  }
});

// =============================================================================
// Push Notifications (for future use)
// =============================================================================

self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  console.log('[SW] Push received:', data);

  const options = {
    body: data.body || 'You have items needing attention',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'orbit-notification',
    renotify: true,
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Orbit', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Focus existing window if available
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // Open new window
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

console.log('[SW] Service worker loaded');
