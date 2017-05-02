import React, {Component} from 'react';
import PropTypes from 'prop-types';

import {
  ListItem,
  IconButton,
  IconMenu,
  MenuItem,
  Toggle
} from 'material-ui';

import {
  ActionDelete,
  SocialPublic,
  EditorModeEdit,
  NavigationMoreVert
} from 'material-ui/svg-icons';

import {grey400} from 'material-ui/styles/colors';

const iconButtonElement = (
  <IconButton touch={true}>
    <NavigationMoreVert color={grey400}/>
  </IconButton>
);

export class ServerItem extends Component {

  static propTypes = {
    server: PropTypes.object.isRequired,
    onToggleEnabled: PropTypes.func,
    onEdit: PropTypes.func,
    onDelete: PropTypes.func
  };

  static defaultProps = {
    onToggleEnabled: () => {
    },
    onEdit: () => {
    },
    onDelete: () => {
    }
  };

  render() {
    const {server} = this.props;
    const rightIconMenu = (
      <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', width: '140px'}}>
        <Toggle
          style={{width: 0}}
          toggled={server.enabled}
          onToggle={this.props.onToggleEnabled}
        />
        <IconMenu iconButtonElement={iconButtonElement}>
          <MenuItem leftIcon={<EditorModeEdit/>} onTouchTap={this.props.onEdit}>Edit</MenuItem>
          <MenuItem leftIcon={<ActionDelete/>} onTouchTap={this.props.onDelete}>Delete</MenuItem>
        </IconMenu>
      </div>
    );
    return (
      <ListItem
        leftIcon={<SocialPublic/>}
        primaryText={server.remarks}
        secondaryText={`${server.host}:${server.port}`}
        rightIconButton={rightIconMenu}
        onTouchTap={this.props.onEdit}
      />
    );
  }

}
