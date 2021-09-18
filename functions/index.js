const functions = require('firebase-functions')
var admin = require('firebase-admin')
var cors = require('cors')({ origin: true })
// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
var serviceAccount = require('./pwaudemy-893b7-firebase-adminsdk-9ry6h-7848906e38.json')
var webpush = require('web-push')

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://pwaudemy-893b7-default-rtdb.europe-west1.firebasedatabase.app/'
})

exports.storePostData = functions.https.onRequest(function (request, response) {
  cors(request, response, function () {
    admin.database().ref('posts').push({
      id: request.body.id,
      title: request.body.title,
      location: request.body.location,
      image: request.body.image
    })
      .then(function () {
        webpush.setVapidDetails(
          'mailto:piotr.zat@gmail.com',
          'BELBnbB_iGLDFJgUuG8ojYDLb6RtF9tLtn-UoZqqowbmuP8HseypmtnV9Z3qtQZIfrCjNeNfSnWYmU8lIN39Yho',
          '7G1B5hRIvDIkoCHRbaKvBnvmNyXounSGlKHp3vnFcBU'
        )
        return admin.database().ref('subscriptions').once('value')
      })
      .then(function (subscriptions) {
        subscriptions.forEach(function (sub) {
          var pushConfig = {
            endpoint: sub.val().endpoint,
            keys: {
              auth: sub.val().keys.auth,
              p256dh: sub.val().keys.p256dh
            }
          }

          webpush.sendNotification(pushConfig, JSON.stringify({
            title: 'New Post added',
            content: 'New Post added!',
            openUrl: '/help'
          }))
        })

        response.status(201).json({ message: 'Data Stored', id: request.body.id })
      })
      .catch(function (err) {
        response.status(500).json({ error: err })
      })
  })
})
