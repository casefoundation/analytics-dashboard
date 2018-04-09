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

These are example JSON objects that can be included in the data payload array. 

For each type of widget, there are a few common properties:

1. **type** is the indicator of the widget type.
1. **label** is the widget's human-readable title.
1. **helptext** is the text to place in the tooltip.
1. **data** holds the meat of the widget.

### Quickstat

Include a number in the left-hand _Quickstats_ column.

```JSON
{
  "type": "quickstat",
  "label": "Some data",
  "data": {
    "value": 100,
    "helptext": "Useful information"
  }
}
```

### Table

Creates a table whose rows will automatically sort by clicking on the column headings. The default sort is whichever order is specified here.

```JSON
{
  "type": "table",
  "label": "Tabular Data",
  "helptext": "Usefule information about the data",
  "data": [
    {
      "Column Heading": "Column value",
      "Numeric Column Heading": 123
    },
    ...
  ]
}
```

### Callout

Creates a widget with bolded _callout_ numbers. (The quantity of numbers to include is arbitrary.) Note that the properties `key` and `value` specify the property names to use in `data` for the label and value for each callout.

```JSON
{
  "type": "callout",
  "label": "Important Numbers",
  "helptext": "Useful information about those numbers",
  "key": "stat",
  "value": "number",
  "data": [
    {
      "stat": "Some Stat Label",
      "number": 1,
      "helptext": "Helpful information about this specific stat."
    },
    ...
  ]
}
```

### Bar Chart

Creates a horizontal bar chart. Note the use of the `key`/`value` properties to specify axis series. Multiple entries for `value` as scene here creates multiple bars per data array item. Also, the `percent` boolean signals if the number properties are 0.0 to 1.0 percentages and renders them as 0% to 100%.

```JSON
{
  "type": "barchart",
  "label": "Bars",
  "helptext": "These bars show data.",
  "key": "Base Axis Prop",
  "value": [
    "Numeric Prop 1",
    "Numeric Prop 2"
  ],
  "percent": false,
  "data": [
    {
      "Base Axis Prop": "Monday",
      "Numeric Prop 1": 1,
      "Numeric Prop 2": 2
    }
  ]
}
```

### Stacked Chart

Creates a stacked line chart. Note that the `xAxis` property specifies which property in the `data` array to use as the X Axis. All other properties in the `data` array are expected to be numeric and for the stacked chart.

```JSON
{
  "type": "stackedchart",
  "label": "Information that stacks up",
  "helptext": "Useful information",
  "xAxis": "Date", 
  "data": [
    {
      "Date": "Monday, June 2",
      "Value 1": 1,
      "Value 2": 2
    },
    ...
  ]
}
```

### Pie Chart

Creates a simple pie chart. Note the use of the `key`/`value` properties to specify section name and share. Also, the `percent` boolean signals if the number properties are 0.0 to 1.0 percentages and renders them as 0% to 100%.

```JSON
{
  "type": "pie",
  "label": "Parts of a Whole",
  "helptext": "Useful information about those numbers",
  "key": "Section",
  "value": "Share",
  "percent": true,
  "data": [
    {
      "Section": "Section name",
      "Share": 0.25
    },
    ...
  ]
}
```
