import React, {Component} from 'react';
import PropTypes from 'prop-types';

import {
  DropDownMenu,
  MenuItem,
  Subheader,
  TextField
} from 'material-ui';

import './ClientEditor.css';

const LOG_LEVELS = ['error', 'warn', 'info', 'verbose', 'debug', 'silly'];

export class ClientEditor extends Component {

  static propTypes = {
    config: PropTypes.object.isRequired,
    onEdit: PropTypes.func
  };

  static defaultProps = {
    onEdit: (/* config */) => {
    }
  };

  constructor(props) {
    super(props);
    this.onTextFieldChange = this.onTextFieldChange.bind(this);
    this.onLogLevelChange = this.onLogLevelChange.bind(this);
  }

  onTextFieldChange(e) {
    const {client} = this.props;
    const {name, value} = e.currentTarget;
    this.props.onEdit({
      ...client,
      [name]: ['port', 'timeout'].includes(name) ? parseInt(value, 10) : value
    });
  }

  onLogLevelChange(level) {
    const {client} = this.props;
    this.props.onEdit({
      ...client,
      log_level: level
    });
  }

  render() {
    const {config} = this.props;
    return (
      <div className="client-editor">
        <Subheader>Socks5/Socks4(a)/HTTP Service</Subheader>
        <TextField
          name="host"
          value={config.host}
          onChange={this.onTextFieldChange}
          floatingLabelText="Host"
          fullWidth
        />
        <TextField
          type="number"
          name="port"
          value={config.port}
          onChange={this.onTextFieldChange}
          floatingLabelText="Port"
          fullWidth
        />
        <TextField
          type="number"
          name="timeout"
          value={config.timeout}
          onChange={this.onTextFieldChange}
          floatingLabelText="Timeout"
          fullWidth
        />
        <div className="client-editor__dropdown">
          <span>Log Level</span>
          <DropDownMenu name="log_level" value={config.log_level} onChange={(e, index, v) => this.onLogLevelChange(v)}>
            {LOG_LEVELS.map((v, i) => (
              <MenuItem key={i} value={v} primaryText={v}/>
            ))}
          </DropDownMenu>
        </div>
        <Subheader>PAC Service</Subheader>
        <TextField
          type="string"
          name="pac"
          value={config.pac}
          onChange={this.onTextFieldChange}
          floatingLabelText="PAC Address"
          hintText="http://abc.com:8080/proxy.pac"
          fullWidth
        />
      </div>
    );
  }

}
