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

  query(startDate,endDate) {
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
                'value': (Math.round(parseFloat(list.stats.open_rate) * 10) / 10).toLocaleString() + '%',
                'helptext': 'The average percentage of subscribers who open e-mails from the ' + list.name + ' list in MailChimp'
              },
              {
                'key': 'Click Rate',
                'value': (Math.round(parseFloat(list.stats.click_rate) * 10) / 10).toLocaleString() + '%',
                'helptext': 'The average percentage of subscribers who click links e-mails from the ' + list.name + ' list in MailChimp'
              }
            ],
            'helptext': 'These are the average open and click rates for email campaigns sent from the ' + list.name + ' list in MailChimp.'
          })
        })
      })
      .then(() => {
        return this.fetchCampaignStats(startDate,endDate);
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

  fetchCampaignStats(startDate,endDate) {
    return this.mailchimp.get({
      'path': '/campaigns',
      'query': {
        'count': 100,
        'status': 'sent',
        'since_send_time': startDate.toISOString(),
        'before_send_time': endDate.toISOString(),
        'sort_field': 'send_time',
        'sort_dir': 'DESC'
      }
    })
      .then((campaigns) => {
        if (this.config.campaignWhitelist) {
          return campaigns.campaigns.filter((campaign) => {
            return this.config.campaignWhitelist.indexOf(campaign.recipients.list_id) >= 0;
          });
        } else {
          return campaigns.campaigns;
        }
      })
  }
}

module.exports = MailchimpStats;
