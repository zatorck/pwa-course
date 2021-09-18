var shareImageButton = document.querySelector('#share-image-button')
var createPostArea = document.querySelector('#create-post')
var closeCreatePostModalButton = document.querySelector('#close-create-post-modal-btn')
var sharedMomentsArea = document.querySelector('#shared-moments')
var form = document.querySelector('form')
var titleInput = document.querySelector('#title')
var locationInput = document.querySelector('#location')

function openCreatePostModal () {
  createPostArea.style.display = 'block'
  if (deferredPrompt) {
    deferredPrompt.prompt()

    deferredPrompt.userChoice.then(function (choiceResult) {
      console.log(choiceResult.outcome)

      if (choiceResult.outcome === 'dismissed') {
        console.log('User cancelled installation')
      } else {
        console.log('User added to home screen')
      }
    })

    deferredPrompt = null
  }
}

function closeCreatePostModal () {
  createPostArea.style.display = 'none'
}

shareImageButton.addEventListener('click', openCreatePostModal)

closeCreatePostModalButton.addEventListener('click', closeCreatePostModal)

function clearCards () {
  while (sharedMomentsArea.hasChildNodes()) {
    sharedMomentsArea.removeChild(sharedMomentsArea.lastChild)
  }
}

function createCard (data) {
  var cardWrapper = document.createElement('div')
  cardWrapper.className = 'shared-moment-card mdl-card mdl-shadow--2dp'
  var cardTitle = document.createElement('div')
  cardTitle.className = 'mdl-card__title'
  cardTitle.style.backgroundImage = 'url("' + data.image + '")'
  cardTitle.style.backgroundSize = 'cover'
  cardTitle.style.height = '180px'
  cardWrapper.appendChild(cardTitle)
  var cardTitleTextElement = document.createElement('h2')
  cardTitleTextElement.style.color = 'white'
  cardTitleTextElement.className = 'mdl-card__title-text'
  cardTitleTextElement.textContent = data.title
  cardTitle.appendChild(cardTitleTextElement)
  var cardSupportingText = document.createElement('div')
  cardSupportingText.className = 'mdl-card__supporting-text'
  cardSupportingText.textContent = data.location
  cardSupportingText.style.textAlign = 'center'
  // we are not using it for now but it can be very usefull snippet
  // var cardSaveButton = document.createElement('button')
  // cardSaveButton.textContent = 'save'
  // cardSaveButton.addEventListener('click', function () {
  //   // below won't work as 'caches' in navigator
  //   if ('caches' in window) {
  //     caches.open('user-requested')
  //       .then(function (cache) {
  //         cache.addAll([
  //           'https://httpbin.org/get',
  //           '/src/images/sf-boat.jpg'
  //         ])
  //       })
  //   }
  // })
  // cardSupportingText.appendChild(cardSaveButton)
  cardWrapper.appendChild(cardSupportingText)
  componentHandler.upgradeElement(cardWrapper)
  sharedMomentsArea.appendChild(cardWrapper)
}

function updateUI (data) {
  clearCards()

  for (var i = 0; i < data.length; i++) {
    createCard(data[i])
  }
}

const url = 'https://pwaudemy-893b7-default-rtdb.europe-west1.firebasedatabase.app/posts.json'
var getFromNetwork = false

fetch(url)
  .then(function (res) {
    return res.json()
  })
  .then(function (data) {
    getFromNetwork = true
    console.log('[Feed.js] from network', data)

    var dataArray = []
    for (var key in data) {
      dataArray.push(data[key])
    }

    updateUI(dataArray)
  })


// we are moving from cache first then network strategy from first
// if ('caches' in window) {
//   caches.match(url)
//     .then(function (response) {
//       if (response) {
//         return response.json()
//       }
//     })
//     .then(function (data) {
//       if (!getFromNetwork) {
//         var dataArray = []
//         for (var key in data) {
//           dataArray.push(data[key])
//         }
//
//         updateUI(dataArray)
//       }
//     })
// }

if ('indexedDB' in window) {
  readAllData('posts')
    .then(function (data) {
      if (!getFromNetwork) {
        console.log('[Feed.js]   from cache', data)
        updateUI(data)
      }
    })
}

// below we are making form submitting with background sync
form.addEventListener('submit', function (event) {
  event.preventDefault()

  if (titleInput.value.trim() === '' || locationInput.value.trim() === '') {
    alert('Please enter valid data')
    return
  }

  closeCreatePostModal()

  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    navigator.serviceWorker.ready
      .then(function (sw) {
        var post = {
          id: new Date().toISOString(),
          title: titleInput.value,
          location: locationInput.value,
          image: 'https://www.udemy.com/staticx/udemy/images/v7/logo-udemy-inverted.svg'
        }
        writeData('sync-posts', post)
          .then(function () {
            return sw.sync.register('sync-new-post')
          })
          .then(function () {
            var sanckbarContainer = document.querySelector('#confirmation-toast')
            var data = { message: 'Your post was saved for syncing!' }
            sanckbarContainer.MaterialSnackbar.showSnackbar(data)
          })
          .catch(function (err) {
            console.log(err)
          })
      })
  } else {
    sendData()
  }
})

function sendData () {
  fetch('https://us-central1-pwaudemy-893b7.cloudfunctions.net/storePostData', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      id: new Date().toISOString(),
      title: titleInput.value,
      location: locationInput.value,
      image: 'https://www.udemy.com/staticx/udemy/images/v7/logo-udemy-inverted.svg'
    })
  })
    .then(function (res) {
      console.log('[feed.js] Send data: ', res)
      updateUI()
    })
}