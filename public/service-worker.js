// Service Worker for Tailor's Vault PWA
const CACHE_NAME = 'tailors-vault-v1';
const STATIC_CACHE_NAME = 'tailors-vault-static-v1';

// Assets to cache on install (app shell)
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  'https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching static assets');
      return Promise.allSettled(
        STATIC_ASSETS.map(url => {
          return fetch(url).then(response => {
            if (response.ok) {
              return cache.put(url, response);
            }
          }).catch(err => {
            console.warn(`[Service Worker] Failed to cache ${url}:`, err);
          });
        })
      ).then(() => {
        console.log('[Service Worker] Static assets cached');
      });
    })
  );
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete old caches
          if (cacheName !== STATIC_CACHE_NAME && cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Take control of all pages immediately
  return self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // DO NOT cache Supabase API requests
  if (url.hostname.includes('supabase.co') || 
      url.hostname.includes('supabase') ||
      url.pathname.includes('/rest/v1/') ||
      url.pathname.includes('/auth/v1/')) {
    // Always fetch from network for Supabase requests
    event.respondWith(fetch(event.request));
    return;
  }
  
  // DO NOT cache authentication redirects or API calls
  if (url.pathname.includes('/auth/') || 
      url.searchParams.has('access_token') ||
      url.searchParams.has('refresh_token')) {
    event.respondWith(fetch(event.request));
    return;
  }
  
  // For static assets, use cache-first strategy
  if (event.request.method === 'GET' && 
      (event.request.destination === 'script' ||
       event.request.destination === 'style' ||
       event.request.destination === 'image' ||
       event.request.destination === 'font' ||
       url.pathname.endsWith('.css') ||
       url.pathname.endsWith('.js') ||
      url.pathname.endsWith('.png') ||
      url.pathname.endsWith('.jpg') ||
      url.pathname.endsWith('.jpeg') ||
      url.pathname.endsWith('.JPG') ||
      url.pathname.endsWith('.svg') ||
      url.pathname.endsWith('.woff') ||
      url.pathname.endsWith('.woff2'))) {
    
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        // Return cached version if available
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // Otherwise fetch from network
        return fetch(event.request).then((response) => {
          // Don't cache if not a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clone the response
          const responseToCache = response.clone();
          
          // Cache the new response
          caches.open(STATIC_CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          
          return response;
        }).catch(() => {
          // If network fails and we have a cached version, return it
          // Otherwise return a basic offline page if it's a navigation request
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }
        });
      })
    );
  } else {
    // For other requests (HTML, etc.), try network first, fallback to cache
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Fallback to home page for navigation requests
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }
        });
      })
    );
  }
});

