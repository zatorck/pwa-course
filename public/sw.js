const serviceWorkerVersion = '0.002'

self.addEventListener('install', function (event) {
  console.log('[Service Worker] Installing Service Worker...', event)
})

self.addEventListener('activate', function (event) {
  console.log('[Service Worker] Activating service worker...', event)
  return self.clients.claim()
})

self.addEventListener('fetch', function (event) {
  console.log('[Service Worker] Fetching something....', event)
  event.respondWith(fetch(event.request))
})