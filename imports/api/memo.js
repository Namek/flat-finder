import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';

export const Memo = new Mongo.Collection('memoize');

if (Meteor.isServer) {
  Meteor.publish('memo', () => Memo.find({
    $or: [
      { private: { $ne: true }}
    ]
  }))
}

Meteor.methods({

})