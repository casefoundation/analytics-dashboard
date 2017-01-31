const async = require('async');
const reporters = require('./reporters');
const FeedParser = require('feedparser');
const request = require('request');
const url = require('url');

const Metrics = ['pageviews','facebook_pageviews','linkedin_pageviews','twitter_pageviews'];
const OneDay = 24 * 60 * 60 * 1000;

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
      parseReport(nPosts,nDays,feed,results,next);
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
  })
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
    const averages = {};
    const scores = {};
    const actuals = {};
    const thisReport = {
      'url': reportPost.link,
      'date': new Date(Date.parse(formatDate(reportPost.pubdate))),
      'averages': averages,
      'actuals': actuals,
      'scores': scores
    };
    reports.push(thisReport)

    const computePosts = feed.slice(i+1,i+nPosts);
    computePosts.forEach(function(computePost,j) {
      const baseDate = new Date(Date.parse(formatDate(computePost.pubdate)));
      Metrics.forEach(function(metric,k) {
        if (!averages[metric]) {
          averages[metric] = [];
        }
        for(var l = 0; l < nDays; l++) {
          if (!averages[metric][l]) {
            averages[metric][l] = [];
          }
          const stamp = baseDate.getTime() + (l * OneDay);
          if (report[computePost.link][stamp] && report[computePost.link][stamp].metrics[metric]) {
            averages[metric][l].push(report[computePost.link][stamp].metrics[metric]);
          }
        }
      });
    });

    Metrics.forEach(function(metric,k) {
      for(var l = 0; l < nDays; l++) {
        averages[metric][l] = averages[metric][l].reduce(function(previous,current) {
          return previous + current;
        },0) / computePosts.length;
      }
    });

    Metrics.forEach(function(metric,k) {
      scores[metric] = [];
      actuals[metric] = [];
      for(var l = 0; l < nDays; l++) {
        const stamp = thisReport.date.getTime() + (l * OneDay);
        if (report[reportPost.link][stamp] && report[reportPost.link][stamp].metrics[metric] && averages[metric] && averages[metric][l]) {
          const value = report[reportPost.link][stamp].metrics[metric];
          scores[metric][l] = value / averages[metric][l];
          actuals[metric][l] = value;
        } else {
          scores[metric][l] = 0;
          actuals[metric][l] = 0;
        }
      }
    });
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