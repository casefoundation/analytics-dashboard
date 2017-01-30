const OAuth = require('oauth');
const config = require('../config.js');

let oauthClient;

config.on('ready',function() {
  oauthClient = new OAuth.OAuth2(
    config._.google.key,
    config._.google.secret,
    '',
    'https://accounts.google.com/o/oauth2/auth',
    'https://accounts.google.com/o/oauth2/token',
    null
  );
});

exports.startGoogleAuth = function(req,res,next) {
  const authURL = oauthClient.getAuthorizeUrl({
    'response_type': 'code',
    'redirect_uri': config._.rootURL + '/auth/googleanalytics/done',
    'scope': [
      'https://www.googleapis.com/auth/plus.login',
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
    var code = req.query.code;
    var now = new Date().getTime();
    oauthClient.getOAuthAccessToken(
      code,
      {
        'grant_type': 'authorization_code',
        'redirect_uri': config._.rootURL + '/auth/googleanalytics/done'
      },
      function(err, accessToken, refreshToken, params) {
        if (err) {
          next(err);
        } else {
          config._.google.accessToken = accessToken;
          config._.google.refreshToken = refreshToken;
          config._.google.expires = new Date(now + (params['expires_in'] * 1000));;
          res.redirect('/');
          config.commit();
        }
      }
    );
  } else {
    res.send(400);
  }
};
