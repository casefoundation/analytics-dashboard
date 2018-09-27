[
  'GoogleAnalytics',
  'FeedBenchmarks',
  'MailchimpStats',
  'FeedTable',
  'DemoDatasource'
].forEach((className) => {
  module.exports[className] = require('./' + className)
})
