const request = require('request');
const async = require('async');
const url = require('url');

module.exports = {
  'init': function(settings,app,done) {
    done();
  },
  'run': function(settings,urls,gaProfile,startDate,endDate,done) {
    if (settings._.google && settings._.google.accessToken) {
      executeRequest([[],[]],null,settings,urls,gaProfile,startDate,endDate,function(err,responseBodies) {
        if (err) {
          done(err);
        } else {
          done(null,processResponseBodies(urls,responseBodies));
        }
      });
    } else {
      done(new Error('No access token'));
    }
  }
};

function executeRequest(previousResponseBodies,pageTokens,settings,urls,gaProfile,startDate,endDate,done) {
  const resultsMap = [];
  let includedReportsCount = 0;
  const reportTypes = [
    {
      'metrics': ['ga:pageviews','ga:avgTimeOnPage'],
      'dimensions': ['ga:date','ga:hostname','ga:pagePath'],
    },
    {
      'metrics': ['ga:pageviews'],
      'dimensions': ['ga:date','ga:hostname','ga:pagePath','ga:socialNetwork'],
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
      'dateRanges': [{
        'startDate': formatDate(startDate),
        'endDate': formatDate(endDate),
      }],
      'samplingLevel': 'LARGE',
      'dimensionFilterClauses': [{
        'operator': 'OR',
        'filters': urls.map(function(url) {
          return {
            'dimensionName': 'ga:pagePath',
            'operator': 'BEGINS_WITH',
            'expressions': [url.path]
          }
        })
      }],
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
      if (report.data.rows && report.data.rows.length) {
        report.data.rows.forEach(function(row) {
          const date = new Date(Date.parse([row.dimensions[0].substring(0,4),row.dimensions[0].substring(4,6),row.dimensions[0].substring(6,8)].join('-')));
          const dateStamp = date.getTime();
          const foundURL = getURLForHostnameAndPath(urls,row.dimensions[1],row.dimensions[2]);
          if (foundURL) {
            if (!consolidatedReport[foundURL.href]) {
              consolidatedReport[foundURL.href] = {};
            }
            if (!consolidatedReport[foundURL.href][dateStamp]) {
              consolidatedReport[foundURL.href][dateStamp] = {
                'date': date,
                'metrics': {}
              };
            }
            switch(i) {
              case 0:
                ['pageviews','avgTimeOnPage'].forEach(function(metricName,j) {
                  if (!consolidatedReport[foundURL.href][dateStamp].metrics[metricName]) {
                     consolidatedReport[foundURL.href][dateStamp].metrics[metricName] = 0;
                  }
                  consolidatedReport[foundURL.href][dateStamp].metrics[metricName] += parseInt(row.metrics[0].values[j]);
                });
                break;
              case 1:
                const networkName = row.dimensions[3].toLowerCase();
                if (networkName != '(not set)') {
                  [networkName+'_pageviews'].forEach(function(metricName,j) {
                    if (!consolidatedReport[foundURL.href][dateStamp].metrics[metricName]) {
                      consolidatedReport[foundURL.href][dateStamp].metrics[metricName] = 0;
                    }
                    consolidatedReport[foundURL.href][dateStamp].metrics[metricName] += parseInt(row.metrics[0].values[j]);
                  });
                }
                break;
            }
          }
        });
      }
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
  const submittedURL = url.parse('http://' + hostname + path);
  return urls.find(function(url) {
    return url.host == submittedURL.host && url.pathname == submittedURL.pathname;
  })
}
