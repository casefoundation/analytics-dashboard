const async = require('async');
const reporters = require('./reporters');
const FeedParser = require('feedparser');
const request = require('request');
const url = require('url');
const fs = require('fs');
const path = require('path');

const Metrics = ['pageviews','timeOnPage','facebook_pageviews','linkedin_pageviews','twitter_pageviews'];
const OneDay = 24 * 60 * 60 * 1000;
const WriteTestData = true;

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
      const urls = convertFeedToUrls(feed);
      reporters.googleAnalytics.run(settings,urls,gaProfile,dateBounds.start,dateBounds.end,function(err,report) {
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
    const actuals = {};
    const thisReport = {
      'url': reportPost.link,
      'title': reportPost.title,
      'startDate': new Date(Date.parse(formatDate(reportPost.pubdate))),
      'endDate': new Date(Math.min(Date.parse(formatDate(reportPost.pubdate)) + (nDays * OneDay),new Date().getTime())),
      'averages': averages,
      'actuals': actuals,
      'scores': scores
    };
    reports.push(thisReport)

    const computePosts = feed.slice(i+1,i+nPosts);
    computePosts.forEach(function(computePost,j) {
      const baseDate = new Date(Date.parse(formatDate(computePost.pubdate)));
      Metrics.forEach(function(metric,k) {
        if (!averages.daily[metric]) {
          averages.daily[metric] = [];
        }
        if (!averages.cumulative[metric]) {
          averages.cumulative[metric] = [];
        }
        if (!averages.cumulative[metric][j]) {
          averages.cumulative[metric][j] = [];
        }
        for(var l = 0; l < nDays; l++) {
          if (!averages.daily[metric][l]) {
            averages.daily[metric][l] = [];
          }
          const stamp = baseDate.getTime() + (l * OneDay);
          if (report[computePost.link] && report[computePost.link][stamp] && report[computePost.link][stamp].metrics[metric]) {
            averages.daily[metric][l].push(report[computePost.link][stamp].metrics[metric]);
            averages.cumulative[metric][j].push(report[computePost.link][stamp].metrics[metric]);
          }
        }
      });
    });

    Metrics.forEach(function(metric,k) {
      for(var l = 0; l < nDays; l++) {
        averages.daily[metric][l] = averages.daily[metric][l].reduce(function(previous,current) {
          return previous + current;
        },0) / computePosts.length;
      }
      averages.cumulative[metric] = averages.cumulative[metric].reduce(function(previous,postSet) {
        return previous + postSet.reduce(function(previous1,value) {
          return previous1 + value;
        },0);
      },0) / computePosts.length;
    });

    Metrics.forEach(function(metric,k) {
      scores.daily[metric] = [];
      scores.cumulative[metric] = 0;
      actuals[metric] = [];
      for(var l = 0; l < nDays; l++) {
        const stamp = thisReport.startDate.getTime() + (l * OneDay);
        if (report[reportPost.link] && report[reportPost.link][stamp] && report[reportPost.link][stamp].metrics[metric]) {
          const value = report[reportPost.link][stamp].metrics[metric];
          actuals[metric][l] = value;
          scores.cumulative[metric] += value;
          if (averages.daily[metric] && averages.daily[metric][l]) {
            scores.daily[metric][l] = (value / averages.daily[metric][l]) - 1;
          } else {
            scores.daily[metric][l] = 0;
          }
        } else {
          scores.daily[metric][l] = 0;
          actuals[metric][l] = 0;
        }
      }
      scores.cumulative[metric] = scores.cumulative[metric] > 0 ? ((scores.cumulative[metric] / averages.cumulative[metric]) - 1) : null;
    });
    scores.overall = Metrics.reduce(function(previous,metric) {
      return previous + (scores.cumulative[metric] ? scores.cumulative[metric] : 0);
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
