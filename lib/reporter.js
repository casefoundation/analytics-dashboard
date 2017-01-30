const async = require('async');
const reporters = require('./reporters');
const FeedParser = require('feedparser');
const request = require('request');
const url = require('url');

const Metrics = ['sessions','hits','facebook_hits','linkedin_hits','twitter_hits'];
const OneDay = 24 * 60 * 60 * 1000;

exports.runReport = function(config,feedUrl,gaProfile,nPosts,nDays,done) {
  async.waterfall([
    function(next) {
      getFeedItems(feedUrl,next);
    },
    function(feed,next) {
      sortFeed(feed);
      filterReportFeed(feed,nPosts * 2,next);
    },
    function(feed,next) {
      const dateBounds = getDateBounds(feed,nDays);
      const urls = convertFeedToUrls(feed);
      reporters.googleAnalytics.run(config,urls,gaProfile,dateBounds.start,dateBounds.end,function(err,report) {
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
    return a.pubdate.getTime() - b.pubdate.getTime();
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

function getDateBounds(feed,nDays) {
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
  feed.slice(0,nPosts).forEach(function(reportPost,i) {
    const averages = {};
    feed.slice(i+1,nPosts).forEach(function(computePost,j) {
      const baseDate = new Date(Date.parse(formatDate(computePost.pubdate)));
      Metrics.forEach(function(metric,k) {
        if (!averages[metric]) {
          averages[metric] = {};
        }
        for(var l = 1; l <= nDays; l++) {
          if (!averages[metric][l]) {
            averages[metric][l] = 0;
          }
          for(var m = 0; m <= l; m++) {
            const stamp = baseDate.getTime() + (m * OneDay);
            if (report[computePost.link][stamp] && report[computePost.link][stamp].metrics[metric]) {
              averages[metric][l] += report[computePost.link][stamp].metrics[metric];
            }
          }
        }
      });
    });
    for(const metric in averages) {
      for(const day in averages[metric]) {
        averages[metric][day] = averages[metric][day] / day;
      }
    }
    console.log(averages);
  });
  //TODO
  done(null,report);
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
