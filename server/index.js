const express = require('express');
const bodyParser = require('body-parser');
const logger = require('morgan');
const path = require('path');
const configLoader = require('./lib/configLoader')

const app = express();
app.use(express.static(path.join(__dirname, 'build')));
app.use(logger('combined'));
app.use(bodyParser.json());

configLoader.load()
  .then((datasources) => {
    setupRoutes(datasources);
    return startServer();
  })
  .catch((err) => {
    console.error(err);
    process.exit(-1);
  });

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
      })
      .catch(next);
  });
}

function startServer() {
  return new Promise((resolve,reject) => {
    app.listen(process.env.PORT || 8080,(err) => {
      if (err) {
        reject(err);
      } else {
        console.log('Server running');
        resolve();
      }
    });
  })
}
