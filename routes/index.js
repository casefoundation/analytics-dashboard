['google','feeds','report'].forEach(function(moduleName) {
  module.exports[moduleName] = require('./' + moduleName);
})
