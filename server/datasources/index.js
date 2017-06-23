[
  'GoogleAnalytics',
  'FeedBenchmarks',
  'MailchimpStats'
].forEach((className) => {
  module.exports[className] = require('./' + className);
});
