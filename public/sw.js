importScripts('/src/js/idb.js')
importScripts('/src/js/utility.js')

const SERVICE_WORKER_VER = '0.006'
const CACHE_STATIC = 'static-v5'
const CACHE_DYNAMIC = 'dynamic-v2'
const STATIC_FILES = [
  '/',
  'offline.html',
  '/src/js/app.js',
  '/src/js/idb.js',
  '/src/js/feed.js',
  '/src/js/material.min.js',
  '/src/css/app.css',
  '/src/css/feed.css',
  '/src/images/main-image.jpg',
  'https://fonts.googleapis.com/css?family=Roboto:400,700',
  'https://fonts.googleapis.com/icon?family=Material+Icons',
  'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css',
]

//helper function
function isInArray (string, array) {
  var cachePath
  if (string.indexOf(self.origin) === 0) { // request targets domain where we serve the page from (i.e. NOT a CDN)
    cachePath = string.substring(self.origin.length) // take the part of the URL AFTER the domain (e.g. after localhost:8080)
  } else {
    cachePath = string // store the full request (for CDNs)
  }
  return array.indexOf(cachePath) > -1
}

//helper function
// this can be much more sophistacted
function trimCache (cacheName, maxItems) {
  caches.open(cacheName)
    .then(function (cache) {
      cache.keys()
        .then(function (keys) {
          console.log('keys.length', keys.length)
          if (keys.length > maxItems) {
            cache.delete(keys[0])
              .then(trimCache(cacheName, maxItems))
          }
        })
    })
}

self.addEventListener('install', function (event) {
  console.log('[Service Worker] Installing Service Worker ...', event)
  // this at the bottom in async so we need to modify because we cannot control obtaining cache item in fetch
  // caches.open()
  // ↑↑↑↑ therefore we wrap above code in event.waitUntil
  event.waitUntil(
    caches.open(CACHE_STATIC)
      .then(function (cache) {
        console.log('[Service Worker] Precaching app shell')
        // below wont load
        // cache.add('/index.html')

        // let's migrate to addAll function
        // cache.add('/')
        // cache.add('/src/js/app.js')

        cache.addAll(STATIC_FILES)
      })
  )
})

self.addEventListener('activate', function(event) {
  console.log('[Service Worker] Activating Service Worker ....', event)
  // here is a trap - when we will refresh page we still will not see changes
  // we need to close tab and refresh is again
  event.waitUntil(
    caches.keys()
      .then(function (keyList) {
        // promise all - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all
        return Promise.all(keyList.map(function (key) {
          if (key !== CACHE_STATIC && key !== CACHE_DYNAMIC) {
            console.log('[Service Worker] Removing old cache', key)
            return caches.delete(key)
          }
        }))
      })
  )
  caches.keys()
  return self.clients.claim()
});

// below strategy is cache first with network callback
// self.addEventListener('fetch', function(event) {
//   event.respondWith(
//     caches.match(event.request)
//       .then(function (response) {
//         if (response) {
//           console.log('[Service Worker] return response from cache')
//
//           return response
//         } else {
//
//           return fetch(event.request)
//             .then(function (res) {
//               console.log('[Service Worker] fetch response from fetch event')
//
//               return caches.open(CACHE_DYNAMIC)
//                 .then(function (cache) {
//                 // without cloning it will fail on cache loading because they are consumed
//                 cache.put(event.request.url, res.clone())
//
//                 return res
//               })
//             })
//             .catch(function (e) {
//               return caches.open(CACHE_STATIC)
//                 .then(function(cache){
//                   return cache.match('/offline.html')
//                 })
//             })
//         }
//       })
//   )
// });

// below here is cache only strategy
// self.addEventListener('fetch', function(event) {
//   event.respondWith(
//     caches.match(event.request)
//   )
// });

// below here is network only strategy - you can also remove this code
// self.addEventListener('fetch', function(event) {
//   event.respondWith(
//   fetch(event.request)
//   )
// });

// below strategy is network with cache fallback strategy
// self.addEventListener('fetch', function(event) {
//   event.respondWith(
//     fetch(event.request)
//       .then(function (res) {
//         console.log('[Service Worker] fetch response from fetch event')
//
//         return caches.open(CACHE_DYNAMIC)
//           .then(function (cache) {
//             // without cloning it will fail on cache loading because they are consumed
//             cache.put(event.request.url, res.clone())
//
//             return res
//           })
//       })
//       .catch(function (err){
//         return caches.match(event.request)
//       })
//   )
// });

// below strategy is
// on first if optimized for cache first then network in first
// on second we use cache only strategy
// on thirth if cache with network callback (same as first strategy)
self.addEventListener('fetch', function (event) {
  const url = 'https://pwaudemy-893b7-default-rtdb.europe-west1.firebasedatabase.app/posts.json'

  if (event.request.url === url) {
    event.respondWith(
      // we change below from cache to indexedDB
      // caches.open(CACHE_DYNAMIC)
      //   .then(function (cache) {
      //     return fetch(event.request)
      //       .then(function (response) {
      //         cache.put(event.request.url, response.clone())
      //
      //         return response
      //       })
      //   })
      fetch(event.request)
        .then(function (response) {
          var clonedResponse = response.clone()
          // adding clear data before fetching new one
          clearAllData('posts')
            .then(function () {
              return clonedResponse.json()
            })
            .then(function (data) {
              for (var key in data) {
                writeData('posts', data[key])
              }
            })
          return response
        })
    )
  } else if (isInArray(event.request.url, STATIC_FILES)) {
    event.respondWith(
      caches.match(event.request)
    )
  } else {
    event.respondWith(
      caches.match(event.request)
        .then(function (response) {
          if (response) {
            console.log('[Service Worker] return response from cache')
            return response
          } else {
            return fetch(event.request)
              .then(function (res) {
                console.log('[Service Worker] fetch response from fetch event')
                return caches.open(CACHE_DYNAMIC)
                  .then(function (cache) {
                    // without cloning it will fail on cache loading because they are consumed
                    cache.put(event.request.url, res.clone())
                    return res
                  })
              })
              .catch(function (e) {
                return caches.open(CACHE_STATIC)
                  .then(function (cache) {
                    if (event.request.headers.get('accept').includes('text/html')) {
                      return cache.match('/offline.html')
                    }
                  })
              })
          }
        })
    )
  }
})

// we are doing background sync even without internet below
// take a look at /public/src/js/feed.js
self.addEventListener('sync', function (event) {
  console.log('[Service Worker] Background syncing', event)

  if (event.tag === 'sync-new-post') {
    console.log('[Service worker] Syncing new post')
    event.waitUntil(
      readAllData('sync-posts')
        .then(function (data) {
          for (const dt of data) {
            fetch('https://us-central1-pwaudemy-893b7.cloudfunctions.net/storePostData', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              },
              body: JSON.stringify({
                id: dt.id,
                title: dt.title,
                location: dt.location,
                image: dt.image
              })
            })
              .then(function (res) {
                console.log('[Service Worker] Send data: ', res)
                if (res.ok) {
                  res.json()
                    .then(function (resData) {
                      console.log('[Service Worker] Removing item from indexedDB', resData)
                      deleteItemFromData('sync-posts', resData.id)
                    })
                }
              })
              .catch(function (err) {
                console.log(err)
              })
          }
        })
    )
  }
})

// when using
self.addEventListener('notificationclick', function (event) {
  var notification = event.notification
  var action = event.action

  console.log(notification)

  if (action === 'confirm') {
    notification.close()
  } else {
    notification.close()
    // below code is responsible for opening new window
    event.waitUntil(
      clients.matchAll()
        .then(function (clis) {
          var client = clis.find(function (c) {
            return c.visibilityState === 'visible'
          })

          if (client !== undefined) {
            client.navigate(notification.data.openUrl)
          } else {
            clients.openWindow(notification.data.openUrl)
          }
        })
    )
  }
})

// when using notification.close()
self.addEventListener('notificationclose', function (event) {
  console.log('[Service worekrer] Notification closen', event.notification)
})

// when reciving push message from subiscritpion :
// take a look at /public/src/js/app.js and /functions/index.js
self.addEventListener('push', function (event) {
  console.log('[Service Worker] Push notification recived', event)

  var data = { title: 'New!', content: 'Something new happened', openUrl: '/' }

  if (event.data) {
    data = JSON.parse(event.data.text())
  }

  var options = {
    body: data.content,
    icon: '/src/images/icons/app-icon-96x96.png',
    badge: '/src/images/icons/app-icon-96x96.png',
    data: { openUrl: data.openUrl }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})