import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import {
  fetchAllDatasourcesData,
  setQueryRange
} from './actions';

const now = new Date();

const quarterRanges = [
  {
    'name': 'Q1',
    'values': {
      'start': {
        'month': 0,
        'day': 1,
      },
      'end': {
        'month': 2,
        'day': 31,
      }
    }
  },
  {
    'name': 'Q2',
    'values': {
      'start': {
        'month': 3,
        'day': 1,
      },
      'end': {
        'month': 5,
        'day': 30,
      }
    }
  },
  {
    'name': 'Q3',
    'values': {
      'start': {
        'month': 6,
        'day': 1,
      },
      'end': {
        'month': 8,
        'day': 30,
      }
    }
  },
  {
    'name': 'Q4',
    'values': {
      'start': {
        'month': 9,
        'day': 1,
      },
      'end': {
        'month': 11,
        'day': 31,
      }
    }
  }
];

const dateRangeOptions = [
  {
    'start': new Date(now.getTime() - (1000 * 60 * 60 * 24)),
    'end': now,
    'label': 'Previous Day'
  },
  {
    'start': new Date(now.getTime() - (1000 * 60 * 60 * 24 * 7)),
    'end': now,
    'label': 'Previous Week'
  },
  {
    'start': new Date(now.getTime() - (1000 * 60 * 60 * 24 * 30)),
    'end': now,
    'label': 'Previous 30 Days'
  },
  {
    'start': new Date(now.getTime() - (1000 * 60 * 60 * 24 * 182.5)),
    'end': now,
    'label': 'Previous 6 Months'
  },
  {
    'start': new Date(now - (1000 * 60 * 60 * 24 * 365)),
    'end': now,
    'label': 'Previous Year'
  },
  {
    'start': new Date(now.getTime() - (1000 * 60 * 60 * 24 * 365 * 5)),
    'end': now,
    'label': 'Previous 5 Years'
  },
  {
    'start': new Date(now.getTime() - (1000 * 60 * 60 * 24 * 365 * 10)),
    'end': now,
    'label': 'Previous 10 Years'
  }
];

[now.getFullYear() - 1,now.getFullYear()].forEach((year) => {
  quarterRanges.forEach((range) => {
    const startDate = new Date(year,range.values.start.month,range.values.start.day,0,0,0);
    if (startDate.getTime() < now.getTime()) {
      const endDate = new Date(year,range.values.end.month,range.values.end.day,23,59,59);
      dateRangeOptions.push({
        'start': startDate,
        'end': endDate,
        'label': range.name + ' ' + year
      });
    }
  });
});

class DashboardControl extends Component {
  constructor(props) {
    super(props);
    this.rangeChanged = this.rangeChanged.bind(this);
  }

  rangeChanged(event) {
    const {start,end} = dateRangeOptions[parseInt(event.target.value)];
    this.props.setQueryRange(start,end);
    this.props.fetchAllDatasourcesData();
  }

  render() {
    const now = new Date().getTime();
    const selectedRange = dateRangeOptions.findIndex((range) => {
      return range.start.getTime() === this.props.datasources.range.startDate.getTime() && range.end.getTime() === this.props.datasources.range.endDate.getTime();
    });
    return (
      <div className="form-group">
        <label className="sr-only">Time Range:</label>
        <select className="form-control" defaultValue={[,].join(',')} onChange={this.rangeChanged}>
          {
            dateRangeOptions.map((range,i) => (<option key={i} value={i}>{range.label}</option>))
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
