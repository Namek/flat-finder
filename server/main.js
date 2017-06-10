import { Meteor } from 'meteor/meteor'
const cheerio = require('cheerio')

import { Websites, Flats, Memo } from '../imports/api/index.js'

const CRAWL_DELAY = 600 //seconds

const SHOULD_RESCAN_SAME_FLATS = true
const FURTHEST_DAYS_BACK_COUNT = 30

Meteor.startup(() => {
  function next() {
    Meteor.setTimeout(crawl, CRAWL_DELAY*1000)
  }

  crawl()
    .then(() => {
      next()
    }, err => {
      console.error(err)
      next()
    })
});

String.prototype.trimChars = function(chars) {
  var l = 0;
  var r = this.length-1;
  while(chars.indexOf(this[l]) >= 0 && l < r) l++;
  while(chars.indexOf(this[r]) >= 0 && r >= l) r--;
  return this.substring(l, r+1);
};

function crawl() {
  return Promise.all(
    Websites.find({}).fetch().map(site =>
      new Promise((resolve, reject) => {
        try {
          let scrapeFn = null

          if (site.type == 'gumtree') {
            import scrape from './crawlers/gumtree.js'
            scrapeFn = scrape
          }
          
          if (!scrapeFn) {
            throw new Error(`Unknown site type: ${site.type}.`)
          }

          scrapeFn(site, {
            shouldRescanSameFlats: SHOULD_RESCAN_SAME_FLATS,
            furthestDaysBackCount: FURTHEST_DAYS_BACK_COUNT
          })
            .then(
              () => resolve(),
              err => { console.error(err), resolve() }
            )
        }
        catch (err) {
          console.error(err)
          reject(err)
        }
      })
    )
  )
}

