const express = require('express');
const async = require('async');
const bodyParser = require('body-parser');
const logger = require('morgan');
const settings = require('./settings.js');
const reporters = require('./lib/reporters');
const reporter = require('./lib/reporter');
const routes = require('./routes');

const app = express();
app.use(routes.auth.refreshToken);
app.use(logger('combined'));
app.use(bodyParser.json());

app.get('/auth/googleanalytics',routes.auth.startGoogleAuth);
app.get('/auth/googleanalytics/done',routes.auth.finishGoogleAuth);
app.get('/api/googleaprofiles',routes.settings.googleProfiles);
app.get('/api/feed',routes.feeds.getFeeds);
app.get('/api/feed/:id',routes.feeds.getFeed);
app.post('/api/feed',routes.feeds.saveFeed);
app.put('/api/feed/:id',routes.feeds.saveFeed);
app.delete('/api/feed/:id',routes.feeds.deleteFeed);
app.get('/api/feed/:id/report',routes.report.runReport);

async.waterfall([
  function(next) {
    settings.init('./settings.json',{},next);
  },
  function(next) {
    const reportersArray = [];
    for(const reporterName in reporters) {
      reportersArray.push(reporters[reporterName]);
    }
    async.parallel(
      reportersArray.map(function(reporter) {
        return function(next1) {
          reporter.init(settings,app,next1);
        }
      }),
      function(err) {
        next(err);
      }
    );
  },
  function(next) {
    app.listen(process.env.PORT || 8080,next);
  }
],function(err) {
  if (err) {
    console.error(err);
  } else {
    console.log('Running');
  }
});

exports.app = app;
