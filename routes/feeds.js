const config = require('../config.js');
const uuid = require('node-uuid');

exports.getFeeds = function(req,res,next) {
  res.send(config._.feeds || []);
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
  if (!config._.feeds) {
    config._.feeds = [];
  }
  if (req.params && req.params.id) {
    const index = getFeedIndex(req.params.id);
    if (index >= 0) {
      config._.feeds[index] = req.body;
      config._.feeds[index].id = req.params.id;
      res.send(config._.feeds[index]);
      config.commit();
    } else {
      res.send(404);
    }
  } else {
    req.body.id = uuid.v1();
    config._.feeds.push(req.body);
    res.send(req.body);
    config.commit();
  }
}

exports.deleteFeed = function(req,res,next) {
  if (!config._.feeds) {
    config._.feeds = [];
  }
  if (req.params && req.params.id) {
    const index = getFeedIndex(req.params.id);
    if (index >= 0) {
      config._.feeds.splice(index,1);
      res.send({});
      config.commit();
    } else {
      res.send(404);
    }
  } else {
    res.send(400);
  }
}

function getFeed(id) {
  const index = getFeedIndex(req.params.id);
  if (index >= 0) {
    return config._.feeds[index];
  } else {
    return null;
  }
}

function getFeedIndex(id) {
  if (!config._.feeds) {
    config._.feeds = [];
  }
  return config._.feeds.findIndex(function(feed) {
    return feed.id === id;
  });
}
