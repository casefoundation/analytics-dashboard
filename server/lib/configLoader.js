const fs = require('fs-extra')
const path = require('path')
const async = require('async')
const datasources = require('../datasources')
const secrets = process.env.NODE_ENV === 'test' ? require('../test/config/secrets') : require('../config/secrets')

exports.load = () => {
  const configPath = process.env.NODE_ENV === 'test' ? './test/config' : './config'
  let dashboardsArray = null
  return fs.readJson(path.join(configPath, 'dashboards.json'))
    .then((_dashboardsArray) => {
      dashboardsArray = _dashboardsArray
      return fs.readdir(configPath)
    })
    .then((contents) => {
      const configFiles = contents.filter((file) => {
        return path.extname(file) === '.json' && file !== 'secrets.json' && file !== 'dashboards.json'
      })
      return new Promise((resolve, reject) => {
        async.parallel(
          configFiles.map((configFile) => {
            return (next) => {
              fs.readJson(path.join(configPath, configFile))
                .then((config) => {
                  if (config.klass) {
                    const datasource = new datasources[config.klass](config, secrets)
                    return datasource.setup()
                      .then(() => {
                        next(null, {
                          'name': configFile.replace('.json', ''),
                          'config': config,
                          '_': datasource
                        })
                      })
                  } else {
                    next(null, null)
                  }
                })
                .catch(next)
            }
          }),
          (err, configs) => {
            if (err) {
              reject(err)
            } else {
              resolve({
                dashboardsArray,
                'datasources': configs.filter((config) => config !== null)
              })
            }
          }
        )
      })
    })
}
