import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import _ from 'lodash';
import Masonry from 'react-masonry-component';
import Widget from './Widget';
import Info from './Info';
import './Widgets.scss';

class Widgets extends Component {

  getWidgetWidthClass(widget) {
    return 'col-lg-4 col-md-6 col-sm-12'
  }

  render() {
    const datasourcesAsArray = _.toPairs(this.props.datasources.data).filter((datasource) => datasource[1].data.length > 0).map((datasource) => ({ 'name': datasource[0], 'data': datasource[1] }));
    const widgets = [];
    datasourcesAsArray.forEach((datasource) => {
      datasource.data.data.filter((data) => Widgets.isWidgetType(data.type)).forEach((data) => {
        widgets.push({
          datasource,
          data
        });
      });
    });
    return (
      <Masonry
        className="row"
        >
        {
          widgets.map((widget,i) => {
            return (
              <div key={i} className={[this.getWidgetWidthClass(widget),widget.datasource.data.loading ? 'loading' : null].join(' ')}>
                <div className="panel panel-default">
                  <div className="panel-heading">
                    <h3 className="panel-title pull-left">
                      {widget.data.label}
                      { widget.datasource.data.loading ? (
                        <span> (Loading)</span>
                      ) : null }
                    </h3>
                    <div className="pull-right">
                      <Info helptext={widget.data.helptext} offsetRight={20} offsetTop={0} />
                    </div>
                  </div>
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
