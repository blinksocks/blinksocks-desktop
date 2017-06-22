import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {Dialog, FlatButton} from 'material-ui';

export class PopupDialog extends Component {

  static propTypes = {
    isOpen: PropTypes.bool,
    title: PropTypes.string,
    children: PropTypes.element,
    onConfirm: PropTypes.func,
    onCancel: PropTypes.func
  };

  static defaultProps = {
    isOpen: false,
    title: '',
    children: null,
    onConfirm: () => {
    },
    onCancel: () => {
    }
  };

  render() {
    const {isOpen, title, children, onConfirm, onCancel} = this.props;
    const actions = [
      <FlatButton primary label="OK" onTouchTap={onConfirm}/>,
      <FlatButton label="CANCEL" onTouchTap={onCancel}/>
    ];
    return (
      <Dialog open={isOpen} title={title} actions={actions} autoScrollBodyContent>{children}</Dialog>
    );
  }

}
