const express = require('express');
const bodyParser = require('body-parser');
const routes = require('./routes');

const app = express();
app.use(routes.google.refreshToken);
app.use(bodyParser.json());

app.get('/auth/googleanalytics',routes.google.startGoogleAuth);
app.get('/auth/googleanalytics/done',routes.google.finishGoogleAuth);
app.get('/auth/googleaprofiles',routes.google.googleProfiles);
app.get('/api/feed',routes.feeds.getFeeds);
app.get('/api/feed/:id',routes.feeds.getFeed);
app.post('/api/feed',routes.feeds.saveFeed);
app.put('/api/feed/:id',routes.feeds.saveFeed);
app.delete('/api/feed/:id',routes.feeds.deleteFeed);
app.get('/api/feed/:id/report',routes.report.runReport);

module.exports = app;
