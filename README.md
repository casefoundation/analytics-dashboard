# Analytics Dashboard

[![Build Status](https://travis-ci.org/casefoundation/analytics-dashboard.svg?branch=master)](https://travis-ci.org/casefoundation/analytics-dashboard)

## About

This is a dashboard for showing post perfromance benchmarked against previous posts in the same series. This is accomplished by reading an RSS feed of content and then query the Google Analytics reporting API for data about the URLs in that feed. Then, the dashboard takes a certain number of previous posts for each post and calculates the average performance of those previous posts. It then compares the original post's data against those averages to determine its benchmark score.

## Installation

The app runs as a Docker project. To install and run it, complete the following:

First, create a file in the root of the project named `GOOGLE.env` that contains the OAuth2 keys given by the Google API Console for access to the Google Analytics configuraiton and reporting APIs. The file should look like this:

```
GOOGLE_KEY=keyfromgoogle
GOOGLE_SECRET=secretfromgoogle
```

After creating that file, build the Docker image by running:

```
docker build ./ -t analyticsdashboard
```

Finally, start the Docker image by running

```
docker run --env-file ./GOOGLE.env -e PORT=8080 -e ROOT_URL=http://localhost:8080 -p "8080:8080" analyticsdashboard
```

## Usage

Once the app is up and running, visit [http://localhost:8080](http://localhost:8080) to start using the dashboard.

## Contributing

See [CONTRIBUTING](CONTRIBUTING.md) for additional information.

## License

See [LICENSE](LICENSE.txt) for additional information.
