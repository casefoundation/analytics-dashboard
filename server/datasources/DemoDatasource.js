const DataSource = require('./DataSource')
const demoData = require('./DemoData')

class DemoDataSource extends DataSource {
  query (startDate, endDate) {
    return Promise.resolve(demoData)
  }
}

module.exports = DemoDataSource
