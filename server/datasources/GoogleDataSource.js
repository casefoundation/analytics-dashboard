const google = require('googleapis');
const url = require('url');

class GoogleDataSource {
  constructor(config) {
    this.config = config;
    this.jwt = new google.auth.JWT(
      config.auth.client_email,
      null,
      config.auth.private_key,
      ['https://www.googleapis.com/auth/analytics.readonly'],
      null
    );
  }

  setup() {
    return new Promise((resolve,reject) => {
      this.jwt.authorize((err,tokens) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      })
    });
  }

  formatDate(dateObj) {
    var prependZero = function(val) {
      if (val < 10) {
        return '0' + val;
      } else {
        return val;
      }
    }
    return [dateObj.getFullYear(),prependZero(dateObj.getMonth()+1),prependZero(dateObj.getDate())].join('-');
  }

  getURLForHostnameAndPath(urls,hostname,path) {
    const submittedURL = url.parse('http://' + hostname + path);
    return urls.find(function(url) {
      return url.host == submittedURL.host && url.pathname == submittedURL.pathname;
    })
  }
}

module.exports = GoogleDataSource;
