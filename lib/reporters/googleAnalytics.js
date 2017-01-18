const request = require('request');
const OAuth = require('oauth');

module.exports = {
  'name': 'Google Analytics',
  'authPath': '/auth/googleanalytics',
  'isAuthorized': function(config,done) {
    done(null,(config._.googleAnalytics.accessToken && config._.googleAnalytics.profile));
  },
  'prepare': function(config,app,done) {
    const oauthClient = new OAuth.OAuth2(
      this.config._.google.key,
      this.config._.google.secret,
      '',
      'https://accounts.google.com/o/oauth2/auth',
      'https://accounts.google.com/o/oauth2/token',
      null
    );

    app.get('/auth/googleanalytics',function(req,res,next) {
      oauthClient.getAuthorizeUrl({
        'response_type': 'code',
        'redirect_uri': googleCallback,
        'scope': [
          'https://www.googleapis.com/auth/plus.login',
          'https://www.googleapis.com/auth/analytics.readonly'
        ].join(' '),
        'state': new Date().getTime()+'',
        'access_type': 'offline',
        'approval_prompt': 'force'
      });
      res.redirect(authURL);
    });

    app.get('/auth/googleanalytics/done',function(req,res,next) {
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
              config._.googleAnalytics.accessToken = accessToken;
              config._.googleAnalytics.refreshToken = refreshToken;
              config._.googleAnalytics.expires = new Date(now + (params['expires_in'] * 1000));;
              res.redirect('/');
            }
          }
        );
      } else {
        res.send(400);
      }
    });

    done();
  },
  'runReport': function(config,urls,startDate,endDate,done) {
    const reportRequests = [
      {
        'metrics': ['ga:sessions','ga:hits','ga:hits'],
        'dimensions': ['ga:hostname','ga:pagePath'],
        'dimensionFilterClauses': []
      },
      {
        'metrics': ['ga:sessions','ga:hits','ga:hits'],
        'dimensions': ['ga:hostname','ga:pagePath','ga:socialNetwork'],
        'dimensionFilterClauses': []
      }
    ].map(function(request) {
      return {
        'metrics': request.metrics,
        'dimensions': request.dimensions,
        'viewId': 'ga:' + config._.googleAnalytics.profile,
        'dateRanges': {
          'startDate': formatDate(startDate),
          'endDate': formatDate(endDate),
        },
        'samplingLevel': 'LARGE',
        'dimensionFilterClauses': request.dimensionFilterClauses.concat({
          'dimensionName': 'ga:pagePath',
          'operator': 'EXACT',
          'expressions': urls.map(function(url) {
            return url.path;
          })
        }),
        'pageSize': 10000,
        'includeEmptyRows': true,
        'hideTotals': true,
        'hideValueRanges': true
      };
    });
    request({
      'uri': 'https://analyticsreporting.googleapis.com/v4/reports:batchGet',
      'body': {
        'reportRequests': reportRequests
      }
      'json': true,
      'auth': {
        'bearer': config._.googleAnalytics.accessToken
      }
    },function(err,res,body) {
      if (err) {
        done(err);
      } else if (body.rows) {
        done(null,body.rows.map(function(row) {
          return {
            'url': _this.getURLForHostnameAndPath(urls,row[0],row[1]),
            'metrics': {
              'hits': parseInt(row[2]),
              'avgTimeOnPage': parseFloat(row[3])
            }
          };
        }));
      } else {
        done(null,[]);
      }
    });
  }
};

function formatDate(dateObj) {
  var prependZero = function(val) {
    if (val < 10) {
      return '0' + val;
    } else {
      return val;
    }
  }
  return [dateObj.getFullYear(),prependZero(dateObj.getMonth()+1),prependZero(dateObj.getDate())].join('-');
}

function getURLForHostnameAndPath(urls,hostname,path) {
  return urls.find(function(url) {
    return url.host == hostname && url.path == path;
  })
}
