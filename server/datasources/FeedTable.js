const FeedDataSource = require('./FeedDataSource');
const _ = require('lodash');

class FeedStats extends FeedDataSource {

  getGoogleRequestMetricsDimensions() {
    return [
      {
        'metrics': ['ga:pageviews','ga:users','ga:avgTimeOnPage'],
        'dimensions': ['ga:hostname','ga:pagePath'],
      },
      {
        'metrics': ['ga:totalEvents'],
        'dimensions': [
          'ga:hostname',
          'ga:pagePath',
          'ga:eventAction'
        ]
      }
    ];
  }

  getGoogleRequestDimensionFilterClauses(requestNum) {
    if (requestNum == 1) {
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
      ];
    }
    return [];
  }

  generateWidgets(feed,report) {
    return [
      {
        'data': report,
        'type': 'table',
        'label': 'Recent Posts'
      }
    ];
  }

  getDateBounds(feed,range) {
    const now = new Date();
    return {
      'start': new Date(now.getTime() - range),
      'end': now
    }
  }

  filterReportFeed(feed,range) {
    const base = new Date(new Date().getTime() - range);
    return feed.filter((post) => {
      return post.pubdate.getTime() > base.getTime();
    })
  }

  processGoogleResponseBodies(feed,urls,responseBodies) {
    const metricNameMap = {
      'pageviews': 'Views',
      'users': 'Unique Views',
      'avgTimeOnPage': 'Average Time on Page'
    }
    const consolidatedReport = {};
    responseBodies.forEach((responseBodySet,i) => {
      responseBodySet.forEach((report) => {
        if (report.data.rows && report.data.rows.length) {
          report.data.rows.forEach((row) => {
            const foundURL = this.getURLForHostnameAndPath(urls,row.dimensions[0],row.dimensions[1]);
            if (foundURL) {
              if (!consolidatedReport[foundURL.href]) {
                const feedRow = feed.find((feedItem) => {
                  return feedItem.link == foundURL.href;
                })
                consolidatedReport[foundURL.href] = {
                  'URL': foundURL.href,
                  'Name': feedRow ? feedRow.title : foundURL.href,
                  'Date': feedRow ? feedRow.pubDate : null
                };
              }
              switch(i) {
                case 0:
                  ['pageviews','users','avgTimeOnPage'].forEach(function(metricName,j) {
                    if (consolidatedReport[foundURL.href][metricNameMap[metricName]]) {
                      throw new Error('Property already set: ' + foundURL.href + '|' + metricName);
                    } else {
                      switch(j) {
                        case 2:
                          consolidatedReport[foundURL.href][metricNameMap[metricName]] = parseFloat(row.metrics[0].values[j]);
                          break;
                        default:
                          consolidatedReport[foundURL.href][metricNameMap[metricName]] = parseInt(row.metrics[0].values[j]);
                          break;
                      }
                    }
                  });
                  break;
                case 1:
                  const depth = parseInt(row.dimensions[2]) / 100;
                  const total = parseInt(row.metrics[0].values[0]);
                  if (!consolidatedReport[foundURL.href]['Average Scroll Depth']) {
                    consolidatedReport[foundURL.href]['Average Scroll Depth'] = {};
                  }
                  if (!consolidatedReport[foundURL.href]['Average Scroll Depth'][depth]) {
                    consolidatedReport[foundURL.href]['Average Scroll Depth'][depth] = 0;
                  }
                  consolidatedReport[foundURL.href]['Average Scroll Depth'][depth] += total;
                  break;
              }
            }
          });
        }
      });
    });
    const reportArray = _.values(consolidatedReport);
    reportArray.sort((a,b) => {
      return b.Date.getTime() - a.Date.getTime();
    });
    reportArray.forEach((row) => {
      delete row.Date;

      const keys = _.keys(row['Average Scroll Depth']).map((val) => parseFloat(val));
      keys.sort();
      const scrollDepths = [];
      keys.forEach(function(key,i) {
        var eventsLogged = row['Average Scroll Depth'][key];
        if (i < keys.length - 1) {
          const overrideEvents = row['Average Scroll Depth'][keys[i + 1]];
          eventsLogged -= overrideEvents;
        }
        for(var j = 0; j < eventsLogged; j++) {
          scrollDepths.push(key);
        }
      });

      row['Average Scroll Depth'] = Math.round((scrollDepths.reduce(function(total,current) {
        return total + current;
      }) / scrollDepths.length) * 100)+"%"
    });
    return reportArray;
  }
}

module.exports = FeedStats;
