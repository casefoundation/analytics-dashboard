# Development

1. [Setup](#setup)
1. [Creating Datasources](#creating-datasources)
1. [Data Payloads](#data-payloads)
1. [Widget Types](#widget-types)

## Setup

To setup a development environment, do the following:

```bash
# git clone git@github.com:casefoundation/analytics-dashboard.git
# cd analytics-dashboard
```

Now open two terminal tabs/windows in the `analytics-dashboard` directory

**Tab 1**

This will be the tab where we run the backend node server:

```bash
# cd server
# npm install
# node index.js
```

**Tab 2**

This will be our front end React app tab.

```bash
# cd client
# npm install
# npm start
```

After that, the npm script will automatically open up a window with the application's frontend.

## Creating Datasources

The system produces all data via subclasses of the class `DataSource` found in `server/datasources`. (When adding a new class, be sure to update `index.js` in that diretory to auto-load the new JS file.) A barebones subclass looks something like:

```javascript
const DataSource = require('./DataSource')

class ExampleDataSource extends DataSource {
  setup () {
    // Execute some async code and return a Promise, execute some sync code and return Promise.resolve(), or omit the method entirely if no setup is needed.
  }

  query (startDate, endDate) {
    // Execute some async code and return a Promise with data to send to the front end. (See Data Payloads in Development docs). The params are date objects that dictate the bounds of the data to be fetched
  }
}

module.exports = ExampleDataSource
```

Each instance of a DataSource subclass has object `config` and `secrets` properties that provide runtime information for the object. The system loads the config data from the `server/config` directory automatically by parsing all JSON files and instantiating a new object class for each JSON file by looking at the `klass` property of the JSON.

Secrets is a globally loaded object. The file is loaded from `server/config` and passed to each new DataSource subclass instance directly.

## Data Payloads

At the end of the execution of the `query` method, the code should return a data payload that dictates widgets and data visualizations to show on the frontend. In general, it is an array whose items are new widgets to display. A barebones payload looks like:

```JSON
[
  {
    "type": "quickstat",
    "label": "Some data",
    "data": {
      "value": 100,
      "helptext": "Useful information"
    }
  }
  ...
]
```

## Widget Types

### Quickstat



### Table


### Callout


### Bar Chart


### Sparklines


### Stacked Chart


### Pie Chart
