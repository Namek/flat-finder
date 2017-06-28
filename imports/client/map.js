import { Template } from 'meteor/templating'
import { Tracker } from 'meteor/tracker'
import { ReactiveVar } from 'meteor/reactive-var'
import * as RLocalStorage from 'meteor/simply:reactive-local-storage'

import C from './consts.js'
import { Flats } from '../api/flats.js'
import { Memo } from '../api/memo.js'

import './map.html'
import './map.scss'


/**
 * key: flat._id
 * value example:
 * {
 *   flatId,
 *   marker
 * }
 */
let flatToMarkerInfo = {}


Template.map.onRendered(function() {
  let clockId = Meteor.setInterval(() => {
    if (window.google) {
      Meteor.clearInterval(clockId)
      initMap()
    }
  }, 200)
})


function memoizedGeocode(geocoder, address) {
  return new Promise((resolve, reject) => {
    if (!address) {
      reject({status: "NO_SEARCH_TEXT"})
      return
    }

    const key = 'geo_text: ' + address

    let memo = Memo.findOne({key})
    if (memo) {
      resolve(memo.value)
      return
    }

    geocoder.geocode({address}, (results, status) => {
      if (status === 'OK') {
        Memo.insert({ key, value: results })
        resolve(results)
      }
      else {
        reject({results, status, address})
      }
    })
  })
}

function initMap() {
  let mapEl = document.getElementById('map')
  let map = new google.maps.Map(mapEl, {
    center: {lat: -34.397, lng: 150.644},
    zoom: 15
  })
  let infoWindow = new google.maps.InfoWindow()
  let geocoder = new google.maps.Geocoder()

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(pos => {
      let center = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude
      }

      infoWindow.setPosition(center)
      infoWindow.setContent("You are here.")
      infoWindow.open(map)
      map.setCenter(center)
    }, () => { /* ignore errors */ })
  }

  AppServices.registerService('Map', {
    textSearch(text) {
      memoizedGeocode(geocoder, text)
        .then(results => {
          let pos = results[0].geometry.location

          // let center = {
          //   lat: pos.coords.latitude,
          //   lng: pos.coords.longitude
          // }

          infoWindow.setPosition(pos)
          infoWindow.setContent(text)
          infoWindow.open(map)
          map.setCenter(pos)
        }, err => {
          console.error(err)
        })
    },
    scrollToMap() {
      mapEl.scrollIntoView(true)
    },
    addFlatMarker(flatId, text) {
      return memoizedGeocode(geocoder, text)
        .then(results => {
          let position = results[0].geometry.location
          infoWindow.close()

          let marker = new google.maps.Marker({
            map,
            position,
            title: text
          })

          flatToMarkerInfo[flatId] = {
            flatId,
            marker
          }
        })
    },
    removeFlatMarker(flatId) {
      let info = flatToMarkerInfo[flatId]
      if (!info) {
        return
      }

      info.marker.setMap(null)
      delete flatToMarkerInfo[flatId]
    }
  })

  Tracker.autorun(() => {
    let heartsVisible = RLocalStorage.getItem(C.LOCAL_STORAGE_TOGGLE_HEARTS_KEY)
    let likedVisible = RLocalStorage.getItem(C.LOCAL_STORAGE_TOGGLE_LIKES_KEY)
    
    let filter = { hidden: { $ne: true } }
    let conds = []

    if (heartsVisible) {
      conds.push({ 'rate': { $eq: C.FLAT_RATE_GOOD } })
    }

    if (likedVisible) {
      conds.push({ 'rate': { $eq: C.FLAT_RATE_COULD } })
    }

    if (heartsVisible && likedVisible) {
      filter.$or = conds
    }
    else if (heartsVisible || likedVisible) {
      Object.assign(filter, conds[0])
    }

    let flats = Flats.find(filter, {
      sort: { createdAt: 1, _id: 1 }
    }).fetch()

    // let's remove some old markers
    for (let flatId in flatToMarkerInfo) {
      let flat = flats.find(f => f._id == flatId)

      if (!flat) {
        AppServices.Map.removeFlatMarker(flatId)
      }
    }

    // now let's add some new markers
    let promise = Promise.resolve()

    for (let flat of flats) {
      if (flatToMarkerInfo[flat._id]) {
        // it already exists on map!
        continue
      }

      if (!flat.street) {
        continue
      }

      function invoke() {
        return AppServices.Map.addFlatMarker(flat._id, `${flat.location}, ${flat.street}`)
      }

      promise = promise.then(
        () => invoke(),
        () => Meteor.setTimeout(() => invoke(), 1000)
      )
    }

    promise.then(() => { }, () => { })
  })
}