import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import {
  fetchDatasourceNames,
  fetchAllDatasourcesData,
  setQueryRange
} from './actions';
import _ from 'lodash';
import DashboardControl from './DashboardControl';
import Widgets from './Widgets';
import './App.css';

class App extends Component {
  componentDidMount() {
    this.props.fetchDatasourceNames();
  }

  render() {
    const datasourcesAsArray = _.toPairs(this.props.datasources.data).filter((datasource) => datasource[1].data.length > 0).map((datasource) => ({ 'name': datasource[0], 'data': datasource[1] }));
    return (
      <div className="container-fluid">
        <div className="row">
          <div className="col-md-2">
            <DashboardControl />
            <div className="panel panel-default">
              <div className="panel-heading">Quick Stats</div>
              <div className="panel-body">
                { datasourcesAsArray.map((datasource) => {
                  return datasource.data.data.filter((data) => data.type === 'quickstat').map((data) => {
                    return (
                      <div className="callout">
                        <div className="callout-value">
                          {isNaN(data.data) ? data.data : data.data.toLocaleString()}
                        </div>
                        <div className="callout-label">
                          <span className="label label-default">
                            {data.label}
                          </span>
                        </div>
                      </div>
                    )
                  })
                }) }
              </div>
            </div>
          </div>
          <div className="col-md-10">
            <Widgets />
          </div>
        </div>
      </div>
    );
  }
}

const stateToProps = (state) => {
  return {
    datasources: state.datasources
  }
}

const dispatchToProps = (dispatch) => {
  return bindActionCreators({
    fetchDatasourceNames,
    fetchAllDatasourcesData,
    setQueryRange
  }, dispatch)
}

export default connect(stateToProps, dispatchToProps)(App)
