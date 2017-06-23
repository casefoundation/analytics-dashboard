import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import _ from 'lodash';
import Masonry from 'react-masonry-component';
import Widget from './Widget';

class Widgets extends Component {

  getWidgetWidthClass(widget) {
    return 'col-md-' + this.getWidgetWidthNumber(widget);
  }

  getWidgetWidthNumber(widget) {
    return 4;
  }

  render() {
    const datasourcesAsArray = _.toPairs(this.props.datasources.data).filter((datasource) => datasource[1].length > 0).map((datasource) => ({ 'name': datasource[0], 'data': datasource[1] }));
    const widgets = [];
    datasourcesAsArray.forEach((datasource) => {
      datasource.data.filter((data) => Widgets.isWidgetType(data.type)).forEach((data) => {
        widgets.push({
          datasource,
          data
        });
      });
    });
    widgets.sort((a,b) => {
      return this.getWidgetWidthNumber(b) - this.getWidgetWidthNumber(a)
    })
    return (
      <Masonry
        className="row"
        >
        {
          widgets.map((widget,i) => {
            return (
              <div key={i} className={this.getWidgetWidthClass(widget)}>
                <div className="panel panel-default">
                  <div className="panel-heading">{widget.data.label}</div>
                  <div className="panel-body">
                    <Widget datasource={widget.datasource} data={widget.data} />
                  </div>
                </div>
              </div>
            )
          })
        }
      </Masonry>
    )
  }
}

Widgets.isWidgetType = (type) => {
  return ['table','barchart','callout','sparklines'].indexOf(type) >= 0;
}


const stateToProps = (state) => {
  return {
    datasources: state.datasources
  }
}

const dispatchToProps = (dispatch) => {
  return bindActionCreators({
  }, dispatch)
}

export default connect(stateToProps, dispatchToProps)(Widgets)
