import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';

export const Flats = new Mongo.Collection('flats');

if (Meteor.isServer) {
  Meteor.publish('flats', () => Flats.find({
    hidden: { $ne: true },
  }));
}

Meteor.methods({
  'flats.switch-rate' (flatId, rate) {
    check(flatId, String);
    check(rate, Number);

    if (Flats.findOne(flatId).rate === rate) {
      Flats.update(flatId, { $unset: { rate: 1, hidden: false } });
    } else {
      Flats.update(flatId, { $set: { rate } });
    }
  },

  'flats.hide-all-cancelled' () {
    Flats.update({ rate: { $eq: 0 } }, { $set: { hidden: true } }, { multi: true });
  },
});
