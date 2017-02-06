const OAuth = require('oauth');
const settings = require('../settings.js');
const async = require('async');
const request = require('request');

const RootURL = process.env.ROOT_URL || 'http://localhost:8080';
const oauthClient = new OAuth.OAuth2(
  process.env.GOOGLE_KEY,
  process.env.GOOGLE_SECRET,
  '',
  'https://accounts.google.com/o/oauth2/auth',
  'https://accounts.google.com/o/oauth2/token',
  null
);

exports.refreshToken = function(req,res,next) {
  if (settings._.google && settings._.google.expires && settings._.google.refreshToken && new Date(settings._.google.expires).getTime() < new Date().getTime()) {
    console.log('Refreshing token');
    const now = new Date().getTime();
    oauthClient.getOAuthAccessToken(
      settings._.google.refreshToken,
      {
        'grant_type': 'refresh_token',
      },
      function(err,accessToken,refreshToken,params) {
        if (!settings._.google) {
          settings._.google = {};
        }
        if (err) {
          console.error(err);
        } else {
          console.log('New token set');
          settings._.google.accessToken = accessToken;
          settings._.google.expires = new Date(now + (params.expires_in * 1000)).getTime();
        }
        settings.commit();
        next();
      }
    );
  } else {
    next();
  }
}

exports.startGoogleAuth = function(req,res,next) {
  const authURL = oauthClient.getAuthorizeUrl({
    'response_type': 'code',
    'redirect_uri': RootURL + '/auth/googleanalytics/done',
    'scope': [
      // 'https://www.googleapis.com/auth/plus.login',
      'https://www.googleapis.com/auth/analytics.readonly'
    ].join(' '),
    'state': new Date().getTime()+'',
    'access_type': 'offline',
    'approval_prompt': 'force'
  });
  res.redirect(authURL);
};

exports.finishGoogleAuth = function(req,res,next) {
  if (req.query.state) {
    const code = req.query.code;
    const now = new Date().getTime();
    oauthClient.getOAuthAccessToken(
      code,
      {
        'grant_type': 'authorization_code',
        'redirect_uri': RootURL + '/auth/googleanalytics/done'
      },
      function(err, accessToken, refreshToken, params) {
        if (err) {
          next(err);
        } else {
          if (!settings._.google) {
            settings._.google = {};
          }
          settings._.google.accessToken = accessToken;
          settings._.google.refreshToken = refreshToken;
          settings._.google.expires = new Date(now + (params.expires_in * 1000)).getTime();
          res.redirect('/');
          settings.commit();
        }
      }
    );
  } else {
    res.send(400);
  }
};

exports.googleProfiles = function(req,res,next) {
  if (settings._.google.accessToken) {
    const gaRequest = function(path,done) {
      request.get({
        'uri': 'https://www.googleapis.com/analytics/v3/' + path,
        'json': true,
        'auth': {
          'bearer': settings._.google.accessToken
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
