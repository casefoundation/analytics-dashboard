const fs = require('fs-extra');
const path = require('path');
const async = require('async');
const datasources = require('../datasources');

exports.load = () => {
  const configPath = './config';
  return fs.readdir(configPath)
    .then((contents) => {
      const configFiles = contents.filter((file) => {
        return path.extname(file) === '.json';
      });
      return new Promise((resolve,reject) => {
        async.parallel(
          configFiles.map((configFile) => {
            return (next) => {
              fs.readJson(path.join(configPath,configFile))
                .then((config) => {
                  const datasource = new datasources[config.klass](config);
                  return datasource.setup()
                    .then(() => {
                      next(null,{
                        'name': configFile.replace('.json',''),
                        'config': config,
                        '_': datasource
                      });
                    })
                })
                .catch(next);
            }
          }),
          (err,configs) => {
            if (err) {
              reject(err)
            } else {
              resolve(configs);
            }
          }
        )
      })
    })
}
