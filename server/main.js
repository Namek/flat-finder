import { Meteor } from 'meteor/meteor'
const cheerio = require('cheerio')

import { Websites, Flats, Memo } from '../imports/api/index.js'

const CRAWL_DELAY = 600 //seconds
const FURTHEST_DAYS_BACK_COUNT = 30

Meteor.startup(() => {
  crawl()
  Meteor.setTimeout(crawl, CRAWL_DELAY*1000)
});

String.prototype.trimChars = function(chars) {
  var l = 0;
  var r = this.length-1;
  while(chars.indexOf(this[l]) >= 0 && l < r) l++;
  while(chars.indexOf(this[r]) >= 0 && r >= l) r--;
  return this.substring(l, r+1);
};

function crawl() {
  Websites.find({}).fetch().forEach(site => {
    let dom = new cheerio.load(Meteor.http.get(site.url).content)

    if (site.type == 'gumtree') {
      import scrapeGumtree from './crawlers/gumtree.js'
      scrapeGumtree(dom)
    }
    else {
      throw new Error(`Unknown site type: ${site.type}.`)
    }
  })
}

