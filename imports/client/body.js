import { Template } from 'meteor/templating'
import { ReactiveVar } from 'meteor/reactive-var'
import { Session } from 'meteor/session'
// import { ReactiveDict } from 'meteor/reactive-dict'

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
    let settings = Session.get('settings')
    if (!settings)
      return false

    return !!settings.isMapOnRight
  }
})

Template.body.events({
  'click .toggle-settings'(evt, instance) {
    instance.state.set('settingsOpen', !instance.state.get('settingsOpen'))
  },
  'change .checkbox-map-on-right'(evt, instance) {
    let settings = Session.get('settings')
    if (!settings) {
      settings = {}
    }
    
    settings.isMapOnRight = evt.currentTarget.checked
    Session.set('settings', settings)
  }
})
