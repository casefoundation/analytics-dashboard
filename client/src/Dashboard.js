import React, { Component } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import {
  fetchDatasourceNames,
  setDashboardName,
  fetchDashboardNames,
  fetchAllDatasourcesData
} from './actions'
import _ from 'lodash'
import DashboardControl from './DashboardControl'
import Widgets from './Widgets'
import './Dashboard.scss'
import logo from './theme/logo.svg'
import Info from './Info'
import { Link } from 'react-router-dom'
import PropTypes from 'prop-types'

class Dashboard extends Component {
  componentDidMount () {
    this.loadDashboard(this.props.match.params.dashboard || 'default')
    this.interval = window.setInterval(() => this.props.fetchAllDatasourcesData(), 1000 * 60 * 5)
  }

  componentWillUnmount () {
    window.clearInterval(this.interval)
  }

  componentWillReceiveProps (props) {
    if (this.props.match.params.dashboard !== props.match.params.dashboard) {
      this.loadDashboard(props.match.params.dashboard || 'default')
    }
  }

  loadDashboard (dashboard) {
    this.props.setDashboardName(dashboard)
    this.props.fetchDashboardNames()
    this.props.fetchDatasourceNames()
  }

  render () {
    const datasourcesAsArray = _.toPairs(this.props.datasources.data).filter((datasource) => datasource[1].data.length > 0).map((datasource) => ({ 'name': datasource[0], 'data': datasource[1] }))
    return (
      <div>
        <nav className='navbar navbar-inverse navbar-static-top'>
          <div className='container-fluid'>
            <div className='navbar-header'>
              <a className='navbar-brand' href='/'>
                <img src={logo} alt='Logo' className='logo' />
              </a>
            </div>
            { this.props.datasources.dashboards.length > 1 && (
              <ul className='nav navbar-nav'>
                {
                  this.props.datasources.dashboards.map((dashboard, i) => (<li key={i} className={dashboard.name === this.props.datasources.dashboard ? 'active' : null}><Link to={dashboard.name === 'default' ? '/' : '/' + dashboard.name}>{dashboard.label}</Link></li>))
                }
              </ul>
            )}
            <div className='navbar-form navbar-right'>
              <DashboardControl />
            </div>
          </div>
        </nav>
        <div className='container-fluid'>
          <div className='row'>
            <div className='col-md-2'>
              <div className='panel panel-default'>
                <div className='panel-heading'>Quick Stats</div>
                <div className='panel-body'>
                  { datasourcesAsArray.map((datasource) => {
                    return datasource.data.data.filter((data) => data.type === 'quickstat').map((data) => {
                      return (
                        <div className='callout'>
                          <Info helptext={data.data.helptext} offsetRight={-10} offsetTop={-10} />
                          <div className='callout-value'>
                            {isNaN(data.data.value) ? data.data.value : data.data.value.toLocaleString()}
                          </div>
                          <div className='callout-label'>
                            <span className='label'>
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
            <div className='col-md-10'>
              <Widgets />
            </div>
          </div>
        </div>
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
    fetchDatasourceNames,
    setDashboardName,
    fetchDashboardNames,
    fetchAllDatasourcesData
  }, dispatch)
}

Dashboard.propTypes = {
  match: React.PropTypes.shape({
    params: React.PropTypes.shape({
      dashboard: PropTypes.string
    })
  }),
  fetchDatasourceNames: PropTypes.func.isRequired,
  setDashboardName: PropTypes.func.isRequired,
  fetchDashboardNames: PropTypes.func.isRequired,
  fetchAllDatasourcesData: PropTypes.func.isRequired,
  datasources: React.PropTypes.shape({
    data: PropTypes.object.isRequired,
    dashboards: PropTypes.array.isRequired,
    dashboard: PropTypes.string.isRequired
  })
}

export default connect(stateToProps, dispatchToProps)(Dashboard)
