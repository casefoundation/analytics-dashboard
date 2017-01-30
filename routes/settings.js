const config = require('../config');
const async = require('async');
const request = require('request');

exports.googleProfiles = function(req,res,next) {
  if (config._.google.accessToken) {
    const gaRequest = function(path,done) {
      request.get({
        'uri': 'https://www.googleapis.com/analytics/v3/' + path,
        'json': true,
        'auth': {
          'bearer': config._.google.accessToken
        }
      },done);
    }
    const handleResponse = function(next1) {
      return function(err,res,body) {
        if (err) {
          next1(err);
        } else if (body && body.items) {
          next1(null,body.items)
        } else if (body && body.error) {
          next1(new Error(body.error.message))
        } else {
          next1(new Error('Unexptected response from Google'));
        }
      }
    }
    async.parallel({
      'accounts': function(next1) {
        gaRequest('management/accounts',handleResponse(next1));
      },
      'properties': function(next1) {
        if (req.query.account) {
          gaRequest('management/accounts/' + req.query.account + '/webproperties',handleResponse(next1));
        } else {
          next1(null,[]);
        }
      },
      'profiles': function(next1) {
        if (req.query.account && req.query.property) {
          gaRequest('management/accounts/' + req.query.account + '/webproperties/' + req.query.property + '/profiles',handleResponse(next1));
        } else {
          next1(null,[]);
        }
      }
    },function(err,data) {
      if (err) {
        next(err);
      } else {
        res.send({
          'loggedIn': true,
          'data': data
        });
      }
    });
  } else {
    res.send({
      'loggedIn': false
    });
  }
};
