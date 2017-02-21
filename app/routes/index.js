['google','feeds','dashboard'].forEach(function(moduleName) {
  module.exports[moduleName] = require('./' + moduleName);
})
