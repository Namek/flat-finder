import { Template } from 'meteor/templating'
import { ReactiveVar } from 'meteor/reactive-var'

import './map.html'
import './map.scss'



Template.map.onRendered(function() {
  let clockId = Meteor.setInterval(() => {
    if (window.google) {
      Meteor.clearInterval(clockId)
      initMap()
    }
  }, 200)
})


function initMap() {
  let map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: -34.397, lng: 150.644},
    zoom: 15
  })
  let infoWindow = new google.maps.InfoWindow()

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
}