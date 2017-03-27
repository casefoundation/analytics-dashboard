const uuid = require('node-uuid');
const dashboardEngine = require('../lib/dashboardEngine');
const settings = require('remote-settings');
const Joi = require('joi');

const schema = Joi.object().keys({
  'id': Joi.string().optional(),
  'name': Joi.string().required(),
  'googleAccount': {
    'account': Joi.string().default(''),
    'property': Joi.string().default(''),
    'profile': Joi.string().default('')
  },
  'range': Joi.number().integer().required(),
  'elements': {
    'events': Joi.array().items(
      {
        'name': Joi.string().required(),
        'category': Joi.string().required().allow(null),
        'label': Joi.string().required().allow(null),
        'action': Joi.string().required().allow(null)
      }
    ),
    'pages': Joi.array().items(
      {
        'name': Joi.string().required(),
        'url': Joi.string().uri().required()
      }
    ),
    'goals': Joi.array().items(
      {
        'name': Joi.string().required(),
        'number': Joi.number().integer().required()
      }
    ),
    'topPages': Joi.boolean(),
    'referrals': Joi.boolean(),
    'overallMetrics': Joi.boolean()
  }
});


exports.getDashboards = function(req,res,next) {
  res.send(settings._.dashboards || []);
}

exports.getDashboard = function(req,res,next) {
  if (req.params.id) {
    const dashboard = getDashboard(req.params.id);
    if (dashboard) {
      res.send(dashboard);
    } else {
      res.send(404);
    }
  } else {
    res.send(404);
  }
}

exports.saveDashboard = function(req,res,next) {
  Joi.validate(req.body,schema,function(err,object) {
    if (!object.googleAccount) {
      object.googleAccount = {};
    }
    if (err) {
      next(err);
    } else {
      if (!settings._.dashboards) {
        settings._.dashboards = [];
      }
      if (req.params && req.params.id) {
        const index = getDashboardIndex(req.params.id);
        if (index >= 0) {
          settings._.dashboards[index] = object;
          settings._.dashboards[index].id = req.params.id;
          res.send(settings._.dashboards[index]);
          settings.commit();
        } else {
          res.send(404);
        }
      } else {
        object.id = uuid.v1();
        settings._.dashboards.push(object);
        res.send(object);
        settings.commit();
      }
    }
  })
}

exports.deleteDashboard = function(req,res,next) {
  if (!settings._.dashboards) {
    settings._.dashboards = [];
  }
  if (req.params && req.params.id) {
    const index = getDashboardIndex(req.params.id);
    if (index >= 0) {
      settings._.dashboards.splice(index,1);
      res.send({});
      settings.commit();
    } else {
      res.send(404);
    }
  } else {
    res.send(400);
  }
}

function getDashboard(id) {
  const index = getDashboardIndex(id);
  if (index >= 0) {
    return settings._.dashboards[index];
  } else {
    return null;
  }
}

function getDashboardIndex(id) {
  if (!settings._.dashboards) {
    settings._.dashboards = [];
  }
  return settings._.dashboards.findIndex(function(dashboard) {
    return dashboard.id === id;
  });
}

exports.runDashboardReport = function(req,res,next) {
  if (settings._.dashboards) {
    const dashboard = settings._.dashboards.find(function(dashboard) {
      return dashboard.id === req.params.id;
    });
    if (dashboard) {
      dashboardEngine.runReport(settings,dashboard,function(err,report) {
        if (err) {
          next(err);
        } else {
          res.send(report);
        }
      });
    } else {
      res.send(404);
    }
  } else {
    res.send(404);
  }
}
