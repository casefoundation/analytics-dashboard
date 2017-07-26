const Mailchimp = require('mailchimp-api-v3');
const async = require('async');
const _ = require('lodash');
const secrets = require('../config/secrets');

class MailchimpStats {
  constructor(config) {
    this.config = config;
    this.mailchimp = new Mailchimp(secrets.mailchimp);
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
          });
        });
      })
      .then(() => {
        return this.fetchMemberSignupStats(startDate,endDate);
      })
      .then((arraysOfDaysAndSignups) => {
        arraysOfDaysAndSignups.forEach((daysAndSignups) => {
          returnData.push({
            'type': 'stackedchart',
            'label': 'Signup Sources',
            'xAxis': 'date',
            'data': daysAndSignups,
            'helptext': 'This is a daily graph of email list signups in Mailchimp and where the subscribers are coming from.'
          });
        });
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
    });
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

  fetchMemberSignupStats(startDate,endDate) {
    return new Promise((resolve,reject) => {
      async.series(
        this.config.lists.map((listId) => {
          return (next) => {
            const aggregatedMembers = [];
            const makeMCCall = (page) => {
              return this.mailchimp.get({
                'path': '/lists/' + listId + '/members',
                'query': {
                  'count': 1000,
                  'offset': page * 1000,
                  'status': 'subscribed',
                  'since_timestamp_opt': startDate.toISOString(),
                  'before_timestamp_opt': endDate.toISOString()
                }
              }).then((members) => {
                members.members.forEach((member) => {
                  aggregatedMembers.push(member);
                });
                if (members.members.length == 1000) {
                  return makeMCCall(page+1);
                }
              });
            }
            makeMCCall(0)
              .then(() => {
                const dayMap = {};
                aggregatedMembers.forEach((member) => {
                  const signupDate = new Date(Date.parse(member.timestamp_opt));
                  const signupDay = new Date(signupDate.getFullYear(),signupDate.getMonth(),signupDate.getDate());
                  const stamp = signupDay.getTime();
                  if (!dayMap[stamp]) {
                    dayMap[stamp] = {
                      'date': signupDay
                    };
                  }
                  const source = member.merge_fields[this.config.sourceField] && member.merge_fields[this.config.sourceField].trim().length > 0 ? member.merge_fields[this.config.sourceField] : 'Unknown';
                  if (!dayMap[stamp][source]) {
                    dayMap[stamp][source] = 1;
                  } else {
                    dayMap[stamp][source]++;
                  }
                });
                const days = _.values(dayMap);
                days.sort((a,b) => {
                  return a.date.getTime() - b.date.getTime();
                });
                days.forEach((day) => {
                  day.date = day.date.toDateString();
                });
                next(null,days);
              })
              .catch(next);
          }
        }),
        (err,members) => {
          if (err) {
            reject(err);
          } else {
            resolve(members);
          }
        }
      )
    });
  }
}

module.exports = MailchimpStats;
