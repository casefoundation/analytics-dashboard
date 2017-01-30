const express = require('express');
const async = require('async');
const bodyParser = require('body-parser');
const logger = require('morgan');
const config = require('./config.js');
const reporters = require('./lib/reporters');
const reporter = require('./lib/reporter');
const routes = require('./routes');

const app = express();
app.use(logger('combined'));
app.use(bodyParser.urlencoded({
  'extended': true,
  'limit': '8mb'
}));
app.use(bodyParser.json({
  'limit': '8mb'
}));
app.use(express.static(__dirname + '/public'));

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
    config.init('./config.json',{},next);
  },
  function(next) {
    const reportersArray = [];
    for(const reporterName in reporters) {
      reportersArray.push(reporters[reporterName]);
    }
    async.parallel(
      reportersArray.map(function(reporter) {
        return function(next1) {
          reporter.init(config,app,next1);
        }
      }),
      function(err) {
        next(err);
      }
    );
  },
  function(next) {
    app.listen(config._.port,next);
  }
],function(err) {
  if (err) {
    console.error(err);
  } else {
    console.log('Running')
  }
});
