import React, {Component} from 'react';
import PropTypes from 'prop-types';
import './SceenMask.css';

export class ScreenMask extends Component {

  static propTypes = {
    onTouchTap: PropTypes.func
  };

  static defaultProps = {
    onTouchTap: () => {
    }
  };

  render() {
    return (
      <div className="screen-mask" onClick={this.props.onTouchTap}/>
    );
  }

}
