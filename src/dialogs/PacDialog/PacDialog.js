import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {Dialog, FlatButton} from 'material-ui';

import {PacEditor} from '../../containers';

export class PacDialog extends Component {

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
      <Dialog open={isOpen} title="Proxy Auto Config (PAC)" actions={actions} autoScrollBodyContent>
        <PacEditor config={config} onEdit={onUpdate}/>
      </Dialog>
    );
  }

}
