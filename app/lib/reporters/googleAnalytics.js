const request = require('request');
const async = require('async');

module.exports = {
  'name': 'Google Analytics',
  'init': function(settings,app,done) {
    done();
  },
  'run': function(settings,urls,gaProfile,startDate,endDate,done) {
    executeRequest([[],[]],null,settings,urls,gaProfile,startDate,endDate,function(err,responseBodies) {
      if (err) {
        done(err);
      } else {
        done(null,processResponseBodies(urls,responseBodies));
      }
    });
  }
};

function executeRequest(previousResponseBodies,pageTokens,settings,urls,gaProfile,startDate,endDate,done) {
  const resultsMap = [];
  let includedReportsCount = 0;
  const reportTypes = [
    {
      'metrics': ['ga:pageviews','ga:timeOnPage'],
      'dimensions': ['ga:date','ga:hostname','ga:pagePath'],
      'dimensionFilterClauses': []
    },
    {
      'metrics': ['ga:pageviews'],
      'dimensions': ['ga:date','ga:hostname','ga:pagePath','ga:socialNetwork'],
      'dimensionFilterClauses': []
    }
  ];
  const reportRequests = reportTypes.filter(function(request,i) {
    if (pageTokens === null || pageTokens[i] !== null) {
      resultsMap[includedReportsCount] = i;
      includedReportsCount++;
      return true;
    } else {
      return false;
    }
  }).map(function(request,i) {
    return {
      'metrics': request.metrics.map(function(metric) {
        return {
          'expression': metric
        }
      }),
      'dimensions': request.dimensions.map(function(dimension) {
        return {
          'name': dimension
        }
      }),
      'viewId': 'ga:' + gaProfile,
      'dateRanges': {
        'startDate': formatDate(startDate),
        'endDate': formatDate(endDate),
      },
      'samplingLevel': 'LARGE',
      'dimensionFilterClauses': {
        'operator': 'AND',
        'filters': request.dimensionFilterClauses.concat({
          'dimensionName': 'ga:pagePath',
          'operator': 'IN_LIST',
          'expressions': urls.map(function(url) {
            return url.path;
          })
        })
      },
      'pageSize': 10000,
      'pageToken': (pageTokens && i < pageTokens.length) ? pageTokens[i] : null,
      'includeEmptyRows': true,
      'hideTotals': true,
      'hideValueRanges': true
    };
  });
  request.post({
    'uri': 'https://analyticsreporting.googleapis.com/v4/reports:batchGet',
    'body': {
      'reportRequests': reportRequests
    },
    'json': true,
    'auth': {
      'bearer': settings._.google.accessToken
    }
  },function(err,res,body) {
    if (err) {
      done(err);
    } else if (body.reports && body.reports.length == reportRequests.length) {
      const pageTokens = reportTypes.map(function(report) {
        return null;
      });
      let hasTokens = false;
      body.reports.forEach(function(report,i) {
        previousResponseBodies[resultsMap[i]].push(report);
        if (report.nextPageToken) {
          hasTokens = true;
          pageTokens[resultsMap[i]] = report.nextPageToken;
        }
      });
      if (hasTokens) {
        executeRequest(previousResponseBodies,pageTokens,settings,urls,gaProfile,startDate,endDate,done);
      } else {
        done(null,previousResponseBodies);
      }
    } else if (body.error) {
      done(new Error(body.error.message));
    } else {
      done(new Error('Unknown response'))
    }
  });
}

function processResponseBodies(urls,responseBodies) {
  const consolidatedReport = {};
  responseBodies.forEach(function(responseBodySet,i) {
    responseBodySet.forEach(function(report) {
      report.data.rows.forEach(function(row) {
        const date = new Date(Date.parse([row.dimensions[0].substring(0,4),row.dimensions[0].substring(4,6),row.dimensions[0].substring(6,8)].join('-')));
        const dateStamp = date.getTime();
        const url = getURLForHostnameAndPath(urls,row.dimensions[1],row.dimensions[2]);
        if (url) {
          if (!consolidatedReport[url.href]) {
            consolidatedReport[url.href] = {};
          }
          if (!consolidatedReport[url.href][dateStamp]) {
            consolidatedReport[url.href][dateStamp] = {
              'date': date,
              'metrics': {}
            };
          }
          switch(i) {
            case 0:
              ['pageviews','timeOnPage'].forEach(function(metricName,j) {
                consolidatedReport[url.href][dateStamp].metrics[metricName] = parseInt(row.metrics[0].values[j]);
              });
              break;
            case 1:
              const networkName = row.dimensions[3].toLowerCase();
              if (networkName != '(not set)') {
                [networkName+'_pageviews'].forEach(function(metricName,j) {
                  consolidatedReport[url.href][dateStamp].metrics[metricName] = parseInt(row.metrics[0].values[j]);
                });
              }
              break;
          }
        }
      })
    });
  });
  return consolidatedReport;
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

function getURLForHostnameAndPath(urls,hostname,path) {
  return urls.find(function(url) {
    return url.host == hostname && url.path == path;
  })
}
