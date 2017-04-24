import React, {Component} from 'react';
// import PropTypes from 'prop-types';
import {
  TextField
} from 'material-ui';
import './ClientEditor.css';

export class ClientEditor extends Component {

  render() {
    return (
      <div className="client-editor">
        <TextField defaultValue="localhost" floatingLabelText="Host" fullWidth/>
        <TextField defaultValue="1080" floatingLabelText="Port" fullWidth/>
        <TextField defaultValue="600" floatingLabelText="Timeout" fullWidth/>
      </div>
    );
  }

}
