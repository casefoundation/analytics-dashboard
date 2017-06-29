import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import {
  fetchAllDatasourcesData,
  setQueryRange
} from './actions';

class DashboardControl extends Component {
  constructor(props) {
    super(props);
    this.rangeChanged = this.rangeChanged.bind(this);
  }

  rangeChanged(event) {
    this.props.setQueryRange(event.target.value);
    this.props.fetchAllDatasourcesData();
  }

  render() {
    return (
      <div className="form-group">
        <label className="sr-only">Time Range:</label>
        <select className="form-control" defaultValue={this.props.datasources.range} onChange={this.rangeChanged}>
          {
            [
              {
                'time': 1000 * 60 * 60 * 24,
                'label': 'Previous Day'
              },
              {
                'time': 1000 * 60 * 60 * 24 * 7,
                'label': 'Previous Week'
              },
              {
                'time': 1000 * 60 * 60 * 24 * 30,
                'label': 'Previous 30 Days'
              },
              {
                'time': 1000 * 60 * 60 * 24 * 182.5,
                'label': 'Previous 6 Months'
              },
              {
                'time': 1000 * 60 * 60 * 24 * 365,
                'label': 'Previous Year'
              }
            ].map((range) => (<option key={range.time} value={range.time}>{range.label}</option>))
          }
        </select>
      </div>
    )
  }
}

const stateToProps = (state) => {
  return {
    datasources: state.datasources
  }
}

const dispatchToProps = (dispatch) => {
  return bindActionCreators({
    fetchAllDatasourcesData,
    setQueryRange
  }, dispatch)
}

export default connect(stateToProps, dispatchToProps)(DashboardControl);
