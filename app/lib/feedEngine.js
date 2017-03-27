const async = require('async');
const feedEngines = require('./feedEngines');
const FeedParser = require('feedparser');
const request = require('request');
const url = require('url');
const fs = require('fs');
const path = require('path');

const Metrics = [
  {
    'name': 'pageviews',
    'type': 'cumulative'
  },
  {
    'name': 'avgTimeOnPage',
    'type': 'average'
  },
  {
    'name': 'facebook_pageviews',
    'type': 'cumulative'
  },
  {
    'name': 'linkedin_pageviews',
    'type': 'cumulative'
  },
  {
    'name': 'twitter_pageviews',
    'type': 'cumulative'
  }
];
const OneDay = 24 * 60 * 60 * 1000;
const WriteTestData = false;

exports.runReport = function(settings,feedUrl,gaProfile,nPosts,nDays,done) {
  async.waterfall([
    function(next) {
      getFeedItems(feedUrl,next);
    },
    function(feed,next) {
      sortFeed(feed);
      filterReportFeed(feed,nPosts * 2,next);
    },
    function(feed,next) {
      const dateBounds = getDateBounds(feed);
      dateBounds.start = new Date(dateBounds.start.getTime() - (nDays * OneDay));
      dateBounds.end = new Date(dateBounds.end.getTime() + (nDays * OneDay));
      const urls = convertFeedToUrls(feed);
      feedEngines.googleAnalyticsBenchmarks.run(settings,urls,gaProfile,dateBounds.start,dateBounds.end,function(err,report) {
        next(err,feed,report);
      });
    },
    function(feed,results,next) {
      parseReport(nPosts,nDays,feed,results,function(err,reports) {
        next(err,reports,feed,results);
      });
    },
    function(reports,feed,results,next) {
      if (WriteTestData) {
        const json = {
          'feed': feed,
          'report': results,
          'finalReport': reports
        };
        fs.writeFile(path.join(__dirname,'../testData.json'),JSON.stringify(json),function(err) {
          next(err,reports);
        });
      } else {
        next(null,reports);
      }
    }
  ],done);
}

function getFeedItems(feedUrl,done) {
  const req = request(feedUrl);
  const feedparser = new FeedParser();
  const items = [];

  req.on('error',done);
  req.on('response',function(res) {
    const stream = this;
    if (res.statusCode !== 200) {
      done(new Error('Bad status code'));
    } else {
      stream.pipe(feedparser);
    }
  });

  feedparser.on('error',done);
  feedparser.on('readable',function() {
    const stream = this;
    const meta = this.meta;
    var item;
    while (item = stream.read()) {
      items.push(item);
    }
  });
  feedparser.on('end',function() {
    done(null,items);
  })
}

function sortFeed(feed) {
  feed.sort(function(a,b) {
    return b.pubdate.getTime() - a.pubdate.getTime();
  });
}

function convertFeedToUrls(feed) {
  return feed.map(function(feedItem) {
    return url.parse(feedItem.link);
  }).filter(function(urlObj) {
    return urlObj;
  });
}

function filterReportFeed(feed,nPosts,done) {
  if (feed.length < nPosts) {
    done(new Error('Feed too short.'));
  } else {
    done(null,feed.slice(0,nPosts));
  }
}

function getDateBounds(feed) {
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

function parseReport(nPosts,nDays,feed,report,done) {
  const reports = [];
  feed.slice(0,nPosts).forEach(function(reportPost,i) {
    const averages = {
      'daily': {},
      'cumulative': {}
    };
    const scores = {
      'daily': {},
      'cumulative': {},
      'overall': null
    };
    const overalls = {};
    const actuals = {};
    const thisReport = {
      'url': reportPost.link,
      'title': reportPost.title,
      'startDate': new Date(Date.parse(formatDate(reportPost.pubdate))),
      'endDate': new Date(Math.min(Date.parse(formatDate(reportPost.pubdate)) + (nDays * OneDay),new Date().getTime())),
      'averages': averages,
      'actuals': actuals,
      'scores': scores,
      'overalls': overalls
    };
    reports.push(thisReport)

    const computePosts = feed.slice(i+1,i+nPosts);
    computePosts.forEach(function(computePost,j) {
      const baseDate = new Date(Date.parse(formatDate(computePost.pubdate)));
      Metrics.forEach(function(metric,k) {
        if (!averages.daily[metric.name]) {
          averages.daily[metric.name] = [];
        }
        if (!averages.cumulative[metric.name]) {
          averages.cumulative[metric.name] = [];
        }
        if (!averages.cumulative[metric.name][j]) {
          averages.cumulative[metric.name][j] = [];
        }
        for(var l = 0; l < nDays; l++) {
          if (!averages.daily[metric.name][l]) {
            averages.daily[metric.name][l] = [];
          }
          const stamp = baseDate.getTime() + (l * OneDay);
          if (report[computePost.link] && report[computePost.link][stamp] && report[computePost.link][stamp].metrics[metric.name]) {
            averages.daily[metric.name][l].push(report[computePost.link][stamp].metrics[metric.name]);
            averages.cumulative[metric.name][j].push(report[computePost.link][stamp].metrics[metric.name]);
          }
        }
      });
    });

    Metrics.forEach(function(metric,k) {
      for(var l = 0; l < nDays; l++) {
        averages.daily[metric.name][l] = averages.daily[metric.name][l].reduce(function(previous,current) {
          return previous + current;
        },0) / computePosts.length;
      }
      averages.cumulative[metric.name] = averages.cumulative[metric.name].reduce(function(previous,postSet) {
        const total = postSet.reduce(function(previous1,value) {
          return previous1 + value;
        },0);
        if (metric.type == 'cumulative') {
          return previous + total;
        } else if (metric.type == 'average') {
          return previous + (total / postSet.length);
        } else {
          throw new Error('No type defined');
        }
      },0) / computePosts.length;
    });

    Metrics.forEach(function(metric,k) {
      scores.daily[metric.name] = [];
      actuals[metric.name] = [];
      overalls[metric.name] = [];
      for(var l = 0; l < nDays; l++) {
        const stamp = thisReport.startDate.getTime() + (l * OneDay);
        if (report[reportPost.link] && report[reportPost.link][stamp] && report[reportPost.link][stamp].metrics[metric.name]) {
          const value = report[reportPost.link][stamp].metrics[metric.name];
          actuals[metric.name][l] = value;
          overalls[metric.name].push(value);
          if (averages.daily[metric.name] && averages.daily[metric.name][l]) {
            scores.daily[metric.name][l] = (value / averages.daily[metric.name][l]) - 1;
          } else {
            scores.daily[metric.name][l] = 0;
          }
        } else {
          scores.daily[metric.name][l] = 0;
          actuals[metric.name][l] = 0;
        }
      }
      if (metric.type == 'cumulative') {
        overalls[metric.name] = overalls[metric.name].reduce(function(total,item) {
          return total + item;
        },0);
      } else if (metric.type == 'average') {
        overalls[metric.name] = overalls[metric.name].reduce(function(total,item) {
          return total + item;
        },0) / overalls[metric.name].length;
      } else {
        throw new Error('No type defined');
      }
      scores.cumulative[metric.name] = overalls[metric.name] > 0 ? ((overalls[metric.name] / averages.cumulative[metric.name]) - 1) : null;
    });
    scores.overall = Metrics.reduce(function(previous,metric) {
      return previous + (scores.cumulative[metric.name] ? scores.cumulative[metric.name] : 0);
    },0) / Metrics.length;
  });
  done(null,reports);
}

function formatDate(dateObj) {
  var prependZero = function(val) {
    if (val < 10) {
      return '0' + val;
    } else {
      return val;
    }
  }
  return [dateObj.getFullYear(),prependZero(dateObj.getMonth()+1),prependZero(dateObj.getDate())].join('-')+'T00:00:00.000Z';
}

exports.testable = {
  'formatDate': formatDate,
  'parseReport': parseReport,
  'getDateBounds': getDateBounds,
  'filterReportFeed': filterReportFeed,
  'convertFeedToUrls': convertFeedToUrls,
  'sortFeed': sortFeed
};
