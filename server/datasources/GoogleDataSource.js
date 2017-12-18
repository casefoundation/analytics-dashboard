const google = require('googleapis')
const url = require('url')
const DataSource = require('./DataSource')

class GoogleDataSource extends DataSource {
  constructor (config, secrets) {
    super(config, secrets)
    this.jwt = new google.auth.JWT(
      secrets.google.client_email,
      null,
      secrets.google.private_key,
      ['https://www.googleapis.com/auth/analytics.readonly'],
      null
    )
  }

  setup () {
    return new Promise((resolve, reject) => {
      if (process.env.NODE_ENV === 'test') {
        resolve()
      } else {
        this.jwt.authorize((err, tokens) => {
          if (err) {
            reject(err)
          } else {
            resolve()
          }
        })
      }
    })
  }

  formatDate (dateObj) {
    var prependZero = function (val) {
      if (val < 10) {
        return '0' + val
      } else {
        return val
      }
    }
    return [dateObj.getFullYear(), prependZero(dateObj.getMonth() + 1), prependZero(dateObj.getDate())].join('-')
  }

  getURLForHostnameAndPath (urls, hostname, path) {
    const submittedURL = url.parse('http://' + hostname + path)
    return urls.find(function (url) {
      return url.host === submittedURL.host && url.path === submittedURL.path && url.hash === submittedURL.hash
    })
  }
}

module.exports = GoogleDataSource
