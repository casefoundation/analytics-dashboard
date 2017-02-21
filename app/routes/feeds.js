const settings = require('remote-settings');
const reporter = require('../lib/reporter');
const uuid = require('node-uuid');
const Joi = require('joi');

const schema = Joi.object().keys({
  'name': Joi.string().required(),
  'url': Joi.string().uri().required(),
  'nPosts': Joi.number().default(5),
  'nDays': Joi.number().default(5),
  'googleAccount': {
    'account': Joi.string().default(''),
    'property': Joi.string().default(''),
    'profile': Joi.string().default('')
  },
  'id': Joi.string().optional()
})

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
  Joi.validate(req.body,schema,function(err,object) {
    if (!object.googleAccount) {
      object.googleAccount = {};
    }
    if (err) {
      next(err);
    } else {
      if (!settings._.feeds) {
        settings._.feeds = [];
      }
      if (req.params && req.params.id) {
        const index = getFeedIndex(req.params.id);
        if (index >= 0) {
          settings._.feeds[index] = object;
          settings._.feeds[index].id = req.params.id;
          res.send(settings._.feeds[index]);
          settings.commit();
        } else {
          res.send(404);
        }
      } else {
        object.id = uuid.v1();
        settings._.feeds.push(object);
        res.send(object);
        settings.commit();
      }
    }
  })
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

exports.runFeedReport = function(req,res,next) {
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
