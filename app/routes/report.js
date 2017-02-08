const reporter = require('../lib/reporter');
const settings = require('remote-settings');

exports.runReport = function(req,res,next) {
  if (settings._.feeds) {
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
  } else {
    res.send(404);
  }
}
