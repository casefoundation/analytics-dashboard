# Development

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
```

**Tab 1**

Back in our `analytics-dashboard/server` directory tab

```bash
# node index.js
```

**Tab 2**

Enter the directory `analytics-dashboard/client`. This will be our front end React app tab.

```bash
# npm install
# npm start
```

After that, the npm script will automatically open up a window with the application's frontend.
