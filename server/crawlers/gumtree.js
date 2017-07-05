/* eslint-disable no-console */
import cheerio from 'cheerio';

import { memoizedHttpGet } from '../utils.js';
import { Flats } from '../../imports/api/index.js';


function trimChars (chars) {
  let l = 0;
  let r = this.length - 1;
  while (chars.indexOf(this[l]) >= 0 && l < r) {
    l += 1;
  }
  while (chars.indexOf(this[r]) >= 0 && r >= l) {
    r -= 1;
  }
  return chars.substring(l, r + 1);
}


function gatherUrlsFromListPage (siteUrl, { shouldRescanSameFlats }) {
  console.log(`Scraping: ${siteUrl}`);  // eslint-disable-line no-console
  const $ = new cheerio.load(Meteor.http.get(siteUrl).content);  // eslint-disable-line new-cap
  const offersEls = $('.result');

  const urls = [];
  offersEls.each((i, el) => {
    const anchor = $(el).find('a');

    if (!anchor) { return; }

    const url = `https://gumtree.pl${anchor.attr('href')}`;

    if (url.indexOf('javascript:') < 0) {
      const doc = Flats.findOne({ url });
      if (!doc || shouldRescanSameFlats) {
        urls.push(url);
      }
    }
  });

  return urls;
}


function scrapeSingleOfferSite (offerUrl, data) {
  const $ = new cheerio.load(data);  // eslint-disable-line new-cap
  const description = $('div.description').first().text();
  const title = $('.myAdTitle').text();

  const createdAtMatch = /([0-9]{2})\/([0-9]{2})\/([0-9]{4})/.exec(data); // example: 08/06/2017
  const createdAt = new Date();
  createdAt.setDate(+createdAtMatch[1]);
  createdAt.setMonth(+createdAtMatch[2] - 1);
  createdAt.setYear(+createdAtMatch[3]);

  let imageUrls = [];

  let galleryData = $('#vip-gallery-data');
  galleryData = galleryData.html();
  if (galleryData) {
    imageUrls = JSON.parse(galleryData.trim()).small;
    imageUrls = trimChars(imageUrls)
      .split(',')
      .map(s => s
        .trim()
        .split('?')[0]
        .replace('50x50', '75x50'));
  } else {
    imageUrls = $('.thumbs img')
      .toArray()
      .map(img => $(img).attr('src')
          .toString()
          .split('?')[0]
          .replace('50x50', '75x50'));
  }

  const fullImageUrls = imageUrls
    .map(url =>
      url
        .replace('img.classistatic.com/crop/75x50/', '')
        .replace('_19.', '_20.'));

  let foundStreet = [title, description].reduce((prev, cur) => {
    if (prev) {
      return prev;
    }

    const val = `${cur}.`; // the dot makes it easier to find street name in the end of line
    let idx = val.indexOf('ul.');

    let street = idx < 0 ? null : val.slice(idx,
      Math.min(
        val.indexOf(' ', idx + 5),
        val.indexOf('.', idx + 5)));

    if (!street) {
      idx = val.indexOf('ulic');
      street = idx < 0 ? null : val.slice(idx,
        Math.min(
          val.indexOf(' ', idx + 7),
          val.indexOf('.', idx + 7)));

      // replace "ulicy" / "ulica" to "ul."
      if (street) {
        idx = street.indexOf(' ');
        if (idx >= 4) {
          street = `ul. ${street.substr(idx + 1)}`;
        }
      }
    }

    return street;
  }, null);

  if (foundStreet) {
    foundStreet = foundStreet
      .replace('\n', '').replace('\r', '')
      .replace('iej', 'a')
      .replace('ej', 'a');
    foundStreet = trimChars(foundStreet)
      .replace('Biuro', '');
  }

  const priceText = $('.vip-content-header .price .value .amount').text();

  const price = priceText !== null
    ? parseInt(priceText.trim().replace(/\s/g, ''), 10) || null
    : null;

  let locationSourceText = $('#div-gpt-oop > div.containment > div.page.extra > div.breadcrumbs > h1 > span').text();

  if (!locationSourceText) {
    const els = $('div.breadcrumbs span[itemscope] > a > span')
      .map((i, el) => $(el).text())
      .toArray();
    locationSourceText = els[els.length - 1];
  }

  locationSourceText = locationSourceText.trim().split('|');
  const location = locationSourceText[locationSourceText.length - 1].trim();

  const info = {
    siteType: 'gumtree',
    createdAt,
    offerUrl,
    title,
    price,
    description,
    descriptionShort: description.slice(0, 350),
    detailsHtml: $('.vip-details').toString(),
    imageUrls,
    fullImageUrls,
    foundStreet,
    location,
  };

  return info;
}


function scrapeOfferListSite (siteUrl, opts) {
  const { shouldRescanSameFlats } = opts;

  return new Promise(() => {
    const urls = gatherUrlsFromListPage(siteUrl, opts);

    if (shouldRescanSameFlats) {
      const scannedUrls = Flats.find({ siteType: 'gumtree' })
        .map(flat => flat.url);

      scannedUrls.forEach((url) => {
        if (urls.indexOf(url) < 0) {
          urls.push(url);
        }
      });
    }

    console.log(`Scanning ${urls.length} sites...`);
    const sites = urls.map((url) => {
      console.log(`Open: ${url}`);

      const ret = { url, data: null };
      try {
        ret.data = memoizedHttpGet(url);
      } catch (err) {
        console.error(`URL failed: ${url}`, err);
      }

      return ret;
    });

    const contents = sites
      .filter(({ data }) => data !== null);

    sites
      .filter(({ data }) => data === null)
      .map(({ url }) => url);

    const scrappedData = contents
      .map(({ url, data }) => scrapeSingleOfferSite(url, data));

    scrappedData.forEach((newDoc) => {
      const doc = Flats.findOne({ url: newDoc.url });
      if (!doc) {
        Flats.insert(newDoc);
      } else {
        Flats.update({ _id: doc._id }, { $set: newDoc });
      }
    });
  });
}


/**
 * Autotomatically scrape an offer list or a single offer.
 * @param {String} siteUrl
 * @param {Object} opts
 */
export default function scrapeSomething (siteUrl, opts) {
  const parts = siteUrl.split('/');
  const lastPart = parts[parts.length - 1];
  const isOfferSite = !Number.isNaN(parseInt(lastPart, 10));

  if (isOfferSite) {
    return new Promise((resolve, reject) => {
      try {
        const siteContent = memoizedHttpGet(siteUrl);
        const newDoc = scrapeSingleOfferSite(siteUrl, siteContent);
        const doc = Flats.findOne({ url: newDoc.url });
        if (!doc) {
          Flats.insert(newDoc);
        } else {
          // don't update the date, we wanna keep it the oldest possible
          delete newDoc.createdAt;
          Flats.update({ _id: doc._id }, { $set: newDoc });
        }

        resolve();
      } catch (err) {
        console.error(err);
        reject(err);
      }
    });
  }

  return scrapeOfferListSite(siteUrl, opts);
}
