const assert = require('assert');
const feedEngine = require('./lib/feedEngine');
const server = require('./index');
const settings = require('remote-settings');
const async = require('async');
const chai = require('chai');
const should = chai.should();
const chaiHttp = require('chai-http');
const randomstring = require('randomstring');

chai.use(chaiHttp);

describe('Analytics Dashboard',function() {

  describe('Reporter Functions',function() {

    describe('formatDate',function() {
      it('Formats dates under 10',function() {
        const date = new Date(2017,0,30);
        const formattedDate = feedEngine.testable.formatDate(date);
        assert.equal(formattedDate,'2017-01-30T00:00:00.000Z');
      });
      it('Formats dates over 10',function() {
        const date = new Date(2017,9,30);
        const formattedDate = feedEngine.testable.formatDate(date);
        assert.equal(formattedDate,'2017-10-30T00:00:00.000Z');
      });
    });

    describe('parseReport',function() {
      it('Properly computes benchmarks',function(done) {
        const testData = require('./testData');
        testData.feed.forEach(function(item) {
          item.pubdate = new Date(Date.parse(item.pubdate));
        });
        const days = 30;
        const posts = 25;
        feedEngine.testable.parseReport(posts,days,testData.feed,testData.report,function(err,report) {
          assert(!err);
          assert.equal(posts,report.length);
          report.forEach(function(reportRow,i) {
            const counterpartRow = testData.finalReport[i];
            assert.equal(reportRow.url,counterpartRow.url);
            assert.equal(reportRow.startDate.getTime(),Date.parse(counterpartRow.startDate));
            ['averages','scores'].forEach(function(statType) {
              for(const metric in reportRow[statType].daily) {
                assert.equal(days,reportRow[statType].daily[metric].length);
                assert.equal(reportRow[statType].daily[metric].length,counterpartRow[statType].daily[metric].length);
                reportRow[statType].daily[metric].forEach(function(stat,j) {
                  const counterpartStat = counterpartRow[statType].daily[metric][j];
                  assert.strictEqual(stat,counterpartStat);
                });
              }
              for(const metric in reportRow[statType].cumulative) {
                assert.equal(reportRow[statType].cumulative[metric],counterpartRow[statType].cumulative[metric]);
              }
            });
            for(const metric in reportRow.actuals) {
              assert.equal(days,reportRow.actuals[metric].length);
              assert.equal(reportRow.actuals[metric].length,counterpartRow.actuals[metric].length);
              reportRow.actuals[metric].forEach(function(stat,j) {
                const counterpartStat = counterpartRow.actuals[metric][j];
                assert.strictEqual(stat,counterpartStat);
              });
            }
          });
          done();
        });
      });
    });

    describe('getDateBounds',function() {
      it('Finds the upper and lower date bounds',function() {
        const feed = [
          {
            'pubdate': new Date(2017,9,1)
          },
          {
            'pubdate': new Date(2017,3,15)
          },
          {
            'pubdate': new Date(2016,11,20)
          },
          {
            'pubdate': new Date(2017,2,1)
          }
        ];
        const bounds = feedEngine.testable.getDateBounds(feed);
        assert.equal(bounds.start.getTime(),feed[2].pubdate.getTime());
        assert.equal(bounds.end.getTime(),feed[0].pubdate.getTime());
      });
    });

    describe('filterReportFeed',function() {
      it('Properly trims the array',function(done) {
        const feed = [0,1,2,3,4,5];
        const trim = 3;
        feedEngine.testable.filterReportFeed(feed,trim,function(err,trimmedFeed) {
          assert.equal(trimmedFeed.length,trim);
          done();
        });
      });
      it('Throws an error for a short array',function(done) {
        const feed = [0,1,2,3,4,5];
        const trim = 10;
        feedEngine.testable.filterReportFeed(feed,trim,function(err,trimmedFeed) {
          assert(err);
          assert(!trimmedFeed);
          done();
        });
      });
    });

    describe('convertFeedToUrls',function() {
      it('Generates an array of URL objects',function() {
        const feed = [
          {
            'link': 'http://casefoundation.org/'
          },
          {
            'link': 'https://twitter.com/casefoundation'
          }
        ];
        const urls = feedEngine.testable.convertFeedToUrls(feed);
        assert.equal(feed.length,urls.length);
        urls.forEach(function(url,i) {
          assert.equal(url.href,feed[i].link);
        });
      });
    });

    describe('sortFeed',function() {
      it('Sorts the feed descending',function() {
        const date1 = new Date(2017,9,1);
        const date2 = new Date(2017,3,15);
        const date3 = new Date(2017,2,1);
        const date4 = new Date(2016,11,20);
        const sortedFeed = [
          {
            'pubdate': date1
          },
          {
            'pubdate': date2
          },
          {
            'pubdate': date3
          },
          {
            'pubdate': date4
          }
        ]
        const feed = [
          {
            'pubdate': date4
          },
          {
            'pubdate': date2
          },
          {
            'pubdate': date3
          },
          {
            'pubdate': date1
          }
        ];
        feedEngine.testable.sortFeed(feed);
        feed.forEach(function(item,i) {
          assert.equal(item.pubdate.getTime(),sortedFeed[i].pubdate.getTime());
        });
      });
    });

  });

  describe('Feed API',function() {
    beforeEach(function(done) {
      async.waterfall([
        function(next) {
          const params = {
            'file': './settings.test.json'
          };
          settings.init(params,next);
        },
        function(next) {
          settings.commit(next);
        }
      ],done);
    });

    afterEach(function(done) {
      settings._ = {};
      settings.commit(done);
    })

    it('GET /api/feed',function(done) {
      settings._.feeds = [
        {
          "name": randomstring.generate(),
          "url": "http://example.com/feed/",
          "nPosts": randomNumber(),
          "nDays": randomNumber(),
          "googleAccount": {
            "account": randomstring.generate(),
            "property": randomstring.generate(),
            "profile": randomstring.generate()
          },
          "id": randomstring.generate()
        }
      ];
      chai.request(server)
        .get('/api/feed')
        .end(function(err,res) {
          if (err) {
            done(err);
          } else {
            res.should.have.status(200);
            res.body.should.have.lengthOf(settings._.feeds.length);
            res.body.should.be.a('array');
            res.body[0].should.be.a('object');
            ['name','url','nPosts','nDays','id'].forEach(function(prop) {
              res.body[0].should.have.property(prop);
              res.body[0][prop].should.equal(settings._.feeds[0][prop]);
            });
            res.body[0].googleAccount.should.be.a('object');
            ['account','property','profile'].forEach(function(prop) {
              res.body[0].googleAccount.should.have.property(prop);
              res.body[0].googleAccount[prop].should.equal(settings._.feeds[0].googleAccount[prop]);
            });
            done();
          }
        });
    });

    it('GET /api/feed/:id',function(done) {
      settings._.feeds = [
        {
          "name": randomstring.generate(),
          "url": "http://example.com/feed/",
          "nPosts": randomNumber(),
          "nDays": randomNumber(),
          "googleAccount": {
            "account": randomstring.generate(),
            "property": randomstring.generate(),
            "profile": randomstring.generate()
          },
          "id": randomstring.generate()
        }
      ];
      chai.request(server)
        .get('/api/feed/' + settings._.feeds[0].id)
        .end(function(err,res) {
          if (err) {
            done(err);
          } else {
            res.should.have.status(200);
            res.body.should.be.a('object');
            ['name','url','nPosts','nDays','id'].forEach(function(prop) {
              res.body.should.have.property(prop);
              res.body[prop].should.equal(settings._.feeds[0][prop]);
            });
            res.body.googleAccount.should.be.a('object');
            ['account','property','profile'].forEach(function(prop) {
              res.body.googleAccount.should.have.property(prop);
              res.body.googleAccount[prop].should.equal(settings._.feeds[0].googleAccount[prop]);
            });
            done();
          }
        });
    });

    it('POST /api/feed',function(done) {
      const item = {
        "name": randomstring.generate(),
        "url": "http://example.com/feed/",
        "nPosts": randomNumber(),
        "nDays": randomNumber(),
        "googleAccount": {
          "account": randomstring.generate(),
          "property": randomstring.generate(),
          "profile": randomstring.generate()
        }
      };
      chai.request(server)
        .post('/api/feed')
        .send(item)
        .end(function(err,res) {
          if (err) {
            done(err);
          } else {
            assert.equal(settings._.feeds.length,1);
            res.should.have.status(200);
            res.body.should.be.a('object');
            res.body.should.have.property('id');
            ['name','url','nPosts','nDays'].forEach(function(prop) {
              res.body.should.have.property(prop);
              res.body[prop].should.equal(item[prop]);
            });
            res.body.googleAccount.should.be.a('object');
            ['account','property','profile'].forEach(function(prop) {
              res.body.googleAccount.should.have.property(prop);
              res.body.googleAccount[prop].should.equal(item.googleAccount[prop]);
            });
            done();
          }
        });
    });

    it('PUT /api/feed/:id',function(done) {
      settings._.feeds = [
        {
          "name": randomstring.generate(),
          "url": "http://example.com/feed/",
          "nPosts": randomNumber(),
          "nDays": randomNumber(),
          "googleAccount": {
            "account": randomstring.generate(),
            "property": randomstring.generate(),
            "profile": randomstring.generate()
          },
          "id": randomstring.generate()
        }
      ];
      const item = {
        "name": randomstring.generate(),
        "url": "http://example.com/feed/",
        "nPosts": randomNumber(),
        "nDays": randomNumber(),
        "googleAccount": {
          "account": randomstring.generate(),
          "property": randomstring.generate(),
          "profile": randomstring.generate()
        },
        "id": settings._.feeds[0].id
      }
      chai.request(server)
        .put('/api/feed/' + settings._.feeds[0].id)
        .send(item)
        .end(function(err,res) {
          if (err) {
            done(err);
          } else {
            assert.equal(settings._.feeds.length,1);
            res.should.have.status(200);
            res.body.should.be.a('object');
            res.body.should.have.property('id');
            ['name','url','nPosts','nDays','id'].forEach(function(prop) {
              res.body.should.have.property(prop);
              res.body[prop].should.equal(item[prop]);
            });
            res.body.googleAccount.should.be.a('object');
            ['account','property','profile'].forEach(function(prop) {
              res.body.googleAccount.should.have.property(prop);
              res.body.googleAccount[prop].should.equal(item.googleAccount[prop]);
            });
            done();
          }
        });
    });

    it('DELETE /api/feed/:id',function(done) {
      settings._.feeds = [
        {
          "name": randomstring.generate(),
          "url": "http://example.com/feed/",
          "nPosts": randomNumber(),
          "nDays": randomNumber(),
          "googleAccount": {
            "account": randomstring.generate(),
            "property": randomstring.generate(),
            "profile": randomstring.generate()
          },
          "id": randomstring.generate()
        }
      ];
      chai.request(server)
        .delete('/api/feed/' + settings._.feeds[0].id)
        .end(function(err,res) {
          if (err) {
            done(err);
          } else {
            assert.equal(settings._.feeds.length,0);
            res.should.have.status(200);
            done();
          }
        });
    });
  });

  describe('Dashboard API',function() {
    beforeEach(function(done) {
      async.waterfall([
        function(next) {
          const params = {
            'file': './settings.test.json'
          };
          settings.init(params,next);
        },
        function(next) {
          settings.commit(next);
        }
      ],done);
    });

    afterEach(function(done) {
      settings._ = {};
      settings.commit(done);
    })

    it('GET /api/dashboard',function(done) {
      settings._.dashboards = [
        {
          "name": randomstring.generate(),
          "googleAccount": {
            "account": randomstring.generate(),
            "property": randomstring.generate(),
            "profile": randomstring.generate()
          },
          "range": randomNumber(),
          "elements": {
            "events": [
              {
                "name": randomstring.generate(),
                "category": randomstring.generate(),
                "label": randomstring.generate(),
                "action": randomstring.generate()
              }
            ],
            "pages": [
              {
                "name": randomstring.generate(),
                "url": "http://example.com/" + randomstring.generate()
              },
              {
                "name": "erwevsvs",
                "url": "http://example.com" + randomstring.generate()
              }
            ],
            "goals": [
              {
                "name": randomstring.generate(),
                "number": randomNumber()
              },
              {
                "name": randomstring.generate(),
                "number": randomNumber()
              }
            ],
            "topPages": Math.random() > 0.5,
            "referrals": Math.random() > 0.5,
            "overallMetrics": Math.random() > 0.5
          },
          "id": randomstring.generate()
        }
      ];
      chai.request(server)
        .get('/api/dashboard')
        .end(function(err,res) {
          if (err) {
            done(err);
          } else {
            res.should.have.status(200);
            res.body.should.have.lengthOf(settings._.dashboards.length);
            res.body.should.be.a('array');
            res.body[0].should.be.a('object');
            ['name','range','id'].forEach(function(prop) {
              res.body[0].should.have.property(prop);
              res.body[0][prop].should.equal(settings._.dashboards[0][prop]);
            });
            res.body[0].googleAccount.should.be.a('object');
            ['account','property','profile'].forEach(function(prop) {
              res.body[0].googleAccount.should.have.property(prop);
              res.body[0].googleAccount[prop].should.equal(settings._.dashboards[0].googleAccount[prop]);
            });
            res.body[0].elements.should.be.a('object');
            ['topPages','referrals','overallMetrics'].forEach(function(prop) {
              res.body[0].elements.should.have.property(prop);
              res.body[0].elements[prop].should.equal(settings._.dashboards[0].elements[prop]);
            });
            ['events','pages','goals'].forEach(function(prop) {
              res.body[0].elements.should.have.property(prop);
              res.body[0].elements[prop].should.be.a('array');
              res.body[0].elements[prop].should.have.lengthOf(settings._.dashboards[0].elements[prop].length);
              res.body[0].elements[prop].forEach(function(arrayItem,index) {
                for(var subProp in settings._.dashboards[0].elements[prop][index]) {
                  arrayItem.should.have.property(subProp);
                  arrayItem[subProp].should.equal(settings._.dashboards[0].elements[prop][index][subProp]);
                }
              });
            });
            done();
          }
        });
    });

    it('GET /api/dashboard/:id',function(done) {
      settings._.dashboards = [
        {
          "name": randomstring.generate(),
          "googleAccount": {
            "account": randomstring.generate(),
            "property": randomstring.generate(),
            "profile": randomstring.generate()
          },
          "range": randomNumber(),
          "elements": {
            "events": [
              {
                "name": randomstring.generate(),
                "category": randomstring.generate(),
                "label": randomstring.generate(),
                "action": randomstring.generate()
              }
            ],
            "pages": [
              {
                "name": randomstring.generate(),
                "url": "http://example.com/" + randomstring.generate()
              },
              {
                "name": "erwevsvs",
                "url": "http://example.com" + randomstring.generate()
              }
            ],
            "goals": [
              {
                "name": randomstring.generate(),
                "number": randomNumber()
              },
              {
                "name": randomstring.generate(),
                "number": randomNumber()
              }
            ],
            "topPages": Math.random() > 0.5,
            "referrals": Math.random() > 0.5,
            "overallMetrics": Math.random() > 0.5
          },
          "id": randomstring.generate()
        }
      ];
      chai.request(server)
        .get('/api/dashboard/' + settings._.dashboards[0].id)
        .end(function(err,res) {
          if (err) {
            done(err);
          } else {
            res.should.have.status(200);
            res.body.should.be.a('object');
            ['name','range','id'].forEach(function(prop) {
              res.body.should.have.property(prop);
              res.body[prop].should.equal(settings._.dashboards[0][prop]);
            });
            res.body.googleAccount.should.be.a('object');
            ['account','property','profile'].forEach(function(prop) {
              res.body.googleAccount.should.have.property(prop);
              res.body.googleAccount[prop].should.equal(settings._.dashboards[0].googleAccount[prop]);
            });
            res.body.elements.should.be.a('object');
            ['topPages','referrals','overallMetrics'].forEach(function(prop) {
              res.body.elements.should.have.property(prop);
              res.body.elements[prop].should.equal(settings._.dashboards[0].elements[prop]);
            });
            ['events','pages','goals'].forEach(function(prop) {
              res.body.elements.should.have.property(prop);
              res.body.elements[prop].should.be.a('array');
              res.body.elements[prop].should.have.lengthOf(settings._.dashboards[0].elements[prop].length);
              res.body.elements[prop].forEach(function(arrayItem,index) {
                for(var subProp in settings._.dashboards[0].elements[prop][index]) {
                  arrayItem.should.have.property(subProp);
                  arrayItem[subProp].should.equal(settings._.dashboards[0].elements[prop][index][subProp]);
                }
              });
            });
            done();
          }
        });
    });

    it('POST /api/dashboard',function(done) {
      const item = {
        "name": randomstring.generate(),
        "googleAccount": {
          "account": randomstring.generate(),
          "property": randomstring.generate(),
          "profile": randomstring.generate()
        },
        "range": randomNumber(),
        "elements": {
          "events": [
            {
              "name": randomstring.generate(),
              "category": randomstring.generate(),
              "label": randomstring.generate(),
              "action": randomstring.generate()
            }
          ],
          "pages": [
            {
              "name": randomstring.generate(),
              "url": "http://example.com/" + randomstring.generate()
            },
            {
              "name": "erwevsvs",
              "url": "http://example.com" + randomstring.generate()
            }
          ],
          "goals": [
            {
              "name": randomstring.generate(),
              "number": randomNumber()
            },
            {
              "name": randomstring.generate(),
              "number": randomNumber()
            }
          ],
          "topPages": Math.random() > 0.5,
          "referrals": Math.random() > 0.5,
          "overallMetrics": Math.random() > 0.5
        }
      };
      chai.request(server)
        .post('/api/dashboard')
        .send(item)
        .end(function(err,res) {
          if (err) {
            done(err);
          } else {
            assert.equal(settings._.dashboards.length,1);
            res.should.have.status(200);
            res.body.should.be.a('object');
            res.body.should.have.property('id');
            ['name','range','id'].forEach(function(prop) {
              res.body.should.have.property(prop);
              res.body[prop].should.equal(settings._.dashboards[0][prop]);
            });
            res.body.googleAccount.should.be.a('object');
            ['account','property','profile'].forEach(function(prop) {
              res.body.googleAccount.should.have.property(prop);
              res.body.googleAccount[prop].should.equal(settings._.dashboards[0].googleAccount[prop]);
            });
            res.body.elements.should.be.a('object');
            ['topPages','referrals','overallMetrics'].forEach(function(prop) {
              res.body.elements.should.have.property(prop);
              res.body.elements[prop].should.equal(settings._.dashboards[0].elements[prop]);
            });
            ['events','pages','goals'].forEach(function(prop) {
              res.body.elements.should.have.property(prop);
              res.body.elements[prop].should.be.a('array');
              res.body.elements[prop].should.have.lengthOf(settings._.dashboards[0].elements[prop].length);
              res.body.elements[prop].forEach(function(arrayItem,index) {
                for(var subProp in settings._.dashboards[0].elements[prop][index]) {
                  arrayItem.should.have.property(subProp);
                  arrayItem[subProp].should.equal(settings._.dashboards[0].elements[prop][index][subProp]);
                }
              });
            });
            done();
          }
        });
    });

    it('PUT /api/dashboard/:id',function(done) {
      settings._.dashboards = [
        {
          "name": randomstring.generate(),
          "googleAccount": {
            "account": randomstring.generate(),
            "property": randomstring.generate(),
            "profile": randomstring.generate()
          },
          "range": randomNumber(),
          "elements": {
            "events": [
              {
                "name": randomstring.generate(),
                "category": randomstring.generate(),
                "label": randomstring.generate(),
                "action": randomstring.generate()
              }
            ],
            "pages": [
              {
                "name": randomstring.generate(),
                "url": "http://example.com/" + randomstring.generate()
              },
              {
                "name": "erwevsvs",
                "url": "http://example.com" + randomstring.generate()
              }
            ],
            "goals": [
              {
                "name": randomstring.generate(),
                "number": randomNumber()
              },
              {
                "name": randomstring.generate(),
                "number": randomNumber()
              }
            ],
            "topPages": Math.random() > 0.5,
            "referrals": Math.random() > 0.5,
            "overallMetrics": Math.random() > 0.5
          },
          "id": randomstring.generate()
        }
      ];
      const item = {
        "id": settings._.dashboards[0].id,
        "name": randomstring.generate(),
        "googleAccount": {
          "account": randomstring.generate(),
          "property": randomstring.generate(),
          "profile": randomstring.generate()
        },
        "range": randomNumber(),
        "elements": {
          "events": [
            {
              "name": randomstring.generate(),
              "category": randomstring.generate(),
              "label": randomstring.generate(),
              "action": randomstring.generate()
            }
          ],
          "pages": [
            {
              "name": randomstring.generate(),
              "url": "http://example.com/" + randomstring.generate()
            },
            {
              "name": "erwevsvs",
              "url": "http://example.com" + randomstring.generate()
            }
          ],
          "goals": [
            {
              "name": randomstring.generate(),
              "number": randomNumber()
            },
            {
              "name": randomstring.generate(),
              "number": randomNumber()
            }
          ],
          "topPages": Math.random() > 0.5,
          "referrals": Math.random() > 0.5,
          "overallMetrics": Math.random() > 0.5
        }
      }
      chai.request(server)
        .put('/api/dashboard/' + settings._.dashboards[0].id)
        .send(item)
        .end(function(err,res) {
          if (err) {
            done(err);
          } else {
            assert.equal(settings._.dashboards.length,1);
            res.should.have.status(200);
            res.body.should.be.a('object');
            res.body.should.have.property('id');
            ['name','range','id'].forEach(function(prop) {
              res.body.should.have.property(prop);
              res.body[prop].should.equal(settings._.dashboards[0][prop]);
            });
            res.body.googleAccount.should.be.a('object');
            ['account','property','profile'].forEach(function(prop) {
              res.body.googleAccount.should.have.property(prop);
              res.body.googleAccount[prop].should.equal(settings._.dashboards[0].googleAccount[prop]);
            });
            res.body.elements.should.be.a('object');
            ['topPages','referrals','overallMetrics'].forEach(function(prop) {
              res.body.elements.should.have.property(prop);
              res.body.elements[prop].should.equal(settings._.dashboards[0].elements[prop]);
            });
            ['events','pages','goals'].forEach(function(prop) {
              res.body.elements.should.have.property(prop);
              res.body.elements[prop].should.be.a('array');
              res.body.elements[prop].should.have.lengthOf(settings._.dashboards[0].elements[prop].length);
              res.body.elements[prop].forEach(function(arrayItem,index) {
                for(var subProp in settings._.dashboards[0].elements[prop][index]) {
                  arrayItem.should.have.property(subProp);
                  arrayItem[subProp].should.equal(settings._.dashboards[0].elements[prop][index][subProp]);
                }
              });
            });
            done();
          }
        });
    });

    it('DELETE /api/dashboard/:id',function(done) {
      settings._.dashboards = [
        {
          "name": randomstring.generate(),
          "googleAccount": {
            "account": randomstring.generate(),
            "property": randomstring.generate(),
            "profile": randomstring.generate()
          },
          "range": randomNumber(),
          "elements": {
            "events": [
              {
                "name": randomstring.generate(),
                "category": randomstring.generate(),
                "label": randomstring.generate(),
                "action": randomstring.generate()
              }
            ],
            "pages": [
              {
                "name": randomstring.generate(),
                "url": "http://example.com/" + randomstring.generate()
              },
              {
                "name": "erwevsvs",
                "url": "http://example.com" + randomstring.generate()
              }
            ],
            "goals": [
              {
                "name": randomstring.generate(),
                "number": randomNumber()
              },
              {
                "name": randomstring.generate(),
                "number": randomNumber()
              }
            ],
            "topPages": Math.random() > 0.5,
            "referrals": Math.random() > 0.5,
            "overallMetrics": Math.random() > 0.5
          },
          "id": randomstring.generate()
        }
      ];
      chai.request(server)
        .delete('/api/dashboard/' + settings._.dashboards[0].id)
        .end(function(err,res) {
          if (err) {
            done(err);
          } else {
            assert.equal(settings._.dashboards.length,0);
            res.should.have.status(200);
            done();
          }
        });
    });
  });
});

function randomNumber() {
  return Math.floor(Math.random() * 10000);
}
