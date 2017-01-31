const settings = require('../settings.js');
const uuid = require('node-uuid');

exports.getFeeds = function(req,res,next) {
  res.send(settings._.feeds || []);
}

exports.getFeed = function(req,res,next) {
  if (req.params.id) {
    const feed = getFeed(req.params.id);
    if (feed) {
      res.send(feed);
    } else {
      res.send(404);
    }
  } else {
    res.send(404);
  }
}

exports.saveFeed = function(req,res,next) {
  //TODO JOI verification
  if (!settings._.feeds) {
    settings._.feeds = [];
  }
  if (req.params && req.params.id) {
    const index = getFeedIndex(req.params.id);
    if (index >= 0) {
      settings._.feeds[index] = req.body;
      settings._.feeds[index].id = req.params.id;
      res.send(settings._.feeds[index]);
      settings.commit();
    } else {
      res.send(404);
    }
  } else {
    req.body.id = uuid.v1();
    settings._.feeds.push(req.body);
    res.send(req.body);
    settings.commit();
  }
}

exports.deleteFeed = function(req,res,next) {
  if (!settings._.feeds) {
    settings._.feeds = [];
  }
  if (req.params && req.params.id) {
    const index = getFeedIndex(req.params.id);
    if (index >= 0) {
      settings._.feeds.splice(index,1);
      res.send({});
      settings.commit();
    } else {
      res.send(404);
    }
  } else {
    res.send(400);
  }
}

function getFeed(id) {
  const index = getFeedIndex(id);
  if (index >= 0) {
    return settings._.feeds[index];
  } else {
    return null;
  }
}

function getFeedIndex(id) {
  if (!settings._.feeds) {
    settings._.feeds = [];
  }
  return settings._.feeds.findIndex(function(feed) {
    return feed.id === id;
  });
}
