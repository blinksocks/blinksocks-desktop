import React, {Component} from 'react';
import PropTypes from 'prop-types';

import {TextField} from 'material-ui';

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

  onTextFieldChange(e) {
    const {config} = this.props;
    const {name, value} = e.currentTarget;
    this.props.onEdit({
      ...config,
      [name]: value
    });
  }

  render() {
    const {config} = this.props;
    return (
      <div className="client-editor">
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
