const FeedDataSource = require('./FeedDataSource')
const _ = require('lodash')
const demoModeGenerator = require('../lib/demoModeGenerator')

class FeedTable extends FeedDataSource {
  getGoogleRequestMetricsDimensions () {
    return [
      {
        'metrics': ['ga:pageviews', 'ga:users', 'ga:avgTimeOnPage'],
        'dimensions': ['ga:hostname', 'ga:pagePath']
      },
      {
        'metrics': ['ga:totalEvents'],
        'dimensions': [
          'ga:hostname',
          'ga:pagePath',
          'ga:eventAction'
        ]
      }
    ]
  }

  getGoogleRequestDimensionFilterClauses (requestNum) {
    if (requestNum === 1) {
      return [
        {
          'operator': 'AND',
          'filters': [
            {
              'dimensionName': 'ga:eventCategory',
              'operator': 'EXACT',
              'expressions': ['Scroll Tracking']
            }
          ]
        }
      ]
    }
    return []
  }

  generateWidgets (feed, report) {
    return [
      {
        'data': report,
        'type': 'table',
        'label': 'Recent Posts',
        'helptext': 'This is a table of posts and performance metrics from an RSS feed on ' + this.config.sourceName + '.'
      }
    ]
  }

  getDateBounds (feed, startDate, endDate) {
    return {
      'start': startDate,
      'end': endDate
    }
  }

  filterReportFeed (feed, startDate, endDate) {
    const filtered = feed.filter((post) => {
      return post.pubdate.getTime() >= startDate.getTime() && post.pubdate.getTime() <= endDate.getTime()
    })
    this.testData.filterReportFeed = {
      feed,
      startDate,
      endDate,
      filtered
    }
    return filtered
  }

  processGoogleResponseBodies (feed, urls, responseBodies) {
    const metricNameMap = {
      'pageviews': 'Views',
      'users': 'Unique Views',
      'avgTimeOnPage': 'Average Time on Page (Seconds)'
    }
    const consolidatedReport = {}
    responseBodies.forEach((responseBodySet, i) => {
      responseBodySet.forEach((report) => {
        if (report.data.rows && report.data.rows.length) {
          report.data.rows.forEach((row) => {
            const foundURL = this.getURLForHostnameAndPath(urls, row.dimensions[0], row.dimensions[1])
            if (foundURL) {
              if (!consolidatedReport[foundURL.href]) {
                const feedRow = feed.find((feedItem) => {
                  return feedItem.link === foundURL.href
                })
                consolidatedReport[foundURL.href] = {
                  'URL': foundURL.href,
                  'Name': feedRow ? feedRow.title : foundURL.href,
                  'Date': feedRow ? feedRow.pubdate : null
                }
              }
              switch (i) {
                case 0:
                  ['pageviews', 'users', 'avgTimeOnPage'].forEach(function (metricName, j) {
                    if (consolidatedReport[foundURL.href][metricNameMap[metricName]]) {
                      throw new Error('Property already set: ' + foundURL.href + '|' + metricName)
                    } else {
                      switch (j) {
                        default:
                          consolidatedReport[foundURL.href][metricNameMap[metricName]] = parseInt(row.metrics[0].values[j])
                          break
                      }
                    }
                  })
                  break
                case 1:
                  const depth = parseInt(row.dimensions[2]) / 100
                  const total = parseInt(row.metrics[0].values[0])
                  if (!consolidatedReport[foundURL.href]['Average Scroll Depth']) {
                    consolidatedReport[foundURL.href]['Average Scroll Depth'] = {}
                  }
                  if (!consolidatedReport[foundURL.href]['Average Scroll Depth'][depth]) {
                    consolidatedReport[foundURL.href]['Average Scroll Depth'][depth] = 0
                  }
                  consolidatedReport[foundURL.href]['Average Scroll Depth'][depth] += total
                  break
              }
            }
          })
        }
      })
    })
    const reportArray = _.values(consolidatedReport)
    reportArray.sort((a, b) => {
      return b.Date.getTime() - a.Date.getTime()
    })
    reportArray.forEach((row) => {
      delete row.Date

      const keys = _.keys(row['Average Scroll Depth']).map((val) => parseFloat(val))
      keys.sort()
      const scrollDepths = []
      keys.forEach(function (key, i) {
        var eventsLogged = row['Average Scroll Depth'][key]
        if (i < keys.length - 1) {
          const overrideEvents = row['Average Scroll Depth'][keys[i + 1]]
          eventsLogged -= overrideEvents
        }
        for (var j = 0; j < eventsLogged; j++) {
          scrollDepths.push(key)
        }
      })

      if (scrollDepths && scrollDepths.length > 0) {
        row['Average Scroll Depth'] = Math.round((scrollDepths.reduce(function (total, current) {
          return total + current
        }) / scrollDepths.length) * 100) + '%'
      } else {
        row['Average Scroll Depth'] = '0%'
      }
    })
    this.testData.processGoogleResponseBodies = {
      feed,
      urls,
      responseBodies,
      reportArray
    }
    return reportArray
  }
}

module.exports = FeedTable
