const reporter = require('../lib/reporter');
const config = require('../config');

exports.runReport = function(req,res,next) {
  const feed = config._.feeds.find(function(feed) {
    return feed.id === req.params.id;
  });
  if (feed) {
    reporter.runReport(config,feed.url,feed.profile,feed.nPosts,feed.nDays,function(err,report) {
      if (err) {
        next(err);
      } else {
        res.send(report);
      }
    });
  } else {
    res.send(404);
  }
}
