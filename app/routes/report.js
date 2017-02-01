const reporter = require('../lib/reporter');
const settings = require('../settings');

exports.runReport = function(req,res,next) {
  const feed = settings._.feeds.find(function(feed) {
    return feed.id === req.params.id;
  });
  if (feed) {
    reporter.runReport(settings,feed.url,feed.googleAccount.profile,feed.nPosts,feed.nDays,function(err,report) {
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
