import { Meteor } from 'meteor/meteor'
const cheerio = require('cheerio')

import { Websites, Flats, Memo } from '../imports/api/index.js'

const CRAWL_DELAY = 600 //seconds

const SHOULD_RESCAN_SAME_FLATS = false
const FURTHEST_DAYS_BACK_COUNT = 30

Meteor.startup(() => {
  function next() {
    Meteor.setTimeout(crawlEverything, CRAWL_DELAY*1000)
  }

  crawlEverything()
    .then(() => {
      next()
    }, err => {
      console.error(err)
      next()
    })
});

Meteor.methods({
  /**
   * Scrape an offer website. It may be a rescan or a new scan.
   * @param {String} url 
   */
  'crawler.scrape-website'(url) {
    console.log(url)
    let siteType = determineWebsiteType(url)

    if (!siteType)
      return new Error("Unkown site type for URL: " + url)

    let scrapeFn = getOfferScrapeFunction(siteType)
    callScrapeFunctionWithParams(scrapeFn, url)
  }
})

function determineWebsiteType(url) {
  if (url.indexOf("gumtree") > 0)
    return 'gumtree'

  return null
}

function getOfferScrapeFunction(siteType) {
  let scrapeFn = null
  if (siteType == 'gumtree') {
    import scrape from './crawlers/gumtree.js'
    scrapeFn = scrape
  }

  return scrapeFn
}

function callScrapeFunctionWithParams(scrapeFn, siteUrl) {
  return scrapeFn(siteUrl, {
    shouldRescanSameFlats: SHOULD_RESCAN_SAME_FLATS,
    furthestDaysBackCount: FURTHEST_DAYS_BACK_COUNT
  })
}

String.prototype.trimChars = function(chars) {
  var l = 0;
  var r = this.length-1;
  while(chars.indexOf(this[l]) >= 0 && l < r) l++;
  while(chars.indexOf(this[r]) >= 0 && r >= l) r--;
  return this.substring(l, r+1);
};

function crawlEverything() {
  return Promise.all(
    Websites.find({}).fetch().map(site =>
      new Promise((resolve, reject) => {
        try {
          let scrapeFn = getOfferScrapeFunction(site.type)
          
          if (!scrapeFn) {
            throw new Error(`Unknown site type: ${site.type}.`)
          }

          callScrapeFunctionWithParams(scrapeFn, site.url)
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

