import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
// import { ReactiveDict } from 'meteor/reactive-dict'

import { Flats } from '../api/flats.js'
import './flats.scss'
import './flats.html'

const MONTH_NAMES = ["Sty", "Lut", "Mar", "Kwi", "Cze", "Lip", "Sie", "Wrz", "Paz", "Lis", "Gru"];


Template.flats.onCreated(function() {
  // this.state = new ReactiveDict()
  Meteor.subscribe('flats')
})

Template.flats.helpers({
  flats() {
    const instance = Template.instance()
    //if (instance.state.get(''))

    return Flats.find({
      hidden: { $ne: true }
    }, {
      sort: { createdAt: 1, _id: 1 }
    })
  },
})

Template.flats.events({
  'click .rate-flat-no'() {
    Meteor.call('flats.switch-rate', this._id, 0)
  },
  'click .rate-flat-could'() {
    Meteor.call('flats.switch-rate', this._id, 1)
  },
  'click .rate-flat-good'() {
    Meteor.call('flats.switch-rate', this._id, 2)
  },
  'click .hide-all-cancelled'() {
    Meteor.call('flats.hide-all-cancelled')
  }
})

Template.flatRow.helpers({
  imageUrl(urls) {
    return urls ? urls[0] : ''
  },
  mapUrl(street) {
    return 'https://maps.google.com/?q='+street.replace(' ', '+')
  },
  isFlatGood(flat) {
    return flat.rate === 2
  },
  isFlatCould(flat) {
    return flat.rate === 1
  },
  isFlatCancelled(flat) {
    return flat.rate === 0
  },
  date(createdAt) {
    return createdAt ? createdAt.getDate() + ' ' + MONTH_NAMES[createdAt.getMonth()-1] : ''
  }
})
