const reporters = require('../lib/reporters');
const settings = require('remote-settings');
const Joi = require('joi');

const schema = Joi.object().keys({
  'googleAccount': {
    'account': Joi.string().default(''),
    'property': Joi.string().default(''),
    'profile': Joi.string().default('')
  },
  'range': Joi.number().integer().required(),
  'elements': {
    'events': [
      {
        'name': Joi.string().required(),
        'category': Joi.string().required().allow(null),
        'label': Joi.string().required().allow(null),
        'action': Joi.string().required().allow(null)
      }
    ],
    'pages': [
      {
        'name': Joi.string().required(),
        'url': Joi.string().uri().required()
      },
    ],
    'goals': [
      {
        'name': Joi.string().required(),
        'number': Joi.number().integer().required()
      },
    ],
    'topPages': Joi.boolean(),
    'referrals': Joi.boolean(),
    'overallMetrics': Joi.boolean()
  }
});

exports.getSettings = function(req,res,next) {
  res.send(settings._.dashboard);
}

exports.updateSettings = function(req,res,next) {
  Joi.validate(req.body,schema,function(err,object) {
    if (err) {
      next(err);
    } else {
      settings._.dashboard = object;
      settings.commit();
      res.send(settings);
    }
  });
}

exports.runReport = function(req,res,next) {
  reporters.googleAnalyticsDashboard.run(settings,function(err,report) {
    if (err) {
      next(err);
    } else {
      res.send(report);
    }
  });
}
