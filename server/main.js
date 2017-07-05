/* eslint-disable no-console */
import { Meteor } from 'meteor/meteor';

import { Websites } from '../imports/api/index.js';

const CRAWL_DELAY = 600; // seconds

const SHOULD_RESCAN_SAME_FLATS = false;
const FURTHEST_DAYS_BACK_COUNT = 30;


function determineWebsiteType (url) {
  if (url.indexOf('gumtree') > 0) { return 'gumtree'; }

  return null;
}

function getOfferScrapeFunction (siteType) {
  let scrapeFn = null;
  if (siteType === 'gumtree') {
    scrapeFn = require('./crawlers/gumtree.js').default;  // eslint-disable-line global-require
  }

  return scrapeFn;
}

function callScrapeFunctionWithParams (scrapeFn, siteUrl) {
  return scrapeFn(siteUrl, {
    shouldRescanSameFlats: SHOULD_RESCAN_SAME_FLATS,
    furthestDaysBackCount: FURTHEST_DAYS_BACK_COUNT,
  });
}

function crawlEverything () {
  return Promise.all(
    Websites.find({}).fetch().map(site =>
      new Promise((resolve, reject) => {
        try {
          const scrapeFn = getOfferScrapeFunction(site.type);

          if (!scrapeFn) {
            throw new Error(`Unknown site type: ${site.type}.`);
          }

          callScrapeFunctionWithParams(scrapeFn, site.url)
            .then(
              () => resolve(),
              (err) => {
                console.error(err);
                resolve();
              },
            );
        } catch (err) {
          console.error(err);
          reject(err);
        }
      }),
    ),
  );
}


Meteor.startup(() => {
  function next () {
    Meteor.setTimeout(crawlEverything, CRAWL_DELAY * 1000);
  }

  crawlEverything()
    .then(() => {
      next();
    }, (err) => {
      console.error(err);
      next();
    });
});

Meteor.methods({
  /**
   * Scrape an offer website. It may be a rescan or a new scan.
   * @param {String} url
   */
  'crawler.scrape-website': function scrapeWebsite (url) {
    check(url, Match.String);
    console.log(url);
    const siteType = determineWebsiteType(url);

    if (!siteType) {
      throw new Error(`Unkown site type for URL: ${url}`);
    }

    const scrapeFn = getOfferScrapeFunction(siteType);
    if (!scrapeFn) {
      throw new Error(`Unkown site type: ${siteType}`);
    }
    callScrapeFunctionWithParams(scrapeFn, url);
  },
});
