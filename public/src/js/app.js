var defferedPrompt

if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('/sw.js')
    .then(function () {
      console.log('[app.js] Service Worker register')
    })
}

window.addEventListener('beforeinstallprompt', function (event) {
  console.log('[app.js] beforeinstallprompt ')
  event.preventDefault()
  defferedPrompt = event
  return false
})

fetch('http://httpbin.org/ip').then(function (response) {
  console.log(response)
  return response.json()
}).then(function (data) {
  console.log(data)
}).catch(function (err) {
  console.log(err)
})

fetch('http://httpbin.org/post', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ message: 'Does this work?' })
}).then(function (response) {
  console.log(response)
  return response.json()
}).then(function (data) {
  console.log(data)
}).catch(function (err) {
  console.log(err)
})

// promise example
var promise = new Promise(function (resolve, reject) {
  setTimeout(function () {
    if (Math.floor(Math.random() * 2) == 0) {
      resolve('This code is executed after timeout')
    } else {
      reject({ code: 500, message: 'Random err message' })
    }
    // console.log('This code is executed after timeout')
  }, 3000)
})

promise.then(function (text) {
  return text + '!'
}).then(function (chainText) {
  console.log(chainText) // this will return text + '!'
}).catch(function (err) {
  console.log(err)
})

console.log('This code is executed straight after setTimeout()')