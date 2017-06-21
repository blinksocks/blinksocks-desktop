import React, {Component} from 'react';
import PropTypes from 'prop-types';

import {TextField} from 'material-ui';

import './PacEditor.css';

const PAC_TYPE_LOCAL = 0;
const PAC_TYPE_REMOTE = 1;

export class PacEditor extends Component {

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
  }

  onSwitchType(type) {
    const {config} = this.props;
    this.props.onEdit({
      ...config,
      pac_type: type
    });
  }

  onTextFieldChange(e) {
    const {config} = this.props;
    const {name, value} = e.currentTarget;
    let _value = e.currentTarget.value;

    if (name === 'pac_custom_rules') {
      _value = value.split('\n');
    }

    if (name === 'pac_port') {
      _value = parseInt(value || '1090', 10);
    }

    this.props.onEdit({
      ...config,
      [name]: _value
    });
  }

  render() {
    const {config} = this.props;
    const type = config.pac_type;
    return (
      <div className="paceditor">
        <div className="paceditor__type">
          <label>
            <input
              type="radio"
              name="type"
              checked={type === PAC_TYPE_LOCAL}
              onChange={() => this.onSwitchType(PAC_TYPE_LOCAL)}
            />
            Local
          </label>
          <label>
            <input
              type="radio"
              name="type"
              checked={type === PAC_TYPE_REMOTE}
              onChange={() => this.onSwitchType(PAC_TYPE_REMOTE)}
            />
            Remote
          </label>
        </div>
        {type === PAC_TYPE_LOCAL && (
          <div>
            <TextField
              type="string"
              name="pac_host"
              value={config.pac_host || ''}
              onChange={this.onTextFieldChange}
              floatingLabelText="Host"
              fullWidth
            />
            <TextField
              type="number"
              name="pac_port"
              value={config.pac_port || 1090}
              onChange={this.onTextFieldChange}
              floatingLabelText="Port"
              fullWidth
            />
            <TextField
              type="string"
              name="pac_custom_rules"
              value={(config.pac_custom_rules || []).join('\n')}
              onChange={this.onTextFieldChange}
              floatingLabelText="Custom Rules(line by line)"
              fullWidth
              multiLine
            />
          </div>
        )}
        {type === PAC_TYPE_REMOTE && (
          <div>
            <TextField
              type="string"
              name="pac_remote_url"
              value={config.pac_remote_url || ''}
              onChange={this.onTextFieldChange}
              floatingLabelText="Address"
              hintText="http://abc.com:8080/proxy.pac"
              fullWidth
            />
          </div>
        )}
      </div>
    );
  }

}
