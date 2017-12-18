import React, { Component } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import {
  fetchAllDatasourcesData,
  setQueryRange
} from './actions'
import {
  NOW,
  ONE_DAY
} from './constants'
import PropTypes from 'prop-types'

const quarterRanges = [
  {
    'name': 'Q1',
    'values': {
      'start': {
        'month': 0,
        'day': 1
      },
      'end': {
        'month': 2,
        'day': 31
      }
    }
  },
  {
    'name': 'Q2',
    'values': {
      'start': {
        'month': 3,
        'day': 1
      },
      'end': {
        'month': 5,
        'day': 30
      }
    }
  },
  {
    'name': 'Q3',
    'values': {
      'start': {
        'month': 6,
        'day': 1
      },
      'end': {
        'month': 8,
        'day': 30
      }
    }
  },
  {
    'name': 'Q4',
    'values': {
      'start': {
        'month': 9,
        'day': 1
      },
      'end': {
        'month': 11,
        'day': 31
      }
    }
  }
]

const dateRangeOptions = [
  {
    'start': new Date(NOW.getTime() - ONE_DAY),
    'end': NOW,
    'label': 'Previous Day'
  },
  {
    'start': new Date(NOW.getTime() - (ONE_DAY * 7)),
    'end': NOW,
    'label': 'Previous Week'
  },
  {
    'start': new Date(NOW.getTime() - (ONE_DAY * 30)),
    'end': NOW,
    'label': 'Previous 30 Days'
  },
  {
    'start': new Date(NOW.getTime() - (ONE_DAY * 182.5)),
    'end': NOW,
    'label': 'Previous 6 Months'
  },
  {
    'start': new Date(NOW - (ONE_DAY * 365)),
    'end': NOW,
    'label': 'Previous Year'
  },
  {
    'start': new Date(NOW.getTime() - (ONE_DAY * 365 * 5)),
    'end': NOW,
    'label': 'Previous 5 Years'
  },
  {
    'start': new Date(NOW.getTime() - (ONE_DAY * 365 * 10)),
    'end': NOW,
    'label': 'Previous 10 Years'
  }
];

[NOW.getFullYear() - 1, NOW.getFullYear()].forEach((year) => {
  quarterRanges.forEach((range) => {
    const startDate = new Date(year, range.values.start.month, range.values.start.day, 0, 0, 0)
    if (startDate.getTime() < NOW.getTime()) {
      const endDate = new Date(year, range.values.end.month, range.values.end.day, 23, 59, 59)
      dateRangeOptions.push({
        'start': startDate,
        'end': endDate,
        'label': range.name + ' ' + year
      })
    }
  })
})

class DashboardControl extends Component {
  constructor (props) {
    super(props)
    this.rangeChanged = this.rangeChanged.bind(this)
  }

  rangeChanged (event) {
    const {start, end} = dateRangeOptions[parseInt(event.target.value, 10)]
    this.props.setQueryRange(start, end)
    this.props.fetchAllDatasourcesData()
  }

  render () {
    const selectedRange = dateRangeOptions.findIndex((range) => {
      return range.start.getTime() === this.props.datasources.range.startDate.getTime() && range.end.getTime() === this.props.datasources.range.endDate.getTime()
    })
    return (
      <div className='form-group'>
        <label className='sr-only'>Time Range:</label>
        <select className='form-control' defaultValue={selectedRange} onChange={this.rangeChanged}>
          {
            dateRangeOptions.map((range, i) => (<option key={i} value={i}>{range.label}</option>))
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

DashboardControl.propTypes = {
  fetchAllDatasourcesData: PropTypes.func.isRequired,
  setQueryRange: PropTypes.func.isRequired,
  datasources: React.PropTypes.shape({
    range: React.PropTypes.shape({
      startDate: PropTypes.instanceOf(Date).isRequired,
      endDate: PropTypes.instanceOf(Date).isRequired
    })
  })
}

export default connect(stateToProps, dispatchToProps)(DashboardControl)
