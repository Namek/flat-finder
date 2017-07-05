import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

import C from './consts.js';
import { Flats } from '../api/flats.js';
import './flats.scss';
import './flats.html';

const MONTH_NAMES = ['Sty', 'Lut', 'Mar', 'Kwi', 'Cze', 'Lip', 'Sie', 'Wrz', 'Paz', 'Lis', 'Gru'];


Template.flats.onCreated(() => {
  // this.state = new ReactiveDict()
  Meteor.subscribe('flats');
});

Template.flats.helpers({
  flats () {
    return Flats.find({
      hidden: { $ne: true },
    }, {
      sort: { createdAt: 1, _id: 1 },
    });
  },
});

Template.flats.events({
  'click .rate-flat-no': function switchRateToNo () {
    Meteor.call('flats.switch-rate', this._id, C.FLAT_RATE_NO);
  },
  'click .rate-flat-could': function switchRateToCould () {
    Meteor.call('flats.switch-rate', this._id, C.FLAT_RATE_COULD);
  },
  'click .rate-flat-good': function switchRateToGood () {
    Meteor.call('flats.switch-rate', this._id, C.FLAT_RATE_GOOD);
  },
  'click .hide-all-cancelled': function hideAllCancelled () {
    Meteor.call('flats.hide-all-cancelled');
  },
  'click .btn-rescan-website': function rescanWebsite () {
    Meteor.call('crawler.scrape-website', this.url);
  },
  'click .btn-show-on-map': function showOnMap () {
    AppServices.Map.textSearch(`${this.location}, ${this.street}`);
    AppServices.Map.scrollToMap();
  },
});

Template.flatRow.helpers({
  imageUrl (urls) {
    return urls ? urls[0] : '';
  },
  mapUrl (street) {
    return `https://maps.google.com/?q=${street.replace(' ', '+')}`;
  },
  isFlatGood (flat) {
    return flat.rate === C.FLAT_RATE_GOOD;
  },
  isFlatCould (flat) {
    return flat.rate === C.FLAT_RATE_COULD;
  },
  isFlatCancelled (flat) {
    return flat.rate === C.FLAT_RATE_NO;
  },
  date (createdAt) {
    return createdAt ? `${createdAt.getDate()} ${MONTH_NAMES[createdAt.getMonth() - 1]}` : '';
  },
});
