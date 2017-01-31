const async = require('async');
const app = require('../index');
const settings = require('../settings.js');
const reporters = require('../lib/reporters');
const reporter = require('../lib/reporter');
const logger = require('morgan');

app.use(logger('combined'));

async.waterfall([
  function(next) {
    settings.init('./settings.json',{},next);
  },
  function(next) {
    const reportersArray = [];
    for(const reporterName in reporters) {
      reportersArray.push(reporters[reporterName]);
    }
    async.parallel(
      reportersArray.map(function(reporter) {
        return function(next1) {
          reporter.init(settings,app,next1);
        }
      }),
      function(err) {
        next(err);
      }
    );
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
