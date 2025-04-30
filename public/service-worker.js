/**
 * Service Worker for Aidant-Aide-Offline
 * 
 * This service worker handles:
 * 1. Caching for offline support
 * 2. Background notifications
 * 3. Notification click events
 * 4. Periodic sync for updating reminders
 */

// Cache name and assets to cache
const CACHE_NAME = 'aidant-aide-offline-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  // Add other static assets here
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing Service Worker');
  
  // Skip waiting to ensure the new service worker activates immediately
  self.skipWaiting();
  
  // Cache static assets
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching app shell');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating Service Worker');
  
  // Claim clients to ensure the service worker controls all clients
  event.waitUntil(self.clients.claim());
  
  // Clean up old caches
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  // Only cache GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip non-HTTP(S) requests
  if (!event.request.url.startsWith('http')) return;
  
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Return cached response if available
      if (cachedResponse) {
        return cachedResponse;
      }
      
      // Otherwise fetch from network
      return fetch(event.request)
        .then((response) => {
          // Don't cache non-successful responses or non-GET requests
          if (!response || response.status !== 200 || event.request.method !== 'GET') {
            return response;
          }
          
          // Clone the response as it can only be consumed once
          const responseToCache = response.clone();
          
          // Cache the response for future use
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          
          return response;
        })
        .catch(() => {
          // If both cache and network fail, return a fallback
          if (event.request.url.indexOf('/api/') !== -1) {
            // For API requests, return a JSON error
            return new Response(JSON.stringify({ error: 'Network error' }), {
              headers: { 'Content-Type': 'application/json' },
              status: 503
            });
          }
          
          // For page requests, return the offline page
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }
          
          // Otherwise, just return an error response
          return new Response('Network error', { status: 503 });
        });
    })
  );
});

// Store for scheduled notifications
const scheduledNotifications = new Map();

// Message event - handle messages from the client
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Message received:', event.data);
  
  const { type, reminder, options, id } = event.data;
  
  switch (type) {
    case 'SCHEDULE_NOTIFICATION':
      if (reminder && options) {
        // Store the notification details
        scheduledNotifications.set(reminder.id, { reminder, options });
        
        // Schedule the notification if the browser supports showTrigger
        if ('showTrigger' in Notification.prototype) {
          self.registration.showNotification(reminder.title, options)
            .then(() => {
              console.log(`[Service Worker] Scheduled notification ${reminder.id}`);
            })
            .catch((error) => {
              console.error('[Service Worker] Error scheduling notification:', error);
            });
        }
      }
      break;
      
    case 'CANCEL_NOTIFICATION':
      if (id) {
        // Remove from our map
        scheduledNotifications.delete(id);
        
        // Cancel any pending notifications with this tag
        self.registration.getNotifications({ tag: `reminder-${id}` })
          .then((notifications) => {
            notifications.forEach((notification) => notification.close());
          });
      }
      break;
      
    case 'SYNC_REMINDERS':
      // Notify all clients to sync their reminders
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: 'SYNC_REMINDERS'
          });
        });
      });
      break;
  }
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked:', event.notification);
  
  // Close the notification
  event.notification.close();
  
  // Get the notification data
  const { url } = event.notification.data || { url: '/' };
  
  // Focus or open a window and navigate to the URL
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientList) => {
      // Check if there's already a window/tab open with the target URL
      for (const client of clientList) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus();
        }
      }
      
      // If no window/tab is open with the URL, open a new one
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })
  );
});

// Periodic sync event (if supported)
// This requires the periodic background sync API, which is still experimental
if ('periodicSync' in self.registration) {
  self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'sync-reminders') {
      console.log('[Service Worker] Periodic sync for reminders');
      
      // Notify clients to sync reminders
      event.waitUntil(
        self.clients.matchAll().then((clients) => {
          clients.forEach((client) => {
            client.postMessage({
              type: 'SYNC_REMINDERS'
            });
          });
        })
      );
    }
  });
}

// Push notification event (for future use with web push)
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push message received:', event);
  
  if (!event.data) return;
  
  try {
    const data = event.data.json();
    
    // Show notification
    event.waitUntil(
      self.registration.showNotification(data.title, {
        body: data.body,
        icon: data.icon || '/favicon.ico',
        badge: data.badge || '/favicon.ico',
        data: data.data || {}
      })
    );
  } catch (error) {
    console.error('[Service Worker] Error processing push message:', error);
  }
});

// Log any errors
self.addEventListener('error', (event) => {
  console.error('[Service Worker] Error:', event.message, event.filename, event.lineno);
});
