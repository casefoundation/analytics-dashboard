const google = require('googleapis')
const async = require('async')
const _ = require('lodash')
const analyticsreporting = google.analyticsreporting('v4')
const url = require('url')
const GoogleDataSource = require('./GoogleDataSource')

class GoogleAnalytics extends GoogleDataSource {
  query (startDate, endDate) {
    return new Promise((resolve, reject) => {
      const requests = this.buildRequests(startDate, endDate)
      async.series(
        _.chunk(requests.reportRequests, 5).map((requestSet) => {
          return (next) => {
            analyticsreporting.reports.batchGet({
              'auth': this.jwt,
              'resource': {
                'reportRequests': requestSet
              }
            }, {}, next)
          }
        }),
        (err, responses) => {
          if (err) {
            reject(err)
          } else {
            const consolodatedResponses = []
            responses.forEach((response) => {
              response[0].reports.forEach((report) => {
                consolodatedResponses.push(report)
              })
            })
            resolve(this.processResponse(requests.reportTypes, consolodatedResponses))
          }
        }
      )
    })
  }

  buildRequests (startDate, endDate) {
    const reportTypes = []
    const reportRequests = []

    this.config.elements.events.forEach((event) => {
      reportTypes.push('events')
      reportRequests.push({
        'metrics': [
          {
            'expression': 'ga:totalEvents'
          }
        ],
        'dimensions': [
          {
            'name': 'ga:eventCategory'
          },
          {
            'name': 'ga:eventAction'
          },
          {
            'name': 'ga:eventLabel'
          }
        ],
        'dimensionFilterClauses': {
          'operator': 'AND',
          'filters': [
            {
              'dimensionName': 'ga:eventCategory',
              'operator': (typeof event.category === 'object') ? 'IN_LIST' : 'EXACT',
              'expressions': (typeof event.category === 'object') ? event.category : [event.category]
            },
            {
              'dimensionName': 'ga:eventLabel',
              'operator': (typeof event.action === 'object') ? 'IN_LIST' : 'EXACT',
              'expressions': (typeof event.action === 'object') ? event.label : [event.label]
            },
            {
              'dimensionName': 'ga:eventAction',
              'operator': (typeof event.action === 'object') ? 'IN_LIST' : 'EXACT',
              'expressions': (typeof event.action === 'object') ? event.action : [event.action]
            }
          ].filter((filter) => {
            return filter.expressions[0]
          })
        }
      })
    })

    this.config.elements.pages.forEach((page) => {
      reportTypes.push('pages')
      const urlObject = url.parse(page.url)
      if (urlObject) {
        reportRequests.push({
          'metrics': [
            {
              'expression': 'ga:uniquePageviews'
            },
            {
              'expression': 'ga:pageviews'
            },
            {
              'expression': 'ga:avgTimeOnPage'
            }
          ],
          'dimensionFilterClauses': {
            'operator': 'AND',
            'filters': [
              {
                'dimensionName': 'ga:hostname',
                'operator': 'EXACT',
                'expressions': [urlObject.host]
              },
              {
                'dimensionName': 'ga:pagePath',
                'operator': 'EXACT',
                'expressions': [urlObject.path]
              }
            ].filter((filter) => {
              return filter.expressions[0]
            })
          }
        })
      }
    })

    this.config.elements.goals.forEach((goal) => {
      reportTypes.push('goals')
      reportRequests.push({
        'metrics': [
          {
            'expression': 'ga:goal' + goal.number + 'ConversionRate'
          }
        ]
      })
    })

    if (this.config.elements.topPages) {
      reportTypes.push('topPages')
      reportRequests.push({
        'metrics': [
          {
            'expression': 'ga:pageviews'
          }
        ],
        'dimensions': [
          {
            'name': 'ga:hostname'
          },
          {
            'name': 'ga:pagePath'
          },
          {
            'name': 'ga:pageTitle'
          }
        ],
        'orderBys': [
          {
            'fieldName': 'ga:pageviews',
            'orderType': 'VALUE',
            'sortOrder': 'DESCENDING'
          }
        ],
        'pageSize': 100
      })
    }

    if (this.config.elements.referrals) {
      reportTypes.push('referrals')
      reportRequests.push({
        'metrics': [
          {
            'expression': 'ga:pageviews'
          }
        ],
        'dimensions': [
          {
            'name': 'ga:fullReferrer'
          }
        ],
        'orderBys': [
          {
            'fieldName': 'ga:pageviews',
            'orderType': 'VALUE',
            'sortOrder': 'DESCENDING'
          }
        ],
        'pageSize': 100
      })
    }

    if (this.config.elements.overallMetrics) {
      reportTypes.push('overallMetrics')
      reportRequests.push({
        'metrics': [
          {
            'expression': 'ga:pageviews'
          },
          {
            'expression': 'ga:uniquePageviews'
          },
          {
            'expression': 'ga:avgTimeOnPage'
          },
          {
            'expression': 'ga:percentNewSessions'
          }
        ]
      })
    }

    if (this.config.elements.deviceData) {
      reportTypes.push('deviceData')
      reportRequests.push({
        'dimensions': [
          {
            'name': 'ga:deviceCategory'
          }
        ],
        'metrics': [
          {
            'expression': 'ga:users'
          }
        ]
      })
    }

    this.config.elements.dimensions.forEach((dimension) => {
      reportTypes.push('dimensions')
      reportRequests.push({
        'metrics': [
          {
            'expression': 'ga:uniquePageviews'
          },
          {
            'expression': 'ga:pageviews'
          },
          {
            'expression': 'ga:avgTimeOnPage'
          }
        ],
        'dimensions': [
          {
            'name': 'ga:dimension' + dimension.number
          }
        ]
      })
    })

    const now = new Date()
    reportRequests.forEach((request) => {
      request.viewId = this.config.profile
      request.dateRanges = {
        'startDate': this.formatDate(startDate),
        'endDate': this.formatDate(endDate)
      }
      request.samplingLevel = 'LARGE'
      if (request.pageSize) {
        request.pageSize = 10000
      }
    })

    // this.testData.buildRequests = {
    //   startDate,
    //   endDate,
    //   reportTypes,
    //   reportRequests
    // };

    // console.log(JSON.stringify(this.testData.buildRequests))

    return {
      reportTypes,
      reportRequests
    }
  }

  processResponse (reportTypes, reports) {
    const intermediateReport = {}
    reports.forEach((report, i) => {
      if (!intermediateReport[reportTypes[i]]) {
        intermediateReport[reportTypes[i]] = []
      }
      switch (reportTypes[i]) {
        case 'events':
          intermediateReport.events.push(this.parseEventReport(report, intermediateReport.events.length))
          break
        case 'pages':
          intermediateReport.pages.push(this.parsePagesReport(report, intermediateReport.pages.length))
          break
        case 'goals':
          intermediateReport.goals.push(this.parseGoalsReport(report, intermediateReport.goals.length))
          break
        case 'topPages':
          intermediateReport.topPages.push(this.parseTopPagesReport(report, intermediateReport.topPages.length))
          break
        case 'referrals':
          intermediateReport.referrals.push(this.parseReferralsReport(report, intermediateReport.referrals.length))
          break
        case 'overallMetrics':
          intermediateReport.overallMetrics.push(this.parseOverallMetricsReport(report, intermediateReport.overallMetrics.length))
          break
        case 'dimensions':
          intermediateReport.dimensions.push(this.parseTopDimensionsReport(report, intermediateReport.dimensions.length))
          break
        case 'deviceData':
          intermediateReport.deviceData.push(this.parseDeviceDataReport(report, intermediateReport.deviceData.length))
          break
      }
    })
    const finalReport = []
    if (intermediateReport.pages && intermediateReport.pages.length > 0) {
      finalReport.push({
        'type': 'table',
        'label': 'Key Pages',
        'data': intermediateReport.pages,
        'helptext': 'These are performance metrics for specific pages.'
      })
    }
    if (intermediateReport.goals && intermediateReport.goals.length > 0) {
      finalReport.push({
        'type': 'callout',
        'label': 'Goals',
        'data': intermediateReport.goals,
        'key': 'Name',
        'value': 'Conversion Rate',
        'helptext': 'These are Google Analytics Goals which are conversion rates for specific events.'
      })
    }
    if (intermediateReport.topPages && intermediateReport.topPages.length > 0) {
      intermediateReport.topPages.forEach((dataset) => {
        finalReport.push({
          'type': 'barchart',
          'label': 'Top Pages',
          'data': dataset,
          'key': 'Name',
          'value': 'Views',
          'helptext': 'These are the top performing pages based on pageviews.'
        })
      })
    }
    if (intermediateReport.referrals && intermediateReport.referrals.length > 0) {
      intermediateReport.referrals.forEach((dataset) => {
        finalReport.push({
          'type': 'barchart',
          'label': 'Top Referrers',
          'data': dataset,
          'key': 'Referrer',
          'value': 'Views',
          'helptext': 'These are the top traffic referrers to the site based on landing-page pageviews.'
        })
      })
    }
    if (intermediateReport.overallMetrics && intermediateReport.overallMetrics.length > 0) {
      for (var metric in intermediateReport.overallMetrics[0]) {
        finalReport.push({
          'type': 'quickstat',
          'label': metric,
          'data': intermediateReport.overallMetrics[0][metric]
        })
      }
    }
    if (intermediateReport.dimensions && intermediateReport.dimensions.length > 0) {
      intermediateReport.dimensions.forEach((dimensionReport, i) => {
        finalReport.push({
          'type': 'table',
          'label': this.config.elements.dimensions[i].name,
          'data': dimensionReport,
          'helptext': this.config.elements.dimensions[i].helptext
        })
      })
    }
    if (intermediateReport.events && intermediateReport.events.length > 0) {
      intermediateReport.events.forEach((event) => {
        finalReport.push({
          'type': 'quickstat',
          'label': event.Name,
          'data': {
            'value': event['Total Events'],
            'helptext': event.helptext
          }
        })
      })
    }
    if (intermediateReport.deviceData && intermediateReport.deviceData.length > 0) {
      finalReport.push({
        'type': 'pie',
        'label': 'Users by Device',
        'data': intermediateReport.deviceData[0],
        'key': 'Device',
        'value': 'Percent of Users',
        'helptext': 'Users of the site segmented by the type of device they use to browse it.',
        'percent': true
      })
    }
    this.testData.processResponse = {
      reportTypes,
      reports,
      finalReport
    }
    return finalReport
  }

  parseEventReport (report, offset) {
    const config = this.config.elements.events[offset]
    const parsedReport = {
      'Name': config.name,
      'Total Events': 0,
      'helptext': config.helptext
    }
    if (report.data.rows && report.data.rows.length > 0) {
      const total = report.data.rows.reduce(function (accum, row) {
        return accum + parseInt(row.metrics[0].values[0])
      }, 0)
      parsedReport['Total Events'] = total
    }
    this.testData.parseEventReport = {
      report,
      offset,
      parsedReport
    }
    return parsedReport
  }

  parsePagesReport (report, offset) {
    const config = this.config.elements.pages[offset]
    const parsedReport = {
      'Name': config.name,
      'URL': config.url,
      'Views': 0,
      'Unique Views': 0,
      'Average Time on Page (seconds)': 0
    }
    if (report.data.rows && report.data.rows.length > 0) {
      const reportRow = report.data.rows[0]
      parsedReport['Views'] = parseInt(reportRow.metrics[0].values[1])
      parsedReport['Unique Views'] = parseInt(reportRow.metrics[0].values[0])
      parsedReport['Average Time on Page (seconds)'] = parseInt(reportRow.metrics[0].values[2])
    }
    this.testData.parsePagesReport = {
      report,
      offset,
      parsedReport
    }
    return parsedReport
  }

  parseGoalsReport (report, offset) {
    const config = this.config.elements.goals[offset]
    const parsedReport = {
      'Name': config.name,
      'Conversion Rate': '0%',
      'helptext': config.helptext
    }
    if (report.data.totals) {
      parsedReport['Conversion Rate'] = (Math.round(parseFloat(report.data.totals[0].values[0]) * 10) / 10) + '%'
    }
    this.testData.parseGoalsReport = {
      report,
      offset,
      parsedReport
    }
    return parsedReport
  }

  parseTopPagesReport (report, offset) {
    const parsedReport = report.data.rows.map(function (row) {
      return {
        'Name': row.dimensions[2],
        'URL': url.parse('http://' + row.dimensions[0] + row.dimensions[1]).href,
        'Views': parseInt(row.metrics[0].values[0])
      }
    })
    this.testData.parseTopPagesReport = {
      report,
      offset,
      parsedReport
    }
    return parsedReport
  }

  parseReferralsReport (report, offset) {
    const parsedReport = report.data.rows.map(function (row) {
      return {
        'Referrer': row.dimensions[0],
        'Views': parseInt(row.metrics[0].values[0])
      }
    })
    this.testData.parseReferralsReport = {
      report,
      offset,
      parsedReport
    }
    return parsedReport
  }

  parseOverallMetricsReport (report, offset) {
    const parsedReport = {}
    if (report.data.totals) {
      parsedReport['Views'] = {
        'value': parseInt(report.data.totals[0].values[0]),
        'helptext': 'All page views'
      }
      parsedReport['Unique Views'] = {
        'value': parseInt(report.data.totals[0].values[1]),
        'helptext': 'All page views not counting repeat visits'
      }
      parsedReport['Average Time on Page'] = {
        'value': parseInt(report.data.totals[0].values[2]),
        'helptext': 'The average time users spend on every page of the site in seconds.'
      }
      parsedReport['New Users'] = {
        'value': (Math.round(parseFloat(report.data.totals[0].values[3]) * 10) / 10).toLocaleString() + '%',
        'helptext': 'The portion of users coming to the site who have not visited before.'
      }
    }
    this.testData.parseOverallMetricsReport = {
      report,
      offset,
      parsedReport
    }
    return parsedReport
  }

  parseDeviceDataReport (report, offset) {
    const total = report.data.rows.reduce((total, row) => {
      return total + parseFloat(row.metrics[0].values[0])
    }, 0)
    const parsedReport = report.data.rows.map((row) => {
      return {
        'Device': this.titleCase(row.dimensions[0]),
        'Percent of Users': parseFloat(row.metrics[0].values[0]) / total
      }
    })
    parsedReport.sort((a, b) => {
      return b['Percent of Users'] - a['Percent of Users']
    })
    parsedReport.forEach((row) => {
      row['Percent of Users'] = (Math.round(row['Percent of Users'] * 10000) / 10000)
    })
    return parsedReport
  }

  parseTopDimensionsReport (report, offset) {
    const parsedReport = report.data.rows.map(function (row) {
      return {
        'Name': row.dimensions[0],
        'Views': parseInt(row.metrics[0].values[1]),
        'Unique Views': parseInt(row.metrics[0].values[0]),
        'Average Time on Page (seconds)': parseInt(row.metrics[0].values[2])
      }
    }).filter((data) => data.Name && data.Name != 'null')
    this.testData.parseTopDimensionsReport = {
      report,
      offset,
      parsedReport
    }
    return parsedReport
  }

  titleCase (str) {
    return str[0].toUpperCase() + str.substring(1)
  }
}

module.exports = GoogleAnalytics
