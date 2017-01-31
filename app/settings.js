const fs = require('fs');
const merge = require('merge');
const events = require('events');

module.exports = new events.EventEmitter();

module.exports._ = null;

module.exports.settings = {};

module.exports.init = function(file,defaults,done) {
  module.exports.settings.file = file || './settings.json';
  module.exports.settings.defaults = defaults || {};
  fs.exists(module.exports.settings.file,function(exists) {
    if (exists) {
      fs.readFile(module.exports.settings.file,'utf-8',function(err,data) {
        if (err) {
          done && done(err);
        } else {
          module.exports._ = merge.recursive(true,defaults,JSON.parse(data));
          done && done();
          module.exports.emit('ready');
        }
      });
    } else {
      module.exports._ = defaults;
      done && done();
      module.exports.emit('ready');
    }
  })
}

module.exports.commit = function(done) {
  fs.writeFile(module.exports.settings.file,JSON.stringify(module.exports._,null,'  '),function(err) {
    done && done();
  });
}
