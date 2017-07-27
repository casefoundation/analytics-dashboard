const express = require('express');
const bodyParser = require('body-parser');
const logger = require('morgan');
const path = require('path');
const configLoader = require('./lib/configLoader');

const app = express();
if (process.env.NODE_ENV !== 'test') {
  app.use(express.static(path.join(__dirname, 'build')));
  app.use(logger('combined'));
}
app.use(bodyParser.json());

module.exports = () => {
  return configLoader.load()
    .then((datasources) => {
      setupRoutes(datasources);
      return app;
    })
}

function setupRoutes(datasources) {
  app.get('/api/datasource',(req,res,next) => {
    res.send(datasources.map((datasource) => {
      return datasource.name;
    }));
  });
  app.get('/api/datasource/:datasource',(req,res,next) => {
    const datasource = datasources.find((datasource) => {
      return datasource.name == req.params.datasource;
    });
    const startDate = new Date(parseInt(req.query.startDate) || (new Date().getTime()-(1000 * 60 * 60 * 24 * 30)));
    const endDate = new Date(parseInt(req.query.endDate) || new Date().getTime());
    datasource._.query(startDate,endDate)
      .then((data) => {
        res.send(data);
        if (process.env.WRITE_TEST_DATA) {
          return datasource._.writeTestData();
        }
      })
      .catch(next);
  });
}
