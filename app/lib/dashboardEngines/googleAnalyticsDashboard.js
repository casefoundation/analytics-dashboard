const request = require('request');
const async = require('async');
const url = require('url');

module.exports = {
  'run': function(settings,dashboard,done) {
    if (settings._.google && settings._.google.accessToken && dashboard.elements) {
      execute(settings,dashboard,done);
    } else {
      done(new Error('No access token or dashboard configuration'));
    }
  }
};

function execute(settings,dashboard,done) {
  const requests = buildRequests(settings,dashboard);
  async.waterfall([
    function(next) {
      executeRequests(settings,dashboard,requests.reportRequests,next);
    },
    function(reports,next) {
      parseReports(settings,dashboard,requests.reportTypes,reports,next);
    }
  ],done);
}

function parseReports(settings,dashboard,reportTypes,reports,done) {
  const finalReport = {};
  reports.forEach(function(report,i) {
    if (!finalReport[reportTypes[i]]) {
      finalReport[reportTypes[i]] = [];
    }
    switch(reportTypes[i]) {
      case 'events':
        finalReport.events.push(parseEventReport(settings,dashboard,report,finalReport.events.length));
        break;
      case 'pages':
        finalReport.pages.push(parsePagesReport(settings,dashboard,report,finalReport.pages.length));
        break;
      case 'goals':
        finalReport.goals.push(parseGoalsReport(settings,dashboard,report,finalReport.goals.length));
        break;
      case 'topPages':
        finalReport.topPages.push(parseTopPagesReport(settings,dashboard,report,finalReport.topPages.length));
        break;
      case 'referrals':
        finalReport.referrals.push(parseReferralsReport(settings,dashboard,report,finalReport.referrals.length));
        break;
      case 'overallMetrics':
        finalReport.overallMetrics.push(parseOverallMetricsReport(settings,dashboard,report,finalReport.overallMetrics.length));
        break;
    }
  });
  done(null,finalReport);
}

function executeRequests(settings,dashboard,requests,done) {
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

function buildRequests(settings,dashboard) {
  const reportTypes = [];
  const reportRequests = [];

  dashboard.elements.events.forEach(function(event) {
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

  dashboard.elements.pages.forEach(function(page) {
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

  dashboard.elements.goals.forEach(function(goal) {
    reportTypes.push('goals');
    reportRequests.push({
      'metrics': [
        {
          'expression': 'ga:goal' + goal.number + 'Completions'
        }
      ]
    });
  });

  if (dashboard.elements.topPages) {
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
        },
        {
          'name': 'ga:pageTitle'
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

  if (dashboard.elements.referrals) {
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

  if (dashboard.elements.overallMetrics) {
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
    request.viewId = dashboard.googleAccount.profile;
    request.dateRanges = {
      'startDate': formatDate(new Date(now.getTime() - dashboard.range)),
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

function parseEventReport(settings,dashboard,report,offset) {
  // console.log(JSON.stringify(report.data.rows,null,'  '))
  const config = dashboard.elements.events[offset];
  if (report.data.rows.length > 0) {
    const total = report.data.rows.reduce(function(accum,row) {
      if ((config.category && config.category != row.dimensions[0])
          || (config.action && config.action != row.dimensions[1])
          || (config.label && config.label != row.dimensions[2])) {
        throw new Error('Event report mismatch: ' + [config.category+'/'+row.dimensions[0],config.action+'/'+row.dimensions[1],config.label+'/'+row.dimensions[2]].join(', '));
      } else {
        return accum + parseInt(row.metrics[0].values[0]);
      }
    },0);
    return {
      'name': config.name,
      'totalEvents': total
    };
  } else {
    return {
      'name': config.name,
      'totalEvents': 0
    };
  }
}

function parsePagesReport(settings,dashboard,report,offset) {
  const config = dashboard.elements.pages[offset];
  if (report.data.rows.length == 0) {
    return {
      'name': config.name,
      'url': config.url,
      'sessions': 0,
      'hits': 0,
      'bounceRate': 0
    };
  } else if (report.data.rows.length == 1) {
    const reportRow = report.data.rows[0];
    const configURLObject = url.parse(config.url);
    if (configURLObject.host != reportRow.dimensions[0] && configURLObject.path != reportRow.dimensions[1]) {
      throw new Error('Page report mismatch: ' + [configURLObject.host+'/'+reportRow.dimensions[0] , configURLObject.path+'/'+reportRow.dimensions[1]].join(', '));
    } else {
      return {
        'name': config.name,
        'url': config.url,
        'sessions': parseInt(reportRow.metrics[0].values[0]),
        'hits': parseInt(reportRow.metrics[0].values[1]),
        'bounceRate': parseFloat(reportRow.metrics[0].values[2])
      };
    }
  } else {
    throw new Error('Unexpected number of page rows: ' + report.data.rows.length);
  }
}

function parseGoalsReport(settings,dashboard,report,offset) {
  const config = dashboard.elements.goals[offset];
  if (report.data.totals) {
    return {
      'name': config.name,
      'completions': parseInt(report.data.totals[0].values[0])
    };
  } else {
    throw new Error('Unexpected number of goal report');
  }
}

function parseTopPagesReport(settings,dashboard,report,offset) {
  return report.data.rows.map(function(row) {
    return {
      'name': row.dimensions[2],
      'url': url.parse('http://' + row.dimensions[0] + row.dimensions[1]).href,
      'hits': parseInt(row.metrics[0].values[0])
    }
  });
}

function parseReferralsReport(settings,dashboard,report,offset) {
  return report.data.rows.map(function(row) {
    return {
      'referrer': row.dimensions[0],
      'hits': parseInt(row.metrics[0].values[0])
    }
  });
}

function parseOverallMetricsReport(settings,dashboard,report,offset) {
  if (report.data.totals) {
    return {
      'hits': parseInt(report.data.totals[0].values[0]),
      'sessions': parseInt(report.data.totals[0].values[1]),
      'bounceRate': parseFloat(report.data.totals[0].values[2]),
    };
  } else {
    throw new Error('Unexpected number of overall report');
  }
}
