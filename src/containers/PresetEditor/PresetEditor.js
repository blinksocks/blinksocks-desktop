import React, {Component} from 'react';
import PropTypes from 'prop-types';
import './PresetEditor.css';

export class PresetEditor extends Component {

  static propTypes = {
    preset: PropTypes.object.isRequired
  };

  render() {
    return (
      <div>
        <span>key</span>
        :
        <span>value</span>
      </div>
    );
  }

}
