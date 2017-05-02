import React, {Component} from 'react';
import PropTypes from 'prop-types';

import {PresetParamItem} from '../../components';
import './PresetEditor.css';

export class PresetEditor extends Component {

  static propTypes = {
    preset: PropTypes.object.isRequired,
    def: PropTypes.array.isRequired,
    onEdit: PropTypes.func
  };

  static defaultProps = {
    onEdit: (/* preset */) => {
    }
  };

  render() {
    const {preset, def} = this.props;
    const {name, params} = preset;
    return (
      <ul className="preset-editor">
        {def.map((d, i) => (
          <PresetParamItem
            key={i}
            def={d}
            value={params[d.key]}
            onChange={(key, value) => this.props.onEdit({
              ...preset,
              params: {...params, [key]: value}
            })}
          />
        ))}
        {def.length === 0 && `no parameters for "${name}" currently.`}
      </ul>
    );
  }

}
