import cheerio from 'cheerio';
import moment from 'moment';

import { memoizedHttpGet } from '../utils.js'
import { Flats } from '../../imports/api/index.js'

/**
 * Autotomatically scrape an offer list or a single offer.
 * @param {String} siteUrl
 * @param {Object} opts
 */
export default function scrapeSomething(siteUrl, opts) {
  let parts = siteUrl.split('/')
  let lastPart = parts[parts.length-1]
  let isOfferSite = !Number.isNaN(parseInt(lastPart))

  if (isOfferSite) {
    return new Promise((resolve, reject) => {
      try {
        let siteContent = memoizedHttpGet(siteUrl)
        let newDoc = scrapeSingleOfferSite(siteUrl, siteContent)
        let doc = Flats.findOne({ url: newDoc.url })
        if (!doc) {
          Flats.insert(newDoc)
        }
        else {
          // don't update the date, we wanna keep it the oldest possible
          delete newDoc.createdAt
          Flats.update({_id: doc._id}, {$set: newDoc})
        }

        resolve()
      } catch (err) {
        console.error(err)
        reject(err)
      }
    })
  }
  else {
    return scrapeOfferListSite(siteUrl, opts)
  }
}


function scrapeOfferListSite(siteUrl, opts) {
  const { shouldRescanSameFlats } = opts

  return new Promise((resolve, reject) => {
    let urls = gatherUrlsFromListPage(siteUrl, opts)

    if (shouldRescanSameFlats) {
      let scannedUrls = Flats.find({ siteType: 'gumtree' })
        .map(flat => flat.url)

      for (let url of scannedUrls) {
        if (urls.indexOf(url) < 0) {
          urls.push(url)
        }
      }
    }

    console.log(`Scanning ${urls.length} sites...`)
    let sites = urls.map(url => {
      console.log("Open: " + url)

      let ret = { url, data: null }
      try {
        ret.data = memoizedHttpGet(url)
      } catch (err) {
        console.error("URL failed: " + url, err)
      }

      return ret
    })

    let contents = sites
      .filter(({data}) => data !== null)

    let urlsToRetry = sites
      .filter(({data}) => data === null)
      .map(({url}) => url)

    let scrappedData = contents
      .map(({url, data}) => scrapeSingleOfferSite(url, data))

    for (let newDoc of scrappedData) {
      let doc = Flats.findOne({ url: newDoc.url })
      if (!doc) {
        Flats.insert(newDoc)
      }
      else {
        Flats.update({_id: doc._id}, {$set: newDoc})
      }
    }
  })
}

function gatherUrlsFromListPage (siteUrl, { shouldRescanSameFlats }) {
  const $ = new cheerio.load(Meteor.http.get(siteUrl).content);
  let offersEls = $('.module.recent-ads .ad-listing__item');

  let urls = [];
  offersEls.each((i, elem) => {
    const anchor = $(elem).find('a.ad-listing__title-link');
    if (!anchor) {
      return;
    }
    const href = anchor.attr('href');
    if (href.indexOf('javascript:') !== -1) {
      return;
    }
    let url = `http://gumtree.com.au${href}`;

    let doc = Flats.findOne({ url });
    if (!doc || shouldRescanSameFlats) {
      urls.push(url);
    }
  });
  return urls
}

function scrapeSingleOfferSite(url, data) {
  const $ = new cheerio.load(data);
  const description = $('#ad-description-details').first().text();
  const title = $('#ad-title').text()

  const createdAtText = $('.ad-details__ad-attribute-name:contains("Date Listed:")').next().text().trim();
  const createdAt = moment(createdAtText, 'DD/MM/YYYY').toDate();

  const imageUrls = $('.gallery-thumb-item span.gallery-thumb-wrap').map((i, elem) => {
    const raw = $(elem).data('responsive-image');
    try {
      // Forgive me for using eval
      eval(`const parsed = ${raw};`);
      return parsed['large'];
    } catch (e) {
      console.error('Failed to parse info about image');
      console.log(raw);
    }
    return null;
  }).get().filter(url => url !== null);

  const street = $('.ad-heading__ad-map-link').data('address');
  const location = 'Sydney';
  // TODO: Parse title and description and try to obtain something more specific
  
  const price = parseFloat($('.j-original-price').text().replace('$', '').trim());

  return {
    siteType: 'gumtree-au',
    createdAt,
    url,
    title,
    price,
    description,
    descriptionShort: description.slice(0, 350),
    detailsHtml: $('#ad-description-details').toString(),
    imageUrls,
    street,
    location
  }
}
