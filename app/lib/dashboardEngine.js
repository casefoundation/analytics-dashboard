const async = require('async');
const dashboardEngines = require('./dashboardEngines');

exports.runReport = function(settings,dashboard,done) {
  const engines = [];
  for(var engineName in dashboardEngines) {
    engines.push(function(next) {
      dashboardEngines[engineName].run(settings,dashboard,next);
    });
  }
  async.parallel(engines,function(err,results) {
    if (err) {
      done(err);
    } else if (results && results.length == 1) {
      done(null,results[0]);
    } else {
      //TODO
    }
  })
}
