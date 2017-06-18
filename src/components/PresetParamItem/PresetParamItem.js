import React, {Component} from 'react';
import PropTypes from 'prop-types';

import {
  TextField,
  DropDownMenu,
  MenuItem
} from 'material-ui';

import './PresetParamItem.css';

function getValueComponent(def, value, onChange) {
  const {type, key} = def;
  switch (type) {
    case 'string':
      return (
        <TextField
          type="string"
          value={value}
          onChange={(e) => onChange(e.currentTarget.value)}
          floatingLabelText={key}
          fullWidth
        />
      );
    case 'number': {
      return (
        <TextField
          type="number"
          value={value}
          onChange={(e) => onChange(e.currentTarget.value)}
          floatingLabelText={key}
          fullWidth
        />
      );
    }
    case 'enum': {
      const {values} = def;
      return (
        <div className="preset-param-item__enum">
          <span>{def.key}</span>
          <DropDownMenu value={value} onChange={(e, key, v) => onChange(v)}>
            {values.map((v, i) => (
              <MenuItem key={i} value={v} primaryText={v}/>
            ))}
          </DropDownMenu>
        </div>
      );
    }
    case 'array': {
      return (
        <TextField
          type="string"
          value={value.join('\n')}
          onChange={(e) => onChange(e.currentTarget.value.split('\n'))}
          floatingLabelText={key}
          fullWidth
          multiLine
        />
      );
    }
    default:
      return (
        <div>Unknown Type: "{type}"</div>
      );
  }
}

export class PresetParamItem extends Component {

  static propTypes = {
    def: PropTypes.object.isRequired,
    value: PropTypes.any.isRequired,
    onChange: PropTypes.func
  };

  static defaultProps = {
    onChange: (/* key, value */) => {
    }
  };

  render() {
    const {def, value} = this.props;
    const {key, defaultValue} = def;
    return (
      <li className="preset-param-item">
        {getValueComponent(
          def,
          typeof value === 'undefined' ? defaultValue : value,
          (newValue) => this.props.onChange(key, newValue)
        )}
      </li>
    );
  }

}
