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

import {ContentAdd} from 'material-ui/svg-icons';

import {PresetItem} from '../../components';
import {PresetEditor} from '../../containers';
import {defs as PRESET_DEFS} from '../../defs/presets';
import './ServerEditor.css';

export class ServerEditor extends Component {

  static propTypes = {
    server: PropTypes.object.isRequired,
    onEdit: PropTypes.func
  };

  static defaultProps = {
    onEdit: (/* server */) => {
    }
  };

  state = {
    isDisplayPresetEditor: false,
    isDisplayPresetSelector: false,
    anchorEl: null,
    presetIndex: -1
  };

  constructor(props) {
    super(props);
    this.onBeginEditPreset = this.onBeginEditPreset.bind(this);
    this.onBeginAddPreset = this.onBeginAddPreset.bind(this);
    this.onAddPreset = this.onAddPreset.bind(this);
    this.onEditPreset = this.onEditPreset.bind(this);
    this.onDeletePreset = this.onDeletePreset.bind(this);
    this.onEditTextField = this.onEditTextField.bind(this);
  }

  onBeginEditPreset(index) {
    this.setState({presetIndex: index, isDisplayPresetEditor: true});
  }

  onBeginAddPreset(e) {
    e.preventDefault();
    this.setState({
      isDisplayPresetSelector: true,
      anchorEl: e.currentTarget
    });
  }

  onEditTextField(e) {
    const {server} = this.props;
    const {name, value} = e.currentTarget;

    let _value = value;
    if (name === 'port') {
      _value = (value === '') ? '' : parseInt(value, 10);
    }

    this.props.onEdit({
      ...server,
      [name]: _value
    });
  }

  onAddPreset(name) {
    const {server} = this.props;
    const def = PRESET_DEFS[name];
    const params = {};
    for (const {key, defaultValue} of def) {
      params[key] = defaultValue;
    }
    this.props.onEdit({
      ...server,
      presets: server.presets.concat({
        name,
        params
      })
    });
    this.setState({isDisplayPresetSelector: false});
  }

  onEditPreset(preset) {
    const {server} = this.props;
    const {presetIndex} = this.state;
    this.props.onEdit({
      ...server,
      presets: server.presets.map((p, i) => (i === presetIndex) ? preset : p)
    });
  }

  onDeletePreset(index) {
    const {server} = this.props;
    this.props.onEdit({
      ...server,
      presets: server.presets.filter((preset, i) => i !== index)
    });
  }

  render() {
    const {server} = this.props;
    const {
      isDisplayPresetEditor,
      isDisplayPresetSelector,
      anchorEl,
      presetIndex
    } = this.state;
    const preset = server.presets[presetIndex] || {};
    return (
      <div className="server-editor">
        <TextField
          name="host"
          value={server.host}
          onChange={this.onEditTextField}
          floatingLabelText="Host"
          fullWidth
        />
        <TextField
          type="number"
          name="port"
          value={server.port}
          onChange={this.onEditTextField}
          floatingLabelText="Port"
          fullWidth
        />
        <TextField
          type="password"
          name="key"
          value={server.key}
          onChange={this.onEditTextField}
          floatingLabelText="Key"
          fullWidth
        />
        <label className="server-editor__label">Presets({server.presets.length})</label>
        <ul className="server-editor__presets">
          {server.presets.map((preset, i) => (
            <PresetItem
              key={i}
              preset={preset}
              disabled={i === 0}
              onEdit={this.onBeginEditPreset.bind(this, i)}
              onDelete={this.onDeletePreset.bind(this, i)}
            />
          ))}
        </ul>
        <FlatButton
          label="ADD ONE"
          icon={<ContentAdd/>}
          onTouchTap={this.onBeginAddPreset}
          secondary
          fullWidth
        />
        <TextField
          name="remarks"
          value={server.remarks}
          onChange={this.onEditTextField}
          floatingLabelText="Remarks"
          fullWidth
        />
        <Popover
          open={isDisplayPresetSelector}
          anchorEl={anchorEl}
          anchorOrigin={{horizontal: 'middle', vertical: 'center'}}
          targetOrigin={{horizontal: 'left', vertical: 'center'}}
          onRequestClose={() => this.setState({isDisplayPresetSelector: false})}>
          <Menu>
            {Object.keys(PRESET_DEFS).map((name, i) => (
              <MenuItem
                key={i}
                primaryText={name}
                onTouchTap={(e) => this.onAddPreset(name)}
              />
            ))}
          </Menu>
        </Popover>
        <Dialog
          open={isDisplayPresetEditor}
          title={preset.name}
          actions={[
            <FlatButton primary label="OK" onTouchTap={() => this.setState({isDisplayPresetEditor: false})}/>
          ]}
          autoScrollBodyContent={true}
        >
          {Object.keys(preset).length > 0 && (
            <PresetEditor
              preset={preset}
              def={PRESET_DEFS[preset.name]}
              onEdit={this.onEditPreset}
            />
          )}
        </Dialog>
      </div>
    );
  }

}
