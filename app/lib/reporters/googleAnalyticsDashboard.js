const request = require('request');
const async = require('async');
const url = require('url');

module.exports = {
  'init': function(settings,app,done) {
    done();
  },
  'run': function(settings,done) {
    if (settings._.google && settings._.google.accessToken && settings._.dashboard && settings._.dashboard.elements) {
      execute(settings,done);
    } else {
      done(new Error('No access token or dashboard configuration'));
    }
  }
};

function execute(settings,done) {
  const requests = buildRequests(settings);
  async.waterfall([
    function(next) {
      executeRequests(requests.reportRequests,next);
    },
    function(reports,next) {
      parseReports(settings,requests.reportTypes,reports,next);
    }
  ],done);
}

function parseReports(settings,reportTypes,reports,done) {
  const finalReport = {};
  const reportTypeCounter = {};
  reports.forEach(function(report,i) {
    if (!finalReport[reportTypes[i]]) {
      finalReport[reportTypes[i]] = [];
    }
    if (!reportTypeCounter[reportTypes[i]]) {
      reportTypeCounter[reportTypes[i]] = 0;
    } else {
      reportTypeCounter[reportTypes[i]]++;
    }
    switch(reportTypes[i]) {
      case 'events':
        finalReport.events.push(parseEventReport(settings,report,reportTypeCounter[reportTypes[i]]));
        break;
      case 'pages':
        finalReport.pages.push(parsePagesReport(settings,report,reportTypeCounter[reportTypes[i]]));
        break;
      case 'goals':
        finalReport.goals.push(parseGoalsReport(settings,report,reportTypeCounter[reportTypes[i]]));
        break;
      case 'topPages':
        finalReport.topPages.push(parseTopPagesReport(settings,report,reportTypeCounter[reportTypes[i]]));
        break;
      case 'referrals':
        finalReport.referrals.push(parseReferralsReport(settings,report,reportTypeCounter[reportTypes[i]]));
        break;
      case 'overallMetrics':
        finalReport.overall.push(parseOverallMetricsReport(settings,report,reportTypeCounter[reportTypes[i]]));
        break;
    }
  });
  done(null,finalReport);
}

function executeRequests(requests,done) {
  async.series(
    segmentArrays(requests).map(function(requestSet) {
      return function(next) {
        request.post({
          'uri': 'https://analyticsreporting.googleapis.com/v4/reports:batchGet',
          'body': {
            'reportRequests': requestSet
          },
          'json': true,
          'auth': {
            'bearer': settings._.google.accessToken
          }
        },function(err,res,body) {
          if (err) {
            next(err);
          } else if (body.reports) {
            next(null,body);
          } else if (body.error) {
            next(new Error(body.error.message));
          } else {
            next(new Error('Unknown response'))
          }
        });
      }
    }),
    function(err,bodies) {
      if (err) {
        done(err);
      } else {
        const consolodatedBodies = [];
        bodies.forEach(function(body) {
          body.reports.forEach(function(report) {
            consolodatedBodies.push(report);
          });
        });
        done(null,consolodatedBodies);
      }
    }
  );
}

function segmentArrays(array) {
  let currentSegment = [];
  const segmented = [currentSegment];
  array.forEach(function(row) {
    if (currentSegment.length == 5) {
      currentSegment = [];
      segmented.push(currentSegment);
    }
    currentSegment.push(row);
  });
  return segmented;
}

function buildRequests(settings) {
  const reportTypes = [];
  const reportRequests = [];

  settings._.dashboard.elements.events.forEach(function(event) {
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
            'operator': 'EXACT',
            'expressions': [event.category]
          },
          {
            'dimensionName': 'ga:eventLabel',
            'operator': 'EXACT',
            'expressions': [event.label]
          },
          {
            'dimensionName': 'ga:eventAction',
            'operator': 'EXACT',
            'expressions': [event.action]
          }
        ].filter(function(filter) {
          return filter.expressions[0];
        })
      }
    })
  });

  settings._.dashboard.elements.pages.forEach(function(page) {
    reportTypes.push('pages');
    const urlObject = url.parse(page.url);
    if (urlObject) {
      reportRequests.push({
        'metrics': [
          {
            'expression': 'ga:sessions'
          },
          {
            'expression': 'ga:hits'
          },
          {
            'expression': 'ga:bounceRate'
          }
        ],
        'dimensions': [
          {
            'name': 'ga:hostname'
          },
          {
            'name': 'ga:pagePath'
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
          ].filter(function(filter) {
            return filter.expressions[0];
          })
        }
      });
    }
  });

  settings._.dashboard.elements.goals.forEach(function(goal) {
    reportTypes.push('goals');
    reportRequests.push({
      'metrics': [
        {
          'expression': 'ga:goal' + goal.number + 'Completions'
        }
      ]
    });
  });

  if (settings._.dashboard.elements.topPages) {
    reportTypes.push('topPages');
    reportRequests.push({
      'metrics': [
        {
          'expression': 'ga:hits'
        }
      ],
      'dimensions': [
        {
          'name': 'ga:hostname'
        },
        {
          'name': 'ga:pagePath'
        }
      ],
      'orderBys': [
        {
          'fieldName': 'ga:hits',
          'orderType': 'VALUE',
          'sortOrder': 'DESCENDING'
        }
      ],
      'pageSize': 100
    });
  }

  if (settings._.dashboard.elements.referrals) {
    reportTypes.push('referrals');
    reportRequests.push({
      'metrics': [
        {
          'expression': 'ga:hits'
        }
      ],
      'dimensions': [
        {
          'name': 'ga:fullReferrer'
        },
      ],
      'orderBys': [
        {
          'fieldName': 'ga:hits',
          'orderType': 'VALUE',
          'sortOrder': 'DESCENDING'
        }
      ],
      'pageSize': 100
    });
  }

  if (settings._.dashboard.elements.overallMetrics) {
    reportTypes.push('overallMetrics');
    reportRequests.push({
      'metrics': [
        {
          'expression': 'ga:hits'
        },
        {
          'expression': 'ga:sessions'
        },
        {
          'expression': 'ga:bounceRate'
        }
      ]
    });
  }

  const now = new Date();
  reportRequests.forEach(function(request) {
    request.viewId = settings._.dashboard.googleAccount.profile;
    request.dateRanges = {
      'startDate': formatDate(new Date(now.getTime() - settings._.dashboard.range));
      'endDate': formatDate(now)
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

function formatDate(dateObj) {
  var prependZero = function(val) {
    if (val < 10) {
      return '0' + val;
    } else {
      return val;
    }
  }
  return [dateObj.getFullYear(),prependZero(dateObj.getMonth()+1),prependZero(dateObj.getDate())].join('-');
}
