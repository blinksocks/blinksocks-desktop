import React, {Component} from 'react';

import {
  AppBar,
  Dialog,
  Drawer,
  List,
  ListItem,
  IconButton,
  IconMenu,
  MenuItem,
  FlatButton,
  Divider,
  Subheader
} from 'material-ui';

import {
  ActionDelete,
  ActionUpdate,
  SocialPublic,
  ContentAdd,
  EditorModeEdit,
  ActionSettings,
  NavigationMoreVert
} from 'material-ui/svg-icons';

import {grey400} from 'material-ui/styles/colors';

import {ScreenMask} from '../../components';
import {ClientEditor, ServerEditor} from '../../containers';
import './App.css';

const iconButtonElement = (
  <IconButton touch={true}>
    <NavigationMoreVert color={grey400}/>
  </IconButton>
);

export class App extends Component {

  state = {
    isDisplayDrawer: false,
    isDisplayClientEditor: false,
    isDisplayServerEditor: false
  };

  constructor(props) {
    super(props);
    this.onMenuTouchTap = this.onMenuTouchTap.bind(this);
    this.onAddServer = this.onAddServer.bind(this);
    this.onCloseServerEditor = this.onCloseServerEditor.bind(this);
  }

  onMenuTouchTap() {
    this.setState({isDisplayDrawer: !this.state.isDisplayDrawer});
  }

  onAddServer() {
    this.setState({isDisplayServerEditor: true});
  }

  onCloseServerEditor() {
    this.setState({isDisplayServerEditor: false});
  }

  render() {
    const {isDisplayDrawer, isDisplayClientEditor, isDisplayServerEditor} = this.state;

    const rightIconMenu = (
      <IconMenu iconButtonElement={iconButtonElement}>
        <MenuItem leftIcon={<EditorModeEdit/>} onTouchTap={this.onAddServer}>Edit</MenuItem>
        <MenuItem leftIcon={<ActionDelete/>}>Delete</MenuItem>
      </IconMenu>
    );

    const actions = [
      <FlatButton primary={true} label="Save"/>,
      <FlatButton label="Cancel" onTouchTap={this.onCloseServerEditor}/>
    ];

    return (
      <div className="app">
        {isDisplayDrawer && <ScreenMask onTouchTap={this.onMenuTouchTap}/>}
        <AppBar title="blinksocks" onLeftIconButtonTouchTap={this.onMenuTouchTap}/>
        <List>
          <Subheader>General</Subheader>
          <ListItem
            leftIcon={<ActionSettings/>}
            primaryText="SETTINGS"
            secondaryText="Local/PAC settings"
          />
          <ListItem
            leftIcon={<ContentAdd/>}
            primaryText="ADD A SERVER"
            secondaryText="Add a blinksocks/shadowsocks server"
            onTouchTap={this.onAddServer}
          />
        </List>
        <Divider/>
        <List>
          <Subheader>Servers(2)</Subheader>
          <ListItem
            leftIcon={<SocialPublic/>}
            primaryText="Random"
            secondaryText="192.168.1.1:8080"
            rightIconButton={rightIconMenu}
          />
          <ListItem
            leftIcon={<SocialPublic/>}
            primaryText="US CA"
            secondaryText="192.168.1.2:8080"
            rightIconButton={rightIconMenu}
          />
        </List>
        {/* other stuff */}
        <Drawer open={isDisplayDrawer}>
          <List>
            <Subheader>blinksocks</Subheader>
            <ListItem
              primaryText="Check for Updates"
              secondaryText="Current: v1.0.0 Latest: v2.0.0"
              rightIcon={<ActionUpdate/>}
            />
          </List>
          <Divider/>
          <div className="app__info">
            <p>-&nbsp;<a target="_blank" href="https://github.com/blinksocks/blinksocks-desktop">About</a></p>
            <p>-&nbsp;<a target="_blank" href="https://github.com/blinksocks/blinksocks-desktop">FAQ</a></p>
            <p>-&nbsp;<a target="_blank" href="https://github.com/blinksocks/blinksocks-desktop">Github</a></p>
          </div>
        </Drawer>
        <Dialog open={isDisplayClientEditor} title="SETTINGS" actions={actions} autoScrollBodyContent={true}>
          <ClientEditor/>
        </Dialog>
        <Dialog open={isDisplayServerEditor} title="ADD A SERVER" actions={actions} autoScrollBodyContent={true}>
          <ServerEditor isFresh={true}/>
        </Dialog>
      </div>
    );
  }

}
