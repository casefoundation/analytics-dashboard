import React, { Component } from 'react';
import { HashRouter,Route,Switch } from 'react-router-dom';
import Dashboard from './Dashboard';

export default class App extends Component {
  render() {
    return (
      <HashRouter>
        <Switch>
          <Route path="/:dashboard" exact={true} component={Dashboard} />
          <Route path="/" component={Dashboard} />
        </Switch>
      </HashRouter>
    )
  }
}
