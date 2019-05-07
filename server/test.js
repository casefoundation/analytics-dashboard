/* global describe beforeEach it before */

process.env.NODE_ENV = 'test'

const chai = require('chai')
const chaiHttp = require('chai-http')
const server = require('./server')
const FeedBenchmarks = require('./datasources/FeedBenchmarks')
const FeedTable = require('./datasources/FeedTable')
const GoogleAnalytics = require('./datasources/GoogleAnalytics')
const assert = require('assert')
const _ = require('lodash')
const url = require('url')
const secrets = require('./test/config/secrets')
const fs = require('fs-extra')
const JSONEncrypter = require('./lib/JSONEncrypter')

chai.should()
chai.use(chaiHttp)

const fixFeed = (feed) => {
  feed.forEach((feedItem) => {
    feedItem.pubdate = new Date(Date.parse(feedItem.pubdate))
    feedItem.pubDate = new Date(Date.parse(feedItem.pubDate))
  })
}

const fixUrls = (urls) => {
  return urls.map((urlStr) => {
    return url.parse(urlStr.href || urlStr)
  })
}

describe('Web API', () => {
  let api = null

  beforeEach(() => {
    return server()
      .then((_api) => {
        api = _api
      })
  })

  it('GET /api/dashboard', (done) => {
    chai.request(api)
      .get('/api/dashboard')
      .end((err, res) => {
        if (err) {
          done(err)
        } else {
          res.should.have.status(200)
          res.body.should.be.a('array')
          res.body.length.should.be.eql(1)
          res.body[0].should.be.a('object')
          res.body[0].name.should.be.eql('default')
          res.body[0].label.should.be.eql('Home')
          done()
        }
      })
  })

  it('GET /api/default/datasource', (done) => {
    chai.request(api)
      .get('/api/default/datasource')
      .end((err, res) => {
        if (err) {
          done(err)
        } else {
          res.should.have.status(200)
          res.body.should.be.a('array')
          res.body.length.should.be.eql(2)
          res.body[0].should.be.eql('googleanalytics')
          res.body[1].should.be.eql('mailchimpstats')
          done()
        }
      })
  })
})

describe('Datasources', () => {
  describe('FeedBenchmarks', () => {
    const config = require('./test/config/feedbenchmarks')
    const ds = new FeedBenchmarks(config, secrets)
    let data

    before(() => {
      return fs.readFile('./test/data/FeedBenchmarks.data')
        .then((encrypted) => {
          return new JSONEncrypter().decrypt(encrypted)
        })
        .then((_data) => {
          data = _data
        })
    })

    it('getGoogleRequestMetricsDimensions', () => {
      const response = ds.getGoogleRequestMetricsDimensions()
      assert.equal(response.length, 1)
    })

    it('generateWidgets', () => {
      const widgets = ds.generateWidgets([], [])
      assert.equal(widgets.length, 1)
    })

    it('getDateBounds', () => {
      fixFeed(data.getDateBounds.feed)
      const bounds = ds.getDateBounds(data.getDateBounds.feed)
      assert.equal(bounds.start.toISOString(), data.getDateBounds.dates.start)
      assert.equal(bounds.end.toISOString(), data.getDateBounds.dates.end)
    })

    it('filterReportFeed', () => {
      const filtered = ds.filterReportFeed(data.filterReportFeed.feed)
      assert.equal(filtered.length, data.filterReportFeed.filtered.length)
      for (var i = 0; i < filtered.length; i++) {
        assert.equal(JSON.stringify(filtered[i]), JSON.stringify(data.filterReportFeed.filtered[i]))
      }
    })

    // it('processGoogleResponseBodies', () => {
    //   fixFeed(data.processGoogleResponseBodies.feed)
    //   const urls = fixUrls(data.processGoogleResponseBodies.urls)
    //   const consolidatedReport = ds.processGoogleResponseBodies(data.processGoogleResponseBodies.feed, urls, data.processGoogleResponseBodies.responseBodies)
    //   _.keys(data.processGoogleResponseBodies.consolidatedReport).forEach((url) => {
    //     assert(consolidatedReport[url])
    //     _.keys(data.processGoogleResponseBodies.consolidatedReport[url]).forEach((date) => {
    //       assert(consolidatedReport[url][date])
    //       assert(consolidatedReport[url][date].date)
    //       assert(consolidatedReport[url][date].metrics)
    //       assert.equal(consolidatedReport[url][date].date.toISOString(), data.processGoogleResponseBodies.consolidatedReport[url][date].date)
    //       _.keys(data.processGoogleResponseBodies.consolidatedReport[url][date].metrics).forEach((metric) => {
    //         assert.equal(consolidatedReport[url][date].metrics[metric], data.processGoogleResponseBodies.consolidatedReport[url][date].metrics[metric])
    //       })
    //     })
    //   })
    // })
  })

  describe('FeedTable', () => {
    const config = require('./test/config/feedtable')
    const ds = new FeedTable(config, secrets)
    let data

    before(() => {
      return fs.readFile('./test/data/FeedTable.data')
        .then((encrypted) => {
          return new JSONEncrypter().decrypt(encrypted)
        })
        .then((_data) => {
          data = _data
        })
    })

    it('getGoogleRequestMetricsDimensions', () => {
      const array = ds.getGoogleRequestMetricsDimensions()
      assert.equal(array.length, 2)
    })

    it('getGoogleRequestDimensionFilterClauses', () => {
      const populatedArray = ds.getGoogleRequestDimensionFilterClauses(1)
      assert.equal(populatedArray.length, 1)

      const unPpulatedArray = ds.getGoogleRequestDimensionFilterClauses(0)
      assert.equal(unPpulatedArray.length, 0)
    })

    it('generateWidgets', () => {
      const report = []
      const widgets = ds.generateWidgets(null, report)
      assert.equal(widgets.length, 1)
      assert.equal(widgets[0].data, report)
    })

    it('getDateBounds', () => {
      const a = new Date()
      const b = new Date(Date.now() + (Math.random() * 1000))
      const bounds = ds.getDateBounds(null, a, b)
      assert.equal(bounds.start, a)
      assert.equal(bounds.end, b)
    })

    it('filterReportFeed', () => {
      fixFeed(data.filterReportFeed.feed)
      const startDate = new Date(Date.parse(data.filterReportFeed.startDate))
      const endDate = new Date(Date.parse(data.filterReportFeed.endDate))
      const filtered = ds.filterReportFeed(data.filterReportFeed.feed, startDate, endDate)
      assert.equal(filtered.length, data.filterReportFeed.filtered.length)
      for (var i = 0; i < filtered.length; i++) {
        assert.equal(JSON.stringify(filtered[i]), JSON.stringify(data.filterReportFeed.filtered[i]))
      }
    })

    it('processGoogleResponseBodies', () => {
      fixFeed(data.processGoogleResponseBodies.feed)
      const urls = fixUrls(data.processGoogleResponseBodies.urls)
      const reportArray = ds.processGoogleResponseBodies(data.processGoogleResponseBodies.feed, urls, data.processGoogleResponseBodies.responseBodies)
      assert.equal(reportArray.length, data.processGoogleResponseBodies.reportArray.length)
      data.processGoogleResponseBodies.reportArray.forEach((reportRow, i) => {
        assert.equal(reportRow['URL'], reportArray[i]['URL'])
        assert.equal(reportRow['Name'], reportArray[i]['Name'])
        assert.equal(reportRow['Views'], reportArray[i]['Views'])
        assert.equal(reportRow['Unique Views'], reportArray[i]['Unique Views'])
        assert.equal(reportRow['Average Time on Page (Seconds)'], reportArray[i]['Average Time on Page (Seconds)'])
        assert.equal(reportRow['Average Scroll Depth'], reportArray[i]['Average Scroll Depth'])
      })
    })
  })

  describe('GoogleAnalytics', () => {
    const config = require('./test/config/googleanalytics')
    const ds = new GoogleAnalytics(config, secrets)

    it('buildRequests', () => {
      const specificData = require('./test/data/GoogleAnalytics_buildRequests.json')
      const startDate = new Date(Date.parse(specificData.startDate))
      const endDate = new Date(Date.parse(specificData.endDate))
      const {reportTypes, reportRequests} = ds.buildRequests(startDate, endDate)
      assert.equal(reportTypes.length, specificData.reportTypes.length)
      assert.equal(reportRequests.length, specificData.reportRequests.length)
      specificData.reportTypes.forEach((reportType, i) => {
        assert.equal(reportType, reportTypes[i])
      })
      specificData.reportRequests.forEach((reportRequest, i) => {
        assert.equal(JSON.stringify(reportRequest), JSON.stringify(reportRequests[i]))
      })
    })

    it('parseEventReport', () => {
      const report = ds.parseEventReport({
        'data': {
          'rows': [
            {
              'metrics': [
                {
                  'values': [1]
                }
              ]
            }
          ]
        }
      }, 0)
      assert(report.Name, config.elements.events[0].name)
      assert(report.helptext, config.elements.events[0].helptext)
      assert(report['Total Events'], 1)
    })

    it('parsePagesReport', () => {
      const report = ds.parsePagesReport({
        'data': {
          'rows': [
            {
              'metrics': [
                {
                  'values': [1, 1, 1]
                }
              ]
            }
          ]
        }
      }, 0)
      assert.equal(report.Name, config.elements.pages[0].name)
      assert.equal(report.URL, config.elements.pages[0].url)
      assert.equal(report['Views'], 1)
      assert.equal(report['Unique Views'], 1)
      assert.equal(report['Average Time on Page (seconds)'], 1)
    })

    it('parseGoalsReport', () => {
      const report = ds.parseGoalsReport({
        'data': {
          'totals': [
            {
              'values': [1]
            }
          ]
        }
      }, 0)
      assert.equal(report.Name, config.elements.goals[0].name)
      assert.equal(report.helptext, config.elements.goals[0].helptext)
      assert.equal(report['Conversion Rate'], '1%')
    })

    it('parseTopPagesReport', () => {
      const report = ds.parseTopPagesReport({
        'data': {
          'rows': [
            {
              'dimensions': [
                'test.com',
                '/test',
                'test'
              ],
              'metrics': [
                {
                  'values': [1]
                }
              ]
            }
          ]
        }
      }, 0)
      assert.equal(report.length, 1)
      assert.equal(report[0].Name, 'test')
      assert.equal(report[0].URL, 'http://test.com/test')
      assert.equal(report[0].Views, 1)
    })

    it('parseReferralsReport', () => {
      const report = ds.parseReferralsReport({
        'data': {
          'rows': [
            {
              'dimensions': [
                'test'
              ],
              'metrics': [
                {
                  'values': [1]
                }
              ]
            }
          ]
        }
      }, 0)
      assert.equal(report.length, 1)
      assert.equal(report[0].Referrer, 'test')
      assert.equal(report[0].Views, 1)
    })

    it('parseOverallMetricsReport', () => {
      const report = ds.parseOverallMetricsReport({
        'data': {
          'totals': [
            {
              'values': [1, 1, 1, 1]
            }
          ]
        }
      }, 0)
      assert.equal(report['Views'].value, 1)
      assert.equal(report['Unique Views'].value, 1)
      assert.equal(report['Average Time on Page'].value, 1)
      assert.equal(report['New Users'].value, '1%')
    })

    it('parseTopDimensionsReport', () => {
      const report = ds.parseTopDimensionsReport({
        'data': {
          'rows': [
            {
              'dimensions': [
                'test'
              ],
              'metrics': [
                {
                  'values': [1, 1, 1]
                }
              ]
            }
          ]
        }
      }, 0)
      assert.equal(report.length, 1)
      assert.equal(report[0].Name, 'test')
      assert.equal(report[0].Views, 1)
      assert.equal(report[0]['Unique Views'], 1)
      assert.equal(report[0]['Average Time on Page (seconds)'], 1)
    })
  })
})
