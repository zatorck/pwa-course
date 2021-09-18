var deferredPrompt
var enableNotificationsButtons = document.querySelectorAll('.enable-notifications')

if (!window.Promise) {
  window.Promise = Promise
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('/sw.js')
    .then(function () {
      console.log('Service worker registered!')
    })
    .catch(function (err) {
      console.log(err)
    })
}

window.addEventListener('beforeinstallprompt', function (event) {
  console.log('beforeinstallprompt fired')
  event.preventDefault()
  deferredPrompt = event
  return false
})

function displayConfirmNotification () {
  var options = {
    body: 'You succesfully subscribe to our notification service system',
    icon: '/src/images/icons/app-icon-96x96.png',
    image: '/src/images/sf-boat.jps',
    dir: 'ltr',
    lang: 'en-US', // BCP 47
    vibrate: [100, 50, 200], // vibrate time, puase time, vibrate time....
    badge: '/src/images/icons/app-icon-96x96.png',
    tag: 'confirm-notification', // tag used for indetyfing last notification of type
    renotify: true, // don't alter tagged notification siletly
    actions: [
      { action: 'confirm', title: 'Okay', icon: '/src/images/icons/app-icon-96x96.png' },
      { action: 'cancel', title: 'Cancel', icon: '/src/images/icons/app-icon-96x96.png' },
    ]
  }

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then(function (swreg) {
        swreg.showNotification('Notify from SW' + Math.random(), options)
      })
  }

  // example of native notification
  // new Notification('Sucesfully subsribe', options)
}

function configurePushSub () {
  if (!('serviceWorker' in navigator)) {
    return
  }
  var reg
  navigator.serviceWorker.ready
    .then(function (swreg) {
      reg = swreg
      return swreg.pushManager.getSubscription()
    })
    .then(function (sub) {
      if (sub === null) {
        var vapidPublicKey = 'BELBnbB_iGLDFJgUuG8ojYDLb6RtF9tLtn-UoZqqowbmuP8HseypmtnV9Z3qtQZIfrCjNeNfSnWYmU8lIN39Yho'
        var convertedVapidPublicKey = urlBase64ToUint8Array(vapidPublicKey)
        return reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidPublicKey
        })
      } else {
console.log('sub existings')
      }
    })
    .then(function (newSub) {
      return fetch('https://pwaudemy-893b7-default-rtdb.europe-west1.firebasedatabase.app/subscriptions.json', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(newSub)
      })
    })
    .then(function (res) {
      if (res.ok) {
        displayConfirmNotification()
      }
    })
    .catch(function (err){
      console.log(err)
    })
}

// showing notification permision (native)
function addForNotificationPermission () {
  Notification.requestPermission(function (result) {
    if (result !== 'granted') {
      console.log('No notification permission granted')
    } else {
      configurePushSub()
    }
  })
}

// here we are showing notification subscrbiction button
if ('Notification' in window) {
  for (var i = 0; i < enableNotificationsButtons.length; i++) {
    enableNotificationsButtons[i].style.display = 'inline-block'
    enableNotificationsButtons[i].addEventListener('click', addForNotificationPermission)
  }
}

