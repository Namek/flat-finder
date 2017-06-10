const cheerio = require('cheerio')
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
        scrapeSingleOfferSite(siteUrl, siteContent)
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
  const {shouldRescanSameFlats, furthestDaysBackCount} = opts

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

function gatherUrlsFromListPage(siteUrl, {shouldRescanSameFlats, furthestDaysBackCount}) {
  console.log(`Scraping: ${siteUrl}`)
  const $ = new cheerio.load(Meteor.http.get(siteUrl).content)
  let offersEls = $('.result')

  let urls = []
  offersEls.each((i, el) => {
    let anchor = $(el).find('a')

    if (!anchor)
      return

    let url = 'https://gumtree.pl' + anchor.attr('href')

    if (url.indexOf("javascript:") < 0) {
      let doc = Flats.findOne({ url })
      if (!doc || shouldRescanSameFlats) {
        urls.push(url)
      }
    }
  })

  return urls
}

function scrapeSingleOfferSite(url, data) {
  $ = new cheerio.load(data)
  let description = $('div.description').text()

  let createdAtMatch = /([0-9]{2})\/([0-9]{2})\/([0-9]{4})/.exec(data) //example: 08/06/2017
  let createdAt = new Date()
  createdAt.setDate(+createdAtMatch[1])
  createdAt.setMonth(+createdAtMatch[2]-1)
  createdAt.setYear(+createdAtMatch[3])

  let imageUrls = []
  
  let galleryData = $('#vip-gallery-data')
  galleryData = galleryData.html()
  if (galleryData) {
    imageUrls = JSON.parse(galleryData.trim()).small
      .trimChars('[]')
      .split(',')
      .map(s => s
        .trim()
        .split('?')[0]
        .replace('50x50', '75x50'))
  }
  else {
    imageUrls = $('.thumbs img')
      .toArray()
      .map(img => $(img).attr('src')
          .toString()
          .split('?')[0]
          .replace('50x50', '75x50'))
  }

  let fullImageUrls = imageUrls
    .map(url =>
      url
        .replace('img.classistatic.com/crop/75x50/', '')
        .replace('_19.', '_20.'))

  let idx = description.indexOf("ul.")
  let street = idx < 0 ? null : description.slice(idx, 
    Math.min(
      description.indexOf(" ", idx+5),
      description.indexOf(".", idx+5)))

  if (!street) {
    idx = description.indexOf("ulic")
    street = idx < 0 ? null : description.slice(idx, 
      Math.min(
        description.indexOf(" ", idx+7),
        description.indexOf(".", idx+7)))
  }
  
  if (street) {
    street = street
      .replace('\n', '').replace('\r', '')
      .replace("iej", "a")
      .replace("ej", "a")
      .trimChars(' ,.')
      .replace("Biuro", '')
  }

  let priceText = $('.vip-content-header .price .value .amount').text()

  let price = priceText !== null
    ? parseInt(priceText.trim().replace(/\s/g,''), 10) || null
    : null

  let info = {
    siteType: 'gumtree',
    createdAt,
    url,
    title: $('.myAdTitle').text(),
    price,
    description,
    descriptionShort: description.slice(0, 350),
    detailsHtml: $('.vip-details').toString(),
    imageUrls,
    fullImageUrls,
    street
  }

  return info
}