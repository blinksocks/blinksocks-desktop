import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {NotificationDoNotDisturbOn} from 'material-ui/svg-icons';
import {red600} from 'material-ui/styles/colors';
import './PresetItem.css';

export class PresetItem extends Component {

  static propTypes = {
    preset: PropTypes.object.isRequired,
    disabled: PropTypes.bool,
    onEdit: PropTypes.func,
    onDelete: PropTypes.func
  };

  static defaultProps = {
    disabled: false,
    onEdit: (/* preset */) => {
    },
    onDelete: (/* preset */) => {
    }
  };

  render() {
    const {preset, disabled} = this.props;
    return (
      <li className="preset-item" onClick={() => this.props.onEdit(preset)}>
        <div className="preset-item__info">
          <p>{preset.name}</p>
          <em>{Object.values(preset.params).join(' ') || 'no params'}</em>
        </div>
        {!disabled && (
          <div className="preset-item__operation">
            <NotificationDoNotDisturbOn color={red600} onClick={(e) => {
              this.props.onDelete(preset);
              e.stopPropagation();
            }}/>
          </div>
        )}
      </li>
    );
  }

}
