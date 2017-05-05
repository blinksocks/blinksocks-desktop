import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {Dialog, FlatButton} from 'material-ui';

import {PacEditor} from '../../containers';

export class PacDialog extends Component {

  static propTypes = {
    isOpen: PropTypes.bool.isRequired,
    config: PropTypes.object.isRequired,
    onConfirm: PropTypes.func,
    onCancel: PropTypes.func
  };

  static defaultProps = {
    onConfirm: () => {
    },
    onCancel: () => {
    }
  };

  render() {
    const {isOpen, config, onConfirm, onCancel} = this.props;
    const actions = [
      <FlatButton primary label="OK" onTouchTap={onConfirm}/>,
      <FlatButton label="CANCEL" onTouchTap={onCancel}/>
    ];
    return (
      <Dialog open={isOpen} title="PAC" actions={actions} autoScrollBodyContent>
        <PacEditor config={config}/>
      </Dialog>
    );
  }

}
