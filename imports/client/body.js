import { Template } from 'meteor/templating'
import { ReactiveVar } from 'meteor/reactive-var'
import { Session } from 'meteor/session'
import * as RLocalStorage from 'meteor/simply:reactive-local-storage'

import C from './consts.js'

import './flats.js'
import './body.html'
import './body.scss'
import './map.js'

import config from '../config.json'

Template.body.onCreated(function() {
  this.state = new ReactiveDict()
})

Template.body.helpers({
  secret(key) {
    let val = config[key]
    if (!val)
      throw new Error(`Undefined config value for key: ${key}`)

    return val
  },
  settingsOpen() {
    const instance = Template.instance()
    return instance.state.get('settingsOpen')
  },
  isMapOnRight() {
    return RLocalStorage.getItem(C.LOCAL_STORAGE_IS_MAP_ON_RIGHT_KEY)
  },
  isShowingHeartedFlatsOnMap() {
    return RLocalStorage.getItem(C.LOCAL_STORAGE_TOGGLE_HEARTS_KEY)
  },
  isShowingLikedFlatsOnMap() {
    return RLocalStorage.getItem(C.LOCAL_STORAGE_TOGGLE_LIKES_KEY)
  },
  isShowingCustomMarkersOnMap() {
    return RLocalStorage.getItem(C.LOCAL_STORAGE_TOGGLE_CUSTOM_MARKERS_KEY)
  }
})

Template.body.events({
  'click .toggle-settings'(evt, instance) {
    instance.state.set('settingsOpen', !instance.state.get('settingsOpen'))
  },
  'change .checkbox-map-on-right'(evt, instance) {
    RLocalStorage.setItem(
      C.LOCAL_STORAGE_IS_MAP_ON_RIGHT_KEY,
      !RLocalStorage.getItem(C.LOCAL_STORAGE_IS_MAP_ON_RIGHT_KEY)
    )
  },
  'click .btn-map-toggle-hearts'() {
    RLocalStorage.setItem(
      C.LOCAL_STORAGE_TOGGLE_HEARTS_KEY,
      !RLocalStorage.getItem(C.LOCAL_STORAGE_TOGGLE_HEARTS_KEY)
    )
  },
  'click .btn-map-toggle-likes'() {
    RLocalStorage.setItem(
      C.LOCAL_STORAGE_TOGGLE_LIKES_KEY,
      !RLocalStorage.getItem(C.LOCAL_STORAGE_TOGGLE_LIKES_KEY)
    )
  },
  'click .btn-map-toggle-custom-markers'() {
    RLocalStorage.setItem(
      C.LOCAL_STORAGE_TOGGLE_CUSTOM_MARKERS_KEY,
      !RLocalStorage.getItem(C.LOCAL_STORAGE_TOGGLE_CUSTOM_MARKERS_KEY)
    )
  }
})
