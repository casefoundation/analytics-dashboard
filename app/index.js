const express = require('express');
const bodyParser = require('body-parser');
const routes = require('./routes');
const logger = require('morgan');

const app = express();
app.use(logger('combined'));
app.use(routes.google.refreshToken);
app.use(bodyParser.json());
app.set('view engine', 'ejs');

app.get('/auth/googleanalytics',routes.google.startGoogleAuth);
app.get('/auth/googleanalytics/done',routes.google.finishGoogleAuth);
app.get('/api/googleaprofiles',routes.google.googleProfiles);
app.get('/api/feed',routes.feeds.getFeeds);
app.get('/api/feed/:id',routes.feeds.getFeed);
app.post('/api/feed',routes.feeds.saveFeed);
app.put('/api/feed/:id',routes.feeds.saveFeed);
app.delete('/api/feed/:id',routes.feeds.deleteFeed);
app.get('/api/feed/:id/report',routes.report.runReport);
app.get('*',function(req,res,next) {
  res.render('index',{
    'staticFilesURL': process.env.STATIC_FILES_URL || 'http://localhost:8081'
  });
});

module.exports = app;
