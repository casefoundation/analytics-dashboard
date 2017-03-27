['googleAnalyticsBenchmarks'].forEach(function(moduleName) {
  module.exports[moduleName] = require('./' + moduleName);
})
