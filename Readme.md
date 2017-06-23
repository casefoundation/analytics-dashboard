# Analytics Dashboard

## About

## Configuration and Use

The dashboard relies on information from a set of "datasources" that each represent a different API service. Datasources may expose multiple widgets from their data. To enable new datasources, and therefore new widgets, create the necessary configuration file under the `server/config` directory. By default, the project ships with several sample configurations that should be altered per their directions and re-saved as `.json` files. (Also remove all `/* */` comments.)

### Google Analytics

This datasource accesses the Google Analytics Reporting API and produces any of the following widgets on the dashboard:

1. Event totals, named `events` in the config file
2. Common stats (sessions, hits, bounce rate) as a table for specific pages, named `pages` in the config file
3. Goal totals, named `goals` in the config file
4. Top pages as a bar graph, named `topPages` in the config file
5. Top referrers as a bar graph, named `referrals` in the config file
6. Overall site metrics (hits, sessions, bounce rate), named `overallMetrics` in the config file

### Feed-based Benchmarks

This datasource parses an RSS feed and then queries Google Analytics for data on each URL in the feed (up to a specified limit.). Then, it builds a performance benchmark for each URL based on the URLs that came chronologically before it. This creates a widget on the front end that shows a performance sparkline for each URL overlaid on a benchmark for average post performance reference.

### Mailchimp

This datasource queries the Mailchimp API and exposes the following widgets:

1. List sizes, named `lists` in the config file
2. Campaign performance


## To Do:

1. Unit tests
2. Clicky datasource
3. Woopra datasource
4. Scrolldepth datasource
