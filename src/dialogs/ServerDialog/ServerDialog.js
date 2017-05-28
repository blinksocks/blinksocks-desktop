import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {Dialog, FlatButton} from 'material-ui';

import {ServerEditor} from '../../containers';

export class ServerDialog extends Component {

  static propTypes = {
    isOpen: PropTypes.bool.isRequired,
    server: PropTypes.object.isRequired,
    serverIndex: PropTypes.number.isRequired,
    onUpdate: PropTypes.func,
    onConfirm: PropTypes.func,
    onCancel: PropTypes.func
  };

  static defaultProps = {
    onUpdate: (/* server */) => {
    },
    onConfirm: () => {
    },
    onCancel: () => {
    }
  };

  render() {
    const {isOpen, server, serverIndex, onUpdate, onConfirm, onCancel} = this.props;
    const actions = [
      <FlatButton primary label="OK" onTouchTap={onConfirm}/>,
      <FlatButton label="CANCEL" onTouchTap={onCancel}/>
    ];
    return (
      <Dialog
        open={isOpen}
        title={`${serverIndex === -1 ? 'ADD' : 'EDIT'} A SERVER`}
        actions={actions}
        autoScrollBodyContent={true}
      >
        <ServerEditor server={server} onEdit={onUpdate}/>
      </Dialog>
    );
  }

}
