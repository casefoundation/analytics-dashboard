const FeedDataSource = require('./FeedDataSource');

class FeedBenchmarks extends FeedDataSource {

  getGoogleRequestMetricsDimensions() {
    return [
      {
        'metrics': ['ga:pageviews'],
        'dimensions': ['ga:date','ga:hostname','ga:pagePath'],
      },
    ];
  }

  generateWidgets(feed,report) {
    return [
      {
        'data': this.analyzeReport(feed,report),
        'type': 'sparklines',
        'label': 'Pageview Performance vs Rolling Average',
        'primary': 'Actual',
        'secondary': 'Average',
        'xAxis': 'Date',
        'helptext': 'This displays a comparison graph between each post from its publish date plus ' + this.config.nDays + ' days compared to a rolling average of previous posts from their publish date plus ' + this.config.nDays + ' days.'
      }
    ];
  }

  getDateBounds(feed,startDate,endDate) {
    const dates = {
      'start': null,
      'end': null
    }
    feed.forEach(function(item) {
      if (dates.start == null || dates.start.getTime() > item.pubdate.getTime()) {
        dates.start = item.pubdate;
      }
      if (dates.end == null || dates.end.getTime() < item.pubdate.getTime()) {
        dates.end = item.pubdate;
      }
    });
    dates.start = new Date(dates.start.getTime() - (this.config.nDays * FeedDataSource.OneDay));
    dates.end = new Date(dates.end.getTime() + (this.config.nDays * FeedDataSource.OneDay));
    return dates;
  }

  filterReportFeed(feed,startDate,endDate) {
    if (feed.length < this.config.nPosts * 2) {
      throw new Error('Feed too short.');
    } else {
      return feed.slice(0,this.config.nPosts * 2);
    }
  }

  processGoogleResponseBodies(feed,urls,responseBodies) {
    const consolidatedReport = {};
    responseBodies.forEach((responseBodySet,i) => {
      responseBodySet.forEach((report) => {
        if (report.data.rows && report.data.rows.length) {
          report.data.rows.forEach((row) => {
            const date = new Date(Date.parse([row.dimensions[0].substring(0,4),row.dimensions[0].substring(4,6),row.dimensions[0].substring(6,8)].join('-')));
            const dateStamp = date.getTime();
            const foundURL = this.getURLForHostnameAndPath(urls,row.dimensions[1],row.dimensions[2]);
            if (foundURL) {
              if (!consolidatedReport[foundURL.href]) {
                consolidatedReport[foundURL.href] = {};
              }
              if (!consolidatedReport[foundURL.href][dateStamp]) {
                consolidatedReport[foundURL.href][dateStamp] = {
                  'date': date,
                  'metrics': {}
                };
              }
              switch(i) {
                case 0:
                  ['pageviews'].forEach(function(metricName,j) {
                    if (!consolidatedReport[foundURL.href][dateStamp].metrics[metricName]) {
                       consolidatedReport[foundURL.href][dateStamp].metrics[metricName] = 0;
                    }
                    consolidatedReport[foundURL.href][dateStamp].metrics[metricName] += parseInt(row.metrics[0].values[j]);
                  });
                  break;
              }
            }
          });
        }
      });
    });
    return consolidatedReport;
  }

  analyzeReport(feed,report) {
    const reports = [];
    feed.slice(0,this.config.nPosts).forEach((reportPost,i) => {
      const data = [];
      const thisReport = {
        'url': reportPost.link,
        'name': reportPost.title,
        'startDate': new Date(Date.parse(this.formatDate(reportPost.pubdate))),
        'endDate': new Date(Math.min(Date.parse(this.formatDate(reportPost.pubdate)) + (this.config.nDays * FeedDataSource.OneDay),new Date().getTime())),
        'data': data
      };

      reports.push(thisReport);

      const computePosts = feed.slice(i+1,i+this.config.nPosts);
      computePosts.forEach((computePost,j) => {
        const baseDate = new Date(Date.parse(this.formatDate(computePost.pubdate)));
        for(var l = 0; l < this.config.nDays; l++) {
          const stamp = baseDate.getTime() + (l * FeedDataSource.OneDay);
          if (!data[l]) {
            data[l] = {
              'Average': [],
              'Actual': 0,
              'Date': new Date(stamp).toDateString()
            };
          }
          if (report[computePost.link] && report[computePost.link][stamp] && report[computePost.link][stamp].metrics.pageviews) {
            data[l].Average.push(report[computePost.link][stamp].metrics.pageviews);
          }
        }
      });

      for(var l = 0; l < this.config.nDays; l++) {
        if (l < data.length) {
          data[l].Average = data[l].Average.reduce(function(previous,current) {
            return previous + current;
          },0) / computePosts.length;
        } else {
          data[l].Average = 0;
        }
      }

      for(var l = 0; l < this.config.nDays; l++) {
        const stamp = thisReport.startDate.getTime() + (l * FeedDataSource.OneDay);
        if (report[reportPost.link] && report[reportPost.link][stamp] && report[reportPost.link][stamp].metrics.pageviews) {
          const value = report[reportPost.link][stamp].metrics.pageviews;
          data[l].Actual = value;
        } else {
          data[l].Actual = 0;
        }
      }
    });
    return reports;
  }
}

module.exports = FeedBenchmarks;
