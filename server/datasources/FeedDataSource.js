const google = require('googleapis')
const analyticsreporting = google.analyticsreporting('v4')
const FeedParser = require('feedparser')
const url = require('url')
const GoogleDataSource = require('./GoogleDataSource')
const request = require('request')

class FeedDataSource extends GoogleDataSource {
  query (startDate, endDate) {
    return this.getFeedItems()
      .then((feed) => {
        this.sortFeed(feed)
        const newFeed = this.filterReportFeed(feed, startDate, endDate)
        return this.fetchAnalytics(newFeed, startDate, endDate)
      })
      .then(({feed, report}) => {
        return this.generateWidgets(feed, report)
      })
  }

  generateWidgets (feed, report) {
    throw new Error('Must implement!')
  }

  getGoogleRequestDimensionFilterClauses (requestNum) {
    return []
  }

  getFeedItems () {
    return new Promise((resolve, reject) => {
      const req = request(this.config.feedUrl)
      const feedparser = new FeedParser()
      const items = []

      req.on('error', reject)
      req.on('response', function (res) {
        const stream = this
        if (res.statusCode !== 200) {
          reject(new Error('Bad status code'))
        } else {
          stream.pipe(feedparser)
        }
      })

      feedparser.on('error', reject)
      feedparser.on('readable', function () {
        const stream = this
        var item
        while ((item = stream.read()) !== null) {
          items.push(item)
        }
      })
      feedparser.on('end', function () {
        resolve(items)
      })
    })
  }

  sortFeed (feed) {
    feed.sort(function (a, b) {
      return b.pubdate.getTime() - a.pubdate.getTime()
    })
  }

  convertFeedToUrls (feed) {
    return feed.map(function (feedItem) {
      return url.parse(feedItem.link)
    }).filter(function (urlObj) {
      return urlObj
    })
  }

  fetchAnalytics (feed, startDate, endDate) {
    const dateBounds = this.getDateBounds(feed, startDate, endDate)
    const urls = this.convertFeedToUrls(feed)
    const baseBodies = this.getGoogleRequestMetricsDimensions().map((a) => [])
    return this.executeGoogleRequest(baseBodies, null, dateBounds, urls)
      .then((responseBodies) => {
        return {
          feed,
          'report': this.processGoogleResponseBodies(feed, urls, responseBodies)
        }
      })
  }

  executeGoogleRequest (previousResponseBodies, pageTokens, dateBounds, urls) {
    return new Promise((resolve, reject) => {
      if (urls.length > 0) {
        const resultsMap = []
        let includedReportsCount = 0
        const reportTypes = this.getGoogleRequestMetricsDimensions()
        const reportRequests = reportTypes.filter((request, i) => {
          if (pageTokens === null || pageTokens[i] !== null) {
            resultsMap[includedReportsCount] = i
            includedReportsCount++
            return true
          } else {
            return false
          }
        }).map((request, i) => {
          return {
            'metrics': request.metrics.map(function (metric) {
              return {
                'expression': metric
              }
            }),
            'dimensions': request.dimensions.map(function (dimension) {
              return {
                'name': dimension
              }
            }),
            'viewId': 'ga:' + this.config.profile,
            'dateRanges': [{
              'startDate': this.formatDate(dateBounds.start),
              'endDate': this.formatDate(dateBounds.end)
            }],
            'samplingLevel': 'LARGE',
            'dimensionFilterClauses': [{
              'operator': 'AND',
              'filters': {
                'dimensionName': 'ga:pagePath',
                'operator': 'IN_LIST',
                'expressions': urls.map((url) => {
                  return url.path
                })
              }
            }].concat(this.getGoogleRequestDimensionFilterClauses(i)),
            'pageSize': 10000,
            'pageToken': (pageTokens && i < pageTokens.length) ? pageTokens[i] : null,
            'includeEmptyRows': true,
            'hideTotals': true,
            'hideValueRanges': true
          }
        })
        analyticsreporting.reports.batchGet({
          'auth': this.jwt,
          'resource': {
            'reportRequests': reportRequests
          }
        }, {}, (err, response) => {
          if (err) {
            reject(err)
          } else if (response.reports && response.reports.length === reportRequests.length) {
            const pageTokens = reportTypes.map(function (report) {
              return null
            })
            let hasTokens = false
            response.reports.forEach(function (report, i) {
              previousResponseBodies[resultsMap[i]].push(report)
              if (report.nextPageToken) {
                hasTokens = true
                pageTokens[resultsMap[i]] = report.nextPageToken
              }
            })
            if (hasTokens) {
              this.executeRequest(previousResponseBodies, pageTokens, dateBounds, urls)
            } else {
              resolve(previousResponseBodies)
            }
          } else if (response.error) {
            reject(new Error(response.error.message))
          } else {
            reject(new Error('Unknown response'))
          }
        })
      } else {
        resolve([])
      }
    })
  }
}

FeedDataSource.OneDay = 24 * 60 * 60 * 1000

module.exports = FeedDataSource
