import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {Dialog, FlatButton} from 'material-ui';

import {ClientEditor} from '../../containers';

export class ClientDialog extends Component {

  static propTypes = {
    isOpen: PropTypes.bool.isRequired,
    config: PropTypes.object.isRequired,
    onUpdate: PropTypes.func,
    onConfirm: PropTypes.func,
    onCancel: PropTypes.func
  };

  static defaultProps = {
    onUpdate: () => {
    },
    onConfirm: () => {
    },
    onCancel: () => {
    }
  };

  render() {
    const {isOpen, config, onUpdate, onConfirm, onCancel} = this.props;
    const actions = [
      <FlatButton primary label="OK" onTouchTap={onConfirm}/>,
      <FlatButton label="CANCEL" onTouchTap={onCancel}/>
    ];
    return (
      <Dialog open={isOpen} title="BLINKSOCKS CLIENT" actions={actions} autoScrollBodyContent={true}>
        <ClientEditor config={config} onEdit={onUpdate}/>
      </Dialog>
    );
  }

}
