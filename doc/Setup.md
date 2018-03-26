# Setup

1. [Theme Setup](#theme-setup)
1. [Data Source Quick Setup](#data-source-quick-setup)
1. [Advanced Data Source Setup](#advanced-data-source-setup)
1. [API Setup](#api-setup)
1. [Deployment](#deployment)

## Theme Setup

To customize the dashboard's theme, copy the file `client/src/theme/theme.sample` to `client/src/theme/theme.json`. Inside of that file, update the color codes to match your preferred colors. Also, Inside of `client/src/theme`, place your organization's logo as an SVG file named `logo.svg`.

## Data Source Quick Setup

To quickly get some data into the dashboard, we've provided a quick setup utility. For more advanced configuration, jump to [Advanced Data Source Setup](#advanced-data-Source-setup).

Before running the Quick Setup utility, there are a few prerequisite steps. Those are:

1. Setup access to the [Google Analytics API](#google-analytics-api). (Required only if using Google Analytics)
1. Grab your Google Analytics View ID in Google Analytics under _Admin_ > _View Settings_. (Required only if using Google Analytics)
1. Grab your RSS feed URL. (Optional)
1. Setup access to the [Mailchimp API](#mailchimp-api). (Required only if using Mailchimp)
1. Grab your Mailchimp [list ID](https://kb.mailchimp.com/lists/manage-contacts/find-your-list-id). (Required only if using Mailchimp)

With the necessary information from above ready, run the Quick Setup utility from the command line:

```bash
# node quickSetup.js
```

## Advanced Data Source Setup

The dashboard relies on information from a set of "data sources" that each represent a different API service. Datasources may expose multiple widgets from their data. To enable new datasources, and therefore new widgets, create the necessary configuration file under the `server/config` directory. By default, the project ships with several sample configurations that should be altered per their directions and re-saved as `.json` files. (Also remove all `/* */` comments.)

Before setting up any data sources, copy the `server/config/dashboards.sample` file to `server/config/dashboards.json`.

Each datasource configuration file also contains a `dashboard` property to support multiple dashboards. To enable multiple dashboards, create a new entry in the `server/config/dashboards.json` file with an object containing a `name` and `label` property. The `name` is the machine readable string contained in each config file that identifies to which dashboard the config file belongs and the `label` property is the human readable string used on the front end.

### Google Analytics

This datasource accesses the Google Analytics Reporting API and produces any of the following widgets on the dashboard:

1. Event totals, named `events` in the config file
2. Common stats (sessions, hits, bounce rate) as a table for specific pages, named `pages` in the config file
3. Goal totals, named `goals` in the config file
4. Top pages as a bar graph, named `topPages` in the config file
5. Top referrers as a bar graph, named `referrals` in the config file
6. Overall site metrics (hits, sessions, bounce rate), named `overallMetrics` in the config file
7. Aggregating common stats base on custom dimensions, such as authors, named `dimensions` in the config file

Copy the sample config file under `server/config/googleanalytics.sample` to `server/config/googleanalytics.json` and follow the help text in that file to set up the data source.

### Feed Benchmarks

This datasource parses an RSS feed and then queries Google Analytics for data on each URL in the feed (up to a specified limit.). Then, it builds a performance benchmark for each URL based on the URLs that came chronologically before it. This creates a widget on the front end that shows a performance sparkline for each URL overlaid on a benchmark for average post performance reference.

Copy the sample config file under `server/config/feed-benchmarks.sample` to `server/config/feed-benchmarks.json` and follow the help text in that file to set up the data source.

### Feed Tables

To instead show a simple table of pages and their stats based on an RSS feed, there is the Feed Table option. Copy the sample config file under `server/config/feed-table.sample` to `server/config/feed-table.json` and follow the help text in that file to set up the data source.

### MailChimp

This datasource queries the Mailchimp API and exposes the following widgets:

1. List sizes, named `lists` in the config file
2. Campaign performance as bar charts
3. Signup source totals as a stacked area chart

Copy the sample config file under `server/config/mailchimp.sample` to `server/config/mailchimp.json` and follow the help text in that file to set up the data source.

## API Setup

The dashboard looks at a secrets.json file for all API access info. Copy the sample secrets file under `server/config/secrets.sample` to `server/config/secrets.json` to begin specify access information.

### Google Analytics API

Set up a new application in the [Google APIs Console](https://console.developers.google.com/), enable the [Google Analytics Reporting API](https://console.developers.google.com/apis/library/analyticsreporting.googleapis.com) for that application, and generate a "[service account](https://cloud.google.com/iam/docs/creating-managing-service-accounts)" for the application. 

Download the JSON credentials for that service account. If using the Quick Setup, be ready to paste the path to that downloaded file into the prompt when asked. Otherwise, paste that JSON object in the value for the `google` key in the `secrets.json` file. 

Also, the service account will contain an email address that you will need to add to your Google Analytics property's authorized user/viewers list.

### MailChimp API

[Create an API key](https://kb.mailchimp.com/integrations/api-integrations/about-api-keys) in your MailChimp account. If using the Quick Setup, be ready to paste that key into the prompt when asked. Otherwise, specify that string as the value for the key `mailchimp` in the `secrets.json` file.

## Deployment

To build a Docker image of Analytics Dashboard, build the Dockerfile located in the root of the project by running:

```bash
# docker build -t analytics-dashboard ./
```

Then run the image using Docker's run command:

```bash
# docker run [options] -p 8080:8080 analytics-dashboard
```

To have the server listen on another port, specify --env PORT=[PORT NUMBER].
