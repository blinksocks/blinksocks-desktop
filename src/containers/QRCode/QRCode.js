import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {FlatButton} from 'material-ui';
import './QRCode.css';

export class QRCode extends Component {

  static propTypes = {
    qrcodes: PropTypes.object,
    onCopyText: PropTypes.func,
    onCopyImage: PropTypes.func
  };

  static defaultProps = {
    qrcodes: {},
    onCopyText: (/* name */) => {
    },
    onCopyImage: (/* name */) => {
    }
  };

  render() {
    const {qrcodes, onCopyText, onCopyImage} = this.props;
    const names = Object.keys(qrcodes);
    return (
      <div className="qrcodes">
        {names.map((name) => (
          <div className="qrcodes__qrcode">
            <div className="qrcodes__qrcode__name">{name}</div>
            <img className="qrcodes__qrcode__image" alt={name} src={qrcodes[name]}/>
            <div className="qrcodes__qrcode__tools">
              <FlatButton primary onTouchTap={() => onCopyText(name)} label="Copy Text"/>
              <FlatButton primary onTouchTap={() => onCopyImage(name)} label="Copy Image"/>
            </div>
          </div>
        ))}
      </div>
    );
  }

}
