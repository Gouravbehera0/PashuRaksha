// ============================================================
// PASHURAKSHA (पशुरक्षा) — SERVICE WORKER
// Stage 6: Rural Offline Application Shell & Asset Caching
// ============================================================

const CACHE_NAME = 'pashuraksha-shell-v1'
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/icons.svg',
  '/manifest.json',
]

// Install: Cache critical application shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS)
    }).then(() => self.skipWaiting())
  )
})

// Activate: Clean up prior caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key)
          }
        })
      )
    }).then(() => self.clients.claim())
  )
})

// Fetch: Offline fallback for navigation and cached shell assets
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET and cross-origin external API requests
  if (request.method !== 'GET') return
  if (url.origin !== self.location.origin) {
    // External fonts and styles can be cached
    if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
      event.respondWith(
        caches.match(request).then((cached) => {
          return cached || fetch(request).then((response) => {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
            return response
          }).catch(() => cached)
        })
      )
    }
    return
  }

  // SPA navigation handling (serve index.html when offline)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match('/index.html')
      })
    )
    return
  }

  // Stale-while-revalidate for local scripts and styles
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
        }
        return networkResponse
      }).catch(() => cachedResponse)

      return cachedResponse || fetchPromise
    })
  )
})
