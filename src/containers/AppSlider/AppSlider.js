import React, {Component} from 'react';
import PropTypes from 'prop-types';

import {
  Drawer,
  List,
  ListItem,
  Subheader,
  Divider
} from 'material-ui';

import {ActionUpdate} from 'material-ui/svg-icons';

import './AppSlider.css';

export class AppSlider extends Component {

  static propTypes = {
    isOpen: PropTypes.bool.isRequired
  };

  render() {
    const {isOpen} = this.props;
    return (
      <Drawer className="appslider" open={isOpen}>
        <List>
          <Subheader>blinksocks</Subheader>
          <ListItem
            primaryText="Check for Updates"
            secondaryText="Current: v1.0.0 Latest: v2.0.0"
            rightIcon={<ActionUpdate/>}
          />
        </List>
        <Divider/>
        <div className="appslider__footer">
          <p>-&nbsp;<a target="_blank" rel="noopener noreferrer" href="https://github.com/blinksocks/blinksocks-desktop">About</a></p>
          <p>-&nbsp;<a target="_blank" rel="noopener noreferrer" href="https://github.com/blinksocks/blinksocks-desktop">FAQ</a></p>
          <p>-&nbsp;<a target="_blank" rel="noopener noreferrer" href="https://github.com/blinksocks/blinksocks-desktop">Github</a></p>
        </div>
      </Drawer>
    );
  }

}
