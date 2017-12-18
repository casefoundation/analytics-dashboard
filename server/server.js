const express = require('express')
const bodyParser = require('body-parser')
const logger = require('morgan')
const path = require('path')
const configLoader = require('./lib/configLoader')
// const dashboardsArray = require('./config/dashboards.json');

const app = express()
if (process.env.NODE_ENV !== 'test') {
  app.use(express.static(path.join(__dirname, 'build')))
  app.use(logger('combined'))
}
app.use(bodyParser.json())

module.exports = () => {
  return configLoader.load()
    .then(({dashboardsArray, datasources}) => {
      setupRoutes(dashboardsArray, datasources)
      return app
    })
}

function setupRoutes (dashboardsArray, datasources) {
  app.get('/api/dashboard', (req, res, next) => {
    res.send(dashboardsArray)
  })
  app.get('/api/:dashboard/datasource', (req, res, next) => {
    res.send(datasources
      .filter((datasource) => {
        return datasource.config.dashboard === req.params.dashboard
      })
      .map((datasource) => {
        return datasource.name
      })
    )
  })
  app.get('/api/:dashboard/datasource/:datasource', (req, res, next) => {
    const datasource = datasources.find((datasource) => {
      return datasource.name === req.params.datasource && datasource.config.dashboard === req.params.dashboard
    })
    const startDate = new Date(parseInt(req.query.startDate) || (new Date().getTime() - (1000 * 60 * 60 * 24 * 30)))
    const endDate = new Date(parseInt(req.query.endDate) || new Date().getTime())
    datasource._.query(startDate, endDate)
      .then((data) => {
        res.send(data)
        if (process.env.WRITE_TEST_DATA) {
          return datasource._.writeTestData()
        }
      })
      .catch(next)
  })
}
