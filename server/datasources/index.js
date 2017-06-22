[
  'GoogleAnalytics',
  'FeedBenchmarks'
].forEach((className) => {
  module.exports[className] = require('./' + className);
});
