// --- KairOS Service Worker ---
// Minimal service worker to prevent 404 errors and enable PWA functionality
// This elegant implementation focuses on essential features while maintaining performance

const CACHE_NAME = 'kairos-v1'
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.ico'
]

// --- Installation: Cache essential resources ---
self.addEventListener('install', event => {
  console.log('🚀 KairOS Service Worker installing...')
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 Caching essential assets')
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => {
        console.log('✅ KairOS Service Worker installed successfully')
        // Take control immediately
        return self.skipWaiting()
      })
      .catch(error => {
        console.warn('⚠️ Service Worker installation failed:', error)
      })
  )
})

// --- Activation: Clean up old caches ---
self.addEventListener('activate', event => {
  console.log('🔄 KairOS Service Worker activating...')
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => cacheName !== CACHE_NAME)
            .map(cacheName => {
              console.log('🗑️ Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            })
        )
      })
      .then(() => {
        console.log('✅ KairOS Service Worker activated')
        // Take control of all pages immediately
        return self.clients.claim()
      })
  )
})

// --- Fetch Strategy: Network first with cache fallback ---
// Optimized for development - always try network first
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return
  }
  
  // Skip chrome-extension and other non-http requests
  if (!event.request.url.startsWith('http')) {
    return
  }
  
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // If successful, clone and cache the response for static assets
        if (response.ok && STATIC_ASSETS.some(asset => event.request.url.endsWith(asset))) {
          const responseClone = response.clone()
          caches.open(CACHE_NAME)
            .then(cache => cache.put(event.request, responseClone))
            .catch(error => console.warn('Cache put failed:', error))
        }
        return response
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(event.request)
          .then(cachedResponse => {
            if (cachedResponse) {
              console.log('📱 Serving from cache:', event.request.url)
              return cachedResponse
            }
            
            // If it's a navigation request, return a basic offline page
            if (event.request.mode === 'navigate') {
              return new Response(`
                <!DOCTYPE html>
                <html lang="en">
                <head>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1">
                  <title>KairOS - Offline</title>
                  <style>
                    body { 
                      font-family: system-ui, sans-serif; 
                      text-align: center; 
                      padding: 2rem;
                      background: #0a0a0a;
                      color: #fff;
                    }
                    .logo { font-size: 2rem; margin-bottom: 1rem; }
                  </style>
                </head>
                <body>
                  <div class="logo">kairOS</div>
                  <h1>You're offline</h1>
                  <p>Please check your connection and try again.</p>
                  <button onclick="location.reload()">Retry</button>
                </body>
                </html>
              `, {
                headers: { 'Content-Type': 'text/html' }
              })
            }
            
            throw new Error('No cache match found')
          })
      })
  )
})

// --- Background Sync: Handle offline actions ---
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    console.log('🔄 Background sync triggered')
    // Handle background sync for NFC operations when back online
    event.waitUntil(handleBackgroundSync())
  }
})

async function handleBackgroundSync() {
  try {
    // Placeholder for future background sync functionality
    // This could handle queued NFC operations, crypto computations, etc.
    console.log('✅ Background sync completed')
  } catch (error) {
    console.warn('⚠️ Background sync failed:', error)
  }
}

// --- Push Notifications: Handle incoming notifications ---
self.addEventListener('push', event => {
  if (!event.data) return
  
  const data = event.data.json()
  const options = {
    body: data.body,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    vibrate: [100, 50, 100],
    data: data.data,
    actions: [
      {
        action: 'open',
        title: 'Open KairOS'
      }
    ]
  }
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'KairOS', options)
  )
})

// --- Notification Click: Handle notification interactions ---
self.addEventListener('notificationclick', event => {
  event.notification.close()
  
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      self.clients.matchAll({ type: 'window' })
        .then(clients => {
          // Focus an existing window if available
          for (const client of clients) {
            if (client.url.includes(self.location.origin)) {
              return client.focus()
            }
          }
          // Otherwise, open a new window
          return self.clients.openWindow('/')
        })
    )
  }
})

console.log('🎯 KairOS Service Worker loaded and ready') 