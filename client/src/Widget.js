import React, { Component } from 'react';
import {ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Line, LineChart} from 'recharts';
import _ from 'lodash';

const pageLength = 10;

class Widget extends Component {
  constructor(props) {
    super(props);
    this.state = {
      'page': 0
    }
  }

  setPage(page) {
    this.setState({ page });
  }

  renderPaging() {
    const maxPages = Math.ceil(this.props.data.data.length / pageLength);
    return (
      <div className="text-center">
        <div className="btn-group">
          <button disabled={this.state.page > 0 ? null : 'disabled'} onClick={() => this.setPage(this.state.page-1)} className="btn btn-sm btn-default"><i className="glyphicon glyphicon-triangle-left"></i><span className="sr-only">Previous</span></button>
          <span disabled="disabled" className="btn btn-sm btn-default">Page {this.state.page + 1}</span>
          <button disabled={this.state.page < maxPages - 1 ? null : 'disabled'} onClick={() => this.setPage(this.state.page+1)} className="btn btn-sm btn-default"><span className="sr-only">Next</span><i className="glyphicon glyphicon-triangle-right"></i></button>
        </div>
      </div>
    )
  }

  render() {
    switch(this.props.data.type) {
      case 'table':
        const headers = this.props.data.data.length > 0 ? _.keys(this.props.data.data[0]).filter((header) => header !== 'URL') : [];
        return (
          <table className="table table-striped">
            <thead>
              <tr>
                { headers.map((header,i) => (<th key={i}>{header}</th>)) }
              </tr>
            </thead>
            <tbody>
              {
                this.props.data.data.map((row,i) => {
                  return (
                    <tr key={i}>
                      { headers.map((header,j) => (
                        <td key={j}>
                          {isNaN(row[header]) ? row[header] : row[header].toLocaleString()}
                        </td>
                      )) }
                    </tr>
                  )
                })
              }
            </tbody>
          </table>
        )
      case 'callout':
        const columns = 'col-md-' + Math.floor(12 / this.props.data.data.length);
        return (
          <div className="row">
            {
              this.props.data.data.map((row,i) => {
                return (
                  <div key={i} className={columns}>
                    <div className="callout">
                      <div className="callout-value">
                        {isNaN(row[this.props.data.value]) ? row[this.props.data.value] : row[this.props.data.value].toLocaleString()}
                      </div>
                      <div className="callout-label">
                        <span className="label label-default">
                          {row[this.props.data.key]}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            }
          </div>
        )
      case 'barchart':
        const pageStart = (this.state.page * pageLength);
        const pageEnd = pageStart + pageLength;
        return (
          <div>
            <ResponsiveContainer width="100%" height={450}>
              <BarChart data={this.props.data.data.slice(pageStart,pageEnd)} margin={{top: 0, right: 0, left: 20, bottom: 0}} layout="vertical">
                <XAxis type="number" tickFormatter={(val) => isNaN(val) ? val : val.toLocaleString()} />
                <YAxis type="category" dataKey={this.props.data.key} width={200} tickFormatter={(val) => (val.length > 50 ? val.substring(0,50)+'...' : val)} />
                <CartesianGrid strokeDasharray="3 3"/>
                <Tooltip formatter={(val) => isNaN(val) ? val : val.toLocaleString()} />
                <Bar dataKey={this.props.data.value} fill="#BBB" barSize={20} />
              </BarChart>
            </ResponsiveContainer>
            { this.renderPaging() }
          </div>
        )
      case 'sparklines':
        return (
          <div className="row">
            {
              this.props.data.data.map((row,i) => {
                return (
                  <div key={i} className="col-md-4">
                    <p style={{'whiteSpace':'nowrap','overflow':'hidden','textOverflow':'ellipsis'}}>
                      <a href={row.url} target="_blank" rel="noopener noreferrer">{row.name}</a>
                    </p>
                    <ResponsiveContainer width="100%" height={100}>
                      <LineChart data={row.data}>
                        <Line dot={false} type='monotone' dataKey={this.props.data.secondary} stroke='#CCC' strokeWidth={1} />
                        <Line dot={false} type='monotone' dataKey={this.props.data.primary} stroke='#000' strokeWidth={1} />
                        <Tooltip formatter={(val) => isNaN(val) ? val : val.toLocaleString()} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                );
              })
            }
          </div>
        )
      default:
        return <div></div>
    }
  }

}

export default Widget;