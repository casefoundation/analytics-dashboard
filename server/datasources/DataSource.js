const fs = require('fs-extra')
const path = require('path')
const JSONEncrypter = require('../lib/JSONEncrypter')

class DataSource {
  constructor (config, secrets) {
    this.config = config
    this.secrets = secrets
    this.testData = {}
  }

  setup () {
    return Promise.resolve()
  }

  query (startDate, endDate) {
    throw new Error('Must override!')
  }

  writeTestData () {
    const savePath = path.join('./test/data', this.constructor.name + '.data')
    return new JSONEncrypter().encrypt(this.testData)
      .then((encrypted) => {
        return fs.writeFile(savePath, encrypted)
      })
  }
}

module.exports = DataSource
