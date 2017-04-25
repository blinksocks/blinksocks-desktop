import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {NotificationDoNotDisturbOn, ImageEdit} from 'material-ui/svg-icons';
import {red600, grey800} from 'material-ui/styles/colors';
import './PresetItem.css';

export class PresetItem extends Component {

  static propTypes = {
    preset: PropTypes.object.isRequired,
    onEdit: PropTypes.func,
    onDelete: PropTypes.func
  };

  static defaultProps = {
    onEdit: (/* preset */) => {
    },
    onDelete: (/* preset */) => {
    }
  };

  render() {
    const {preset} = this.props;
    return (
      <li className="preset-item">
        <div className="preset-item__info">
          <p>{preset.name}</p>
          <em>{Object.values(preset.params).join(' ') || 'no params'}</em>
        </div>
        <div className="preset-item__operation">
          <ImageEdit color={grey800} onClick={() => this.props.onEdit(preset)}/>
          <NotificationDoNotDisturbOn color={red600} onClick={() => this.props.onDelete(preset)}/>
        </div>
      </li>
    );
  }

}
