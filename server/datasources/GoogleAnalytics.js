const google = require('googleapis');
const async = require('async');
const _ = require('lodash');
const analyticsreporting = google.analyticsreporting('v4');
const url = require('url');
const GoogleDataSource = require('./GoogleDataSource');

class GoogleAnalytics extends GoogleDataSource {
  query(range) {
    return new Promise((resolve,reject) => {
      const requests = this.buildRequests(range);
      async.series(
        _.chunk(requests.reportRequests,5).map((requestSet) => {
          return (next) => {
            analyticsreporting.reports.batchGet({
              'auth': this.jwt,
              'resource': {
                'reportRequests': requestSet
              }
            },{},next);
          }
        }),
        (err,responses) => {
          if (err) {
            reject(err);
          } else {
            const consolodatedResponses = [];
            responses.forEach((response) => {
              response[0].reports.forEach((report) => {
                consolodatedResponses.push(report);
              });
            });
            resolve(this.processResponse(requests.reportTypes,consolodatedResponses));
          }
        }
      );
    });
  }

  buildRequests(range) {
    const reportTypes = [];
    const reportRequests = [];

    this.config.elements.events.forEach((event) => {
      reportTypes.push('events');
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
              'operator': (typeof event.category == 'object') ? 'IN_LIST' : 'EXACT',
              'expressions': (typeof event.category == 'object') ? event.category : [event.category]
            },
            {
              'dimensionName': 'ga:eventLabel',
              'operator': (typeof event.action == 'object') ? 'IN_LIST' : 'EXACT',
              'expressions': (typeof event.action == 'object') ? event.label : [event.label]
            },
            {
              'dimensionName': 'ga:eventAction',
              'operator': (typeof event.action == 'object') ? 'IN_LIST' : 'EXACT',
              'expressions': (typeof event.action == 'object') ? event.action : [event.action]
            }
          ].filter((filter) => {
            return filter.expressions[0];
          })
        }
      })
    });

    this.config.elements.pages.forEach((page) => {
      reportTypes.push('pages');
      const urlObject = url.parse(page.url);
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
              },
            ].filter((filter) => {
              return filter.expressions[0];
            })
          }
        });
      }
    });

    this.config.elements.goals.forEach((goal) => {
      reportTypes.push('goals');
      reportRequests.push({
        'metrics': [
          {
            'expression': 'ga:goal' + goal.number + 'ConversionRate'
          }
        ]
      });
    });

    if (this.config.elements.topPages) {
      reportTypes.push('topPages');
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
      });
    }

    if (this.config.elements.referrals) {
      reportTypes.push('referrals');
      reportRequests.push({
        'metrics': [
          {
            'expression': 'ga:pageviews'
          }
        ],
        'dimensions': [
          {
            'name': 'ga:fullReferrer'
          },
        ],
        'orderBys': [
          {
            'fieldName': 'ga:pageviews',
            'orderType': 'VALUE',
            'sortOrder': 'DESCENDING'
          }
        ],
        'pageSize': 100
      });
    }

    if (this.config.elements.overallMetrics) {
      reportTypes.push('overallMetrics');
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
      });
    }

    const now = new Date();
    reportRequests.forEach((request) => {
      request.viewId = this.config.profile;
      request.dateRanges = {
        'startDate': this.formatDate(new Date(now.getTime() - range)),
        'endDate': this.formatDate(now)
      };
      request.samplingLevel = 'LARGE';
      if (request.pageSize) {
        request.pageSize = 10000;
      }
    });

    return {
      reportTypes,
      reportRequests
    };
  }

  processResponse(reportTypes,reports) {
    const intermediateReport = {};
    reports.forEach((report,i) => {
      if (!intermediateReport[reportTypes[i]]) {
        intermediateReport[reportTypes[i]] = [];
      }
      switch(reportTypes[i]) {
        case 'events':
          intermediateReport.events.push(this.parseEventReport(report,intermediateReport.events.length));
          break;
        case 'pages':
          intermediateReport.pages.push(this.parsePagesReport(report,intermediateReport.pages.length));
          break;
        case 'goals':
          intermediateReport.goals.push(this.parseGoalsReport(report,intermediateReport.goals.length));
          break;
        case 'topPages':
          intermediateReport.topPages.push(this.parseTopPagesReport(report,intermediateReport.topPages.length));
          break;
        case 'referrals':
          intermediateReport.referrals.push(this.parseReferralsReport(report,intermediateReport.referrals.length));
          break;
        case 'overallMetrics':
          intermediateReport.overallMetrics.push(this.parseOverallMetricsReport(report,intermediateReport.overallMetrics.length));
          break;
      }
    });
    const finalReport = [];
    if (intermediateReport.events && intermediateReport.events.length > 0) {
      finalReport.push({
        'type': 'callout',
        'label': 'Events',
        'data': intermediateReport.events,
        'key': 'Name',
        'value': 'Total Events',
        'helptext': 'These are Google Analytics Events which are triggers setup on a website to record user actions.'
      })
    }
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
        });
      });
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
        });
      });
    }
    if (intermediateReport.overallMetrics && intermediateReport.overallMetrics.length > 0) {
      for(var metric in intermediateReport.overallMetrics[0]) {
        finalReport.push({
          'type': 'quickstat',
          'label': metric,
          'data': intermediateReport.overallMetrics[0][metric]
        })
      }
    }
    return finalReport;
  }

  parseEventReport(report,offset) {
    const config = this.config.elements.events[offset];
    if (report.data.rows && report.data.rows.length > 0) {
      const total = report.data.rows.reduce(function(accum,row) {
        return accum + parseInt(row.metrics[0].values[0]);
      },0);
      return {
        'Name': config.name,
        'Total Events': total,
        'helptext': config.helptext
      };
    } else {
      return {
        'Name': config.name,
        'Total Events': 0,
        'helptext': config.helptext
      };
    }
  }

  parsePagesReport(report,offset) {
    const config = this.config.elements.pages[offset];
    if (report.data.rows.length == 0) {
      return {
        'Name': config.name,
        'URL': config.url,
        'Views': 0,
        'Unique Views': 0,
        'Average Time on Page (seconds)': 0
      };
    } else {
      const reportRow = report.data.rows[0];
      return {
        'Name': config.name,
        'URL': config.url,
        'Views': parseInt(reportRow.metrics[0].values[1]),
        'Unique Views': parseInt(reportRow.metrics[0].values[0]),
        'Average Time on Page (seconds)': parseInt(reportRow.metrics[0].values[2])
      };
    }
  }

  parseGoalsReport(report,offset) {
    const config = this.config.elements.goals[offset];
    if (report.data.totals) {
      return {
        'Name': config.name,
        'Conversion Rate': (Math.round(parseFloat(report.data.totals[0].values[0]) * 100) / 100) + '%',
        'helptext': config.helptext
      };
    } else {
      throw new Error('Unexpected number of goal report');
    }
  }

  parseTopPagesReport(report,offset) {
    return report.data.rows.map(function(row) {
      return {
        'Name': row.dimensions[2],
        'URL': url.parse('http://' + row.dimensions[0] + row.dimensions[1]).href,
        'Views': parseInt(row.metrics[0].values[0])
      }
    });
  }

  parseReferralsReport(report,offset) {
    return report.data.rows.map(function(row) {
      return {
        'Referrer': row.dimensions[0],
        'Views': parseInt(row.metrics[0].values[0])
      }
    });
  }

  parseOverallMetricsReport(report,offset) {
    if (report.data.totals) {
      return {
        'Views': {
          'value': parseInt(report.data.totals[0].values[0]),
          'helptext': 'All page views'
        },
        'Unique Views': {
          'value': parseInt(report.data.totals[0].values[1]),
          'helptext': 'All page views not counting repeat visits'
        },
        'Average Time on Page': {
          'value': parseInt(report.data.totals[0].values[2]),
          'helptext': 'The average time users spend on every page of the site in seconds.'
        },
        'New Users': {
          'value': parseFloat(report.data.totals[0].values[3]).toLocaleString() + '%',
          'helptext': 'The portion of users coming to the site who have not visited before.'
        },
      };
    } else {
      throw new Error('Unexpected number of overall report');
    }
  }
}

module.exports = GoogleAnalytics;
