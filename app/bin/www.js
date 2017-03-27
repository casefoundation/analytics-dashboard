const async = require('async');
const app = require('../index');
const settings = require('remote-settings');

async.waterfall([
  function(next) {
    const params = {};
    if (process.env.AMAZON_ACCESS_KEY && process.env.AMAZON_SECRET_ACCESS_KEY && process.env.AMAZON_REGION && process.env.AMAZON_BUCKET && process.env.AMAZON_KEY) {
      params.s3 = {
        'config': {
          'credentials': {
            "accessKeyId": process.env.AMAZON_ACCESS_KEY,
            "secretAccessKey": process.env.AMAZON_SECRET_ACCESS_KEY
          },
          'region': process.env.AMAZON_REGION
        },
        'bucket': process.env.AMAZON_BUCKET,
        'key': process.env.AMAZON_KEY,
      };
    } else {
      params.file = process.env.SETTINGS_FILE || './settings.json';
    }
    settings.init(params,next);
  },
  function(next) {
    app.listen(process.env.PORT || 8080,next);
  }
],function(err) {
  if (err) {
    console.error(err);
  } else {
    console.log('Running');
  }
});
