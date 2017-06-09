import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';

export const Websites = new Mongo.Collection('websites');

if (Meteor.isServer) {
  Meteor.publish('websites', () => Websites.find({}))
}

Meteor.methods({
  'websites.add'(url, type) {
    check(url, String)
    check(type, String)

    Websites.insert({ url, type })
  }
})