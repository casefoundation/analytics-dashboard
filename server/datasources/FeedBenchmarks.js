const google = require('googleapis');
const analyticsreporting = google.analyticsreporting('v4');
const async = require('async');
const FeedParser = require('feedparser');
const url = require('url');
const fs = require('fs');
const path = require('path');
const GoogleDataSource = require('./GoogleDataSource');
const request = require('request');

const OneDay = 24 * 60 * 60 * 1000;
const WriteTestData = false;

class FeedBenchmarks extends GoogleDataSource {
  query(range) {
    return this.getFeedItems()
      .then((feed) => {
        this.sortFeed(feed);
        const newFeed = this.filterReportFeed(feed);
        return this.fetchAnalytics(newFeed);
      })
      .then(({feed,report}) => {
        return [
          {
            'data': this.analyzeReport(feed,report),
            'type': 'sparklines',
            'label': 'Post Performance',
            'primary': 'Actual',
            'secondary': 'Average',
            'xAxis': 'Date'
          }
        ];
      })
  }

  getFeedItems() {
    return new Promise((resolve,reject) => {
      const req = request(this.config.feedUrl);
      const feedparser = new FeedParser();
      const items = [];

      req.on('error',reject);
      req.on('response',function(res) {
        const stream = this;
        if (res.statusCode !== 200) {
          reject(new Error('Bad status code'));
        } else {
          stream.pipe(feedparser);
        }
      });

      feedparser.on('error',reject);
      feedparser.on('readable',function() {
        const stream = this;
        const meta = this.meta;
        var item;
        while (item = stream.read()) {
          items.push(item);
        }
      });
      feedparser.on('end',function() {
        resolve(items);
      })
    });
  }

  sortFeed(feed) {
    feed.sort(function(a,b) {
      return b.pubdate.getTime() - a.pubdate.getTime();
    });
  }

  convertFeedToUrls(feed) {
    return feed.map(function(feedItem) {
      return url.parse(feedItem.link);
    }).filter(function(urlObj) {
      return urlObj;
    });
  }

  filterReportFeed(feed) {
    if (feed.length < this.config.nPosts * 2) {
      throw new Error('Feed too short.');
    } else {
      return feed.slice(0,this.config.nPosts * 2);
    }
  }

  getDateBounds(feed) {
    const dates = {
      'start': null,
      'end': null
    }
    feed.forEach(function(item) {
      if (dates.start == null || dates.start.getTime() > item.pubdate.getTime()) {
        dates.start = item.pubdate;
      }
      if (dates.end == null || dates.end.getTime() < item.pubdate.getTime()) {
        dates.end = item.pubdate;
      }
    });
    return dates;
  }

  fetchAnalytics(feed) {
    const dateBounds = this.getDateBounds(feed);
    dateBounds.start = new Date(dateBounds.start.getTime() - (this.config.nDays * OneDay));
    dateBounds.end = new Date(dateBounds.end.getTime() + (this.config.nDays * OneDay));
    const urls = this.convertFeedToUrls(feed);
    return this.executeGoogleRequest([[],[]],null,dateBounds,urls)
      .then((responseBodies) => {
        return {
          feed,
          'report': this.processGoogleResponseBodies(urls,responseBodies)
        }
      })
  }

  executeGoogleRequest(previousResponseBodies,pageTokens,dateBounds,urls) {
    return new Promise((resolve,reject) => {
      const resultsMap = [];
      let includedReportsCount = 0;
      const reportTypes = [
        {
          'metrics': ['ga:pageviews'],
          'dimensions': ['ga:date','ga:hostname','ga:pagePath'],
        },
      ];
      const reportRequests = reportTypes.filter((request,i) => {
        if (pageTokens === null || pageTokens[i] !== null) {
          resultsMap[includedReportsCount] = i;
          includedReportsCount++;
          return true;
        } else {
          return false;
        }
      }).map((request,i) => {
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
          'viewId': 'ga:' + this.config.profile,
          'dateRanges': [{
            'startDate': this.formatDate(dateBounds.start),
            'endDate': this.formatDate(dateBounds.end),
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
      analyticsreporting.reports.batchGet({
        'auth': this.jwt,
        'resource': {
          'reportRequests': reportRequests
        }
      },{},(err,response) => {
        if (err) {
          reject(err);
        } else if (response.reports && response.reports.length == reportRequests.length) {
          const pageTokens = reportTypes.map(function(report) {
            return null;
          });
          let hasTokens = false;
          response.reports.forEach(function(report,i) {
            previousResponseBodies[resultsMap[i]].push(report);
            if (report.nextPageToken) {
              hasTokens = true;
              pageTokens[resultsMap[i]] = report.nextPageToken;
            }
          });
          if (hasTokens) {
            this.executeRequest(previousResponseBodies,pageTokens,dateBounds,urls);
          } else {
            resolve(previousResponseBodies);
          }
        } else if (body.error) {
          reject(new Error(body.error.message));
        } else {
          reject(new Error('Unknown response'))
        }
      });
    });
  }

  processGoogleResponseBodies(urls,responseBodies) {
    const consolidatedReport = {};
    responseBodies.forEach((responseBodySet,i) => {
      responseBodySet.forEach((report) => {
        if (report.data.rows && report.data.rows.length) {
          report.data.rows.forEach((row) => {
            const date = new Date(Date.parse([row.dimensions[0].substring(0,4),row.dimensions[0].substring(4,6),row.dimensions[0].substring(6,8)].join('-')));
            const dateStamp = date.getTime();
            const foundURL = this.getURLForHostnameAndPath(urls,row.dimensions[1],row.dimensions[2]);
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
                  ['pageviews'].forEach(function(metricName,j) {
                    if (!consolidatedReport[foundURL.href][dateStamp].metrics[metricName]) {
                       consolidatedReport[foundURL.href][dateStamp].metrics[metricName] = 0;
                    }
                    consolidatedReport[foundURL.href][dateStamp].metrics[metricName] += parseInt(row.metrics[0].values[j]);
                  });
                  break;
              }
            }
          });
        }
      });
    });
    return consolidatedReport;
  }

  analyzeReport(feed,report) {
    const reports = [];
    feed.slice(0,this.config.nPosts).forEach((reportPost,i) => {
      const data = [];
      const thisReport = {
        'url': reportPost.link,
        'name': reportPost.title,
        'startDate': new Date(Date.parse(this.formatDate(reportPost.pubdate))),
        'endDate': new Date(Math.min(Date.parse(this.formatDate(reportPost.pubdate)) + (this.config.nDays * OneDay),new Date().getTime())),
        'data': data
      };

      reports.push(thisReport);

      const computePosts = feed.slice(i+1,i+this.config.nPosts);
      computePosts.forEach((computePost,j) => {
        const baseDate = new Date(Date.parse(this.formatDate(computePost.pubdate)));
        for(var l = 0; l < this.config.nDays; l++) {
          const stamp = baseDate.getTime() + (l * OneDay);
          if (!data[l]) {
            data[l] = {
              'Average': [],
              'Actual': 0,
              'Date': new Date(stamp).toDateString()
            };
          }
          if (report[computePost.link] && report[computePost.link][stamp] && report[computePost.link][stamp].metrics.pageviews) {
            data[l].Average.push(report[computePost.link][stamp].metrics.pageviews);
          }
        }
      });

      for(var l = 0; l < this.config.nDays; l++) {
        if (l < data.length) {
          data[l].Average = data[l].Average.reduce(function(previous,current) {
            return previous + current;
          },0) / computePosts.length;
        } else {
          data[l].Average = 0;
        }
      }

      for(var l = 0; l < this.config.nDays; l++) {
        const stamp = thisReport.startDate.getTime() + (l * OneDay);
        if (report[reportPost.link] && report[reportPost.link][stamp] && report[reportPost.link][stamp].metrics.pageviews) {
          const value = report[reportPost.link][stamp].metrics.pageviews;
          data[l].Actual = value;
        } else {
          data[l].Actual = 0;
        }
      }
    });
    return reports;
  }
}

module.exports = FeedBenchmarks;
