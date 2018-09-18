import React, { Component } from 'react'
import {ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Line, LineChart, AreaChart, Area, CartesianGrid, PieChart, Pie, Cell} from 'recharts'
import _ from 'lodash'
import {
  COLORS
} from './constants'
import './Widget.scss'
import Info from './Info'
import PropTypes from 'prop-types'

const pageLength = 10

export default class Widget extends Component {
  constructor (props) {
    super(props)
    this.formatNumber = this.formatNumber.bind(this)
    this.state = {
      'page': 0,
      'sort': 0,
      'sortAsc': true
    }
  }

  setPage (page) {
    this.setState({ page })
  }

  renderPaging () {
    const maxPages = Math.ceil(this.props.data.data.length / pageLength)
    return (
      <div className='text-center'>
        <div className='btn-group'>
          <button disabled={this.state.page > 0 ? null : 'disabled'} onClick={() => this.setPage(this.state.page - 1)} className='btn btn-sm btn-default'><i className='glyphicon glyphicon-triangle-left' /><span className='sr-only'>Previous</span></button>
          <span disabled='disabled' className='btn btn-sm btn-default'>Page {this.state.page + 1}</span>
          <button disabled={this.state.page < maxPages - 1 ? null : 'disabled'} onClick={() => this.setPage(this.state.page + 1)} className='btn btn-sm btn-default'><span className='sr-only'>Next</span><i className='glyphicon glyphicon-triangle-right' /></button>
        </div>
      </div>
    )
  }

  formatNumber (val) {
    return (isNaN(val) ? val : (this.props.data.percent ? (val * 100).toLocaleString() + '%' : val.toLocaleString()))
  }

  render () {
    switch (this.props.data.type) {
      case 'table':
        const headers = this.props.data.data.length > 0 ? _.keys(this.props.data.data[0]).filter((header) => header !== 'URL') : []
        this.props.data.data.sort((rowA, rowB) => {
          const rowAValue = rowA[headers[this.state.sort]]
          const rowAValueNumber = parseFloat(rowAValue)
          const rowBValue = rowB[headers[this.state.sort]]
          const rowBValueNumber = parseFloat(rowBValue)
          if (isNaN(rowAValueNumber) || isNaN(rowBValueNumber)) {
            if (this.state.sortAsc) {
              return rowAValue.localeCompare(rowBValue)
            } else {
              return rowBValue.localeCompare(rowAValue)
            }
          } else {
            if (this.state.sortAsc) {
              return rowAValueNumber - rowBValueNumber
            } else {
              return rowBValueNumber - rowAValueNumber
            }
          }
        })
        return (
          <div className='table-scroller'>
            <table className='table table-striped table-sortable'>
              <thead>
                <tr>
                  { headers.map((header, i) => {
                    return (
                      <th key={i} onClick={() => this.state.sort === i ? this.setState({sortAsc: !this.state.sortAsc}) : this.setState({sort: i, sortAsc: true})}>
                        {header}
                        &nbsp;
                        { this.state.sort === i ? (
                            this.state.sortAsc
                              ? <span className='glyphicon glyphicon-triangle-bottom'>
                                <span className='sr-only'>Sorted Ascending</span>
                              </span>
                              : <span className='glyphicon glyphicon-triangle-top'>
                                <span className='sr-only'>Sorted Descending</span>
                              </span>
                        ) : null }
                      </th>
                    )
                  }) }
                </tr>
              </thead>
              <tbody>
                {
                  this.props.data.data.map((row, i) => {
                    return (
                      <tr key={i}>
                        { headers.map((header, j) => (
                          <td key={j}>
                            {this.formatNumber(row[header])}
                          </td>
                        )) }
                      </tr>
                    )
                  })
                }
              </tbody>
              {
                this.props.data.sumRows && this.props.data.sumRows.length > 0 && (
                  <tfoot>
                    <tr>
                      {
                        headers.map((header, i) => {
                          if (this.props.data.sumRows.indexOf(header) >= 0) {
                            const sum = this.props.data.data.reduce((total, row) => {
                              return total + parseFloat(row[header])
                            }, 0)
                            return (<td>{sum}</td>)
                          } else if (i === 0) {
                            return (<td>Total:</td>)
                          }
                          return (<td />)
                        })
                      }
                    </tr>
                  </tfoot>
                )
              }
            </table>
          </div>
        )
      case 'callout':
        return (
          <div>
            { _.chunk(this.props.data.data, 2).map((row, i) => {
              return (
                <div className='row' key={i}>
                  { row.map((item, j) => {
                    const columns = 'col-md-' + Math.floor(12 / row.length)
                    return (
                      <div key={j} className={columns}>
                        <div className='callout'>
                          { item.helptext ? <Info helptext={item.helptext} offsetRight={-10} offsetTop={-10} /> : null }
                          <div className='callout-value'>
                            {this.formatNumber(item[this.props.data.value])}
                          </div>
                          <div className='callout-label'>
                            <span className='label'>
                              {item[this.props.data.key]}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            }) }
          </div>
        )
      case 'barchart':
        const pageStart = (this.state.page * pageLength)
        const pageEnd = pageStart + pageLength
        return (
          <div>
            <ResponsiveContainer width='100%' height={450}>
              <BarChart data={this.props.data.data.slice(pageStart, pageEnd)} margin={{top: 0, right: 0, left: 20, bottom: 0}} layout='vertical'>
                <XAxis type='number' tickFormatter={this.formatNumber} />
                <YAxis type='category' dataKey={this.props.data.key} width={200} tickFormatter={(val) => (val.length > 50 ? val.substring(0, 50) + '...' : val)} />
                <Tooltip formatter={this.formatNumber} />
                { this.props.data.value.map ? this.props.data.value.map((value, i) => (<Bar key={i} dataKey={value} fill={COLORS.GRADIENT_BLUE[i]} barSize={20} />)) : (<Bar dataKey={this.props.data.value} fill={COLORS.BLUE} barSize={20} />) }
              </BarChart>
            </ResponsiveContainer>
            { this.renderPaging() }
          </div>
        )
      case 'sparklines':
        let max = 0
        let min = Number.MAX_VALUE
        this.props.data.data.forEach((row) => {
          row.data.forEach((point) => {
            if (point[this.props.data.primary] > max) {
              max = point[this.props.data.primary]
            }
            if (point[this.props.data.primary] < min) {
              min = point[this.props.data.primary]
            }
            if (point[this.props.data.secondary] > max) {
              max = point[this.props.data.secondary]
            }
            if (point[this.props.data.secondary] < min) {
              min = point[this.props.data.secondary]
            }
          })
        })
        return (
          <div className='row'>
            {
              this.props.data.data.map((row, i) => {
                return (
                  <div key={i} className='col-md-6'>
                    <div className='sparkline'>
                      <div className='sparkline-title'>
                        <a href={row.url} target='_blank' rel='noopener noreferrer'>{row.name}</a>
                      </div>
                      <ResponsiveContainer width='100%' height={100}>
                        <LineChart data={row.data}>
                          <XAxis dataKey={this.props.data.xAxis} hide label='Date' tick={false} tickLine={false} axisLine={false} />
                          <YAxis domain={[min, max]} hide label='Date' tick={false} tickLine={false} axisLine={false} />
                          <Line dot={false} type='monotone' dataKey={this.props.data.secondary} stroke={COLORS.GRAY} strokeWidth={1} />
                          <Line dot={false} type='monotone' dataKey={this.props.data.primary} stroke={COLORS.GRADIENT_BLUE[0]} strokeWidth={1} />
                          <Tooltip formatter={this.formatNumber} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )
              })
            }
          </div>
        )
      case 'stackedchart':
        const areas = []
        this.props.data.data.forEach((row) => {
          _.keys(row).forEach((value) => {
            if (areas.indexOf(value) < 0 && value !== this.props.data.xAxis) {
              areas.push(value)
            }
          })
        })
        return (
          <div>
            <ResponsiveContainer width='100%' height={450}>
              <AreaChart data={this.props.data.data}>
                <XAxis dataKey={this.props.data.xAxis} />
                <YAxis />
                <Tooltip formatter={this.formatNumber} />
                <CartesianGrid strokeDasharray='3 3' />
                {
                  areas.map((key, i) => (<Area type='monotone' stroke='none' stackId='1' key={i} dataKey={key} fillOpacity={1} fill={COLORS.GRADIENT_BLUE[i]} />))
                }
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )
      case 'pie':
        return (
          <div>
            <ResponsiveContainer width='100%' height={450}>
              <PieChart>
                <Pie data={this.props.data.data} fill={COLORS.GRADIENT_BLUE[0]} nameKey={this.props.data.key} dataKey={this.props.data.value} label={(row) => row[this.props.data.key]}>
                  {
                    this.props.data.data.map((data, i) => (<Cell key={i} fill={COLORS.GRADIENT_BLUE[i]} />))
                  }
                </Pie>
                <Tooltip formatter={this.formatNumber} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )
      default:
        return <div />
    }
  }
}

Widget.propTypes = {
  data: React.PropTypes.shape({
    data: PropTypes.any,
    percent: PropTypes.boolean,
    type: PropTypes.string,
    key: PropTypes.string,
    value: PropTypes.string,
    primary: PropTypes.string,
    secondary: PropTypes.string,
    xAxis: PropTypes.string,
    sumRows: PropTypes.array
  })
}
