import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {
  TextField,
  FlatButton,
  Popover,
  Menu,
  MenuItem,
  Dialog
} from 'material-ui';

import {
  ContentAdd,
  NotificationDoNotDisturbOn
} from 'material-ui/svg-icons';

import {red600} from 'material-ui/styles/colors';

import {PresetEditor} from '../../containers';
import './ServerEditor.css';

export class ServerEditor extends Component {

  static propTypes = {
    isFresh: PropTypes.bool.isRequired
  };

  state = {
    isDisplayPresetEditor: false,
    isDisplayPresetSelector: false,
    anchorEl: null,
    preset: {
      name: '',
      params: {}
    }
  };

  constructor(props) {
    super(props);
    this.onEditPreset = this.onEditPreset.bind(this);
    this.onAddPreset = this.onAddPreset.bind(this);
  }

  onEditPreset() {
    this.setState({isDisplayPresetEditor: true});
  }

  onAddPreset(e) {
    e.preventDefault();
    this.setState({
      isDisplayPresetSelector: true,
      anchorEl: e.currentTarget
    });
  }

  render() {
    const {
      isDisplayPresetEditor,
      isDisplayPresetSelector,
      anchorEl,
      preset
    } = this.state;

    const actions = [
      <FlatButton primary={true} label="Save"/>,
      <FlatButton label="Cancel" onTouchTap={() => this.setState({isDisplayPresetEditor: false})}/>
    ];

    return (
      <div className="server-editor">
        <TextField defaultValue="example.com" floatingLabelText="Host" fullWidth/>
        <TextField defaultValue="5432" floatingLabelText="Port" fullWidth/>
        <TextField type="password" defaultValue="***" floatingLabelText="Key" fullWidth/>
        <label className="server-editor__label">Presets</label>
        <ul className="server-editor__presets">
          <li onClick={this.onEditPreset}>
            <div className="server-editor__presets__preset__info">
              <p>ss-base</p>
              <em>no params</em>
            </div>
            <div className="server-editor__presets__preset__operation">
              <NotificationDoNotDisturbOn color={red600}/>
            </div>
          </li>
          <li onClick={this.onEditPreset}>
            <div className="server-editor__presets__preset__info">
              <p>ss-stream-cipher</p>
              <em>aes-256-cfb</em>
            </div>
            <div className="server-editor__presets__preset__operation">
              <NotificationDoNotDisturbOn color={red600}/>
            </div>
          </li>
        </ul>
        <FlatButton
          label="ADD ONE"
          icon={<ContentAdd/>}
          onTouchTap={this.onAddPreset}
          secondary
          fullWidth
        />
        <Popover
          open={isDisplayPresetSelector}
          anchorEl={anchorEl}
          anchorOrigin={{horizontal: 'middle', vertical: 'center'}}
          targetOrigin={{horizontal: 'left', vertical: 'center'}}
          onRequestClose={() => this.setState({isDisplayPresetSelector: false})}>
          <Menu>
            <MenuItem primaryText="ss-base"/>
            <MenuItem primaryText="ss-stream-cipher"/>
            <MenuItem primaryText="ss-aead-cipher"/>
            <MenuItem primaryText="obfs-http"/>
            <MenuItem primaryText="obfs-tls1.2-ticket"/>
          </Menu>
        </Popover>
        <Dialog
          open={isDisplayPresetEditor}
          title={`Edit Preset - ${preset.name}`} actions={actions}
          autoScrollBodyContent={true}
        >
          <PresetEditor preset={preset}/>
        </Dialog>
      </div>
    );
  }

}
