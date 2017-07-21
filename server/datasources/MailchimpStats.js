const Mailchimp = require('mailchimp-api-v3');
const async = require('async');

class MailchimpStats {
  constructor(config) {
    this.config = config;
    this.mailchimp = new Mailchimp(this.config.apiKey);
  }

  setup() {
    return new Promise((resolve,reject) => {
      resolve();
    });
  }

  query(range) {
    const returnData = [];
    return this.fetchListStats()
      .then((stats) => {
        stats.forEach((list) => {
          returnData.push({
            'type': 'quickstat',
            'label': list.name + ' Size',
            'data': {
              'value': list.stats.member_count,
              'helptext': 'The number of subscribers in the ' + list.name + ' list in MailChimp'
            }
          });
          returnData.push({
            'type': 'callout',
            'label': list.name + ' Stats',
            'key': 'key',
            'value': 'value',
            'data': [
              {
                'key': 'Open Rate',
                'value': list.stats.open_rate.toLocaleString() + '%',
                'helptext': 'The average percentage of subscribers who open e-mails from the ' + list.name + ' list in MailChimp'
              },
              {
                'key': 'Click Rate',
                'value': list.stats.click_rate.toLocaleString() + '%',
                'helptext': 'The average percentage of subscribers who click links e-mails from the ' + list.name + ' list in MailChimp'
              }
            ],
            'helptext': 'These are the average open and click rates for email campaigns sent from the ' + list.name + ' list in MailChimp.'
          })
        })
      })
      .then(() => {
        return this.fetchCampaignStats(range);
      })
      .then((campaigns) => {
        returnData.push({
          'type': 'barchart',
          'label': 'Email Campaigns',
          'data': campaigns.map((campaign) => {
            return {
              'Name': campaign.settings.title,
              'Open Rate': campaign.report_summary.open_rate,
              'Click Rate': campaign.report_summary.click_rate
            }
          }),
          'key': 'Name',
          'value': [
            'Open Rate',
            'Click Rate'
          ],
          'percent': true,
          'helptext': 'These are open and click rates for email campaigns sent in MailChimp.'
        })
      })
      .then(() => {
        return returnData;
      })
  }

  fetchListStats() {
    return new Promise((resolve,reject) => {
      async.series(
        this.config.lists.map((listId) => {
          return (next) => {
            this.mailchimp.get({
              'path': '/lists/' + listId
            },next);
          }
        }),
        (err,stats) => {
          if (err) {
            reject(err);
          } else {
            resolve(stats);
          }
        }
      )
    })
  }

  fetchCampaignStats(range) {
    const now = new Date();
    return this.mailchimp.get({
      'path': '/campaigns',
      'query': {
        'count': 100,
        'status': 'sent',
        'since_send_time': new Date(now.getTime() - range).toISOString(),
        'before_send_time': now.toISOString(),
        'sort_field': 'send_time',
        'sort_dir': 'DESC'
      }
    })
      .then((campaigns) => {
        return campaigns.campaigns;
      })
  }
}

module.exports = MailchimpStats;
