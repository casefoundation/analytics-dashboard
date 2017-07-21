import React, { Component } from 'react';
import './Info.scss'

export default class Info extends Component {
  constructor(props) {
    super(props);
    this.state = {
      'visible': false,
      'transitioningToInvisible': false
    }
  }

  showTooltip() {
    this.setState({
      'visible':true,
      'transitioningToInvisible':false
    });
  }

  hideTooltip() {
    this.setState({'transitioningToInvisible':true});
    setTimeout(() => {
      if (this.state.transitioningToInvisible) {
        this.setState({
          'visible':false,
          'transitioningToInvisible':false
        });
      }
    },250);
  }

  render() {
    const overlayStyle = {
      'opacity': this.state.visible ? 1 : 0,
      'top': (this.infoElement ? this.infoElement.offsetTop + this.infoElement.offsetHeight : 0) + this.props.offsetTop,
      'right': this.props.offsetRight
    }
    return (
      <div className="info" ref={(element) => { this.infoElement = element; }} >
        <span className="glyphicon glyphicon-question-sign" onMouseOver={() => this.showTooltip()} onMouseOut={() => this.hideTooltip()}>
          <span className="sr-only">Info</span>
        </span>
        <div style={overlayStyle} ref={(element) => { this.tooltipElement = element; }} className="dashboard-tooltip">
          <span className="glyphicon glyphicon-triangle-top"></span>
          { this.props.helptext }
        </div>
      </div>
    );
  }
}
