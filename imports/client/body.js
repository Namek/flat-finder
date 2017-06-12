import { Template } from 'meteor/templating'
import { ReactiveVar } from 'meteor/reactive-var'
// import { ReactiveDict } from 'meteor/reactive-dict'

import './flats.js'
import './body.html'
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
  }
})

Template.body.events({
  'click .toggle-settings'(evt, instance) {
    instance.state.set('settingsOpen', !instance.state.get('settingsOpen'))
  }
})
