[
  'GoogleAnalytics',
  'FeedBenchmarks',
  'MailchimpStats',
  'FeedTable'
].forEach((className) => {
  module.exports[className] = require('./' + className);
});
