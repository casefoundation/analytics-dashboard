const OAuth = require('oauth');
const settings = require('../settings.js');

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
  if (settings._.google && settings._.google.expires && settings._.google.refreshToken && Date.parse(settings._.google.expires) < new Date().getTime()) {
    console.log('Refreshing token');
    const now = new Date().getTime();
    oauthClient.getOAuthAccessToken(
      settings._.google.refreshToken,
      {
        'grant_type': 'refresh_token'
      },
      function(err,accessToken,refreshToken,params) {
        if (err) {
          console.error(err);
          settings._.google.accessToken = null;
          settings._.google.refreshToken = null;
          settings._.google.expires = null;
        } else {
          settings._.google.accessToken = accessToken;
          settings._.google.refreshToken = refreshToken;
          settings._.google.expires = new Date(now + (params['expires_in'] * 1000));
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
          settings._.google.accessToken = accessToken;
          settings._.google.refreshToken = refreshToken;
          settings._.google.expires = new Date(now + (params['expires_in'] * 1000));
          res.redirect('/');
          settings.commit();
        }
      }
    );
  } else {
    res.send(400);
  }
};
