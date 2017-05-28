import React, {Component} from 'react';
import PropTypes from 'prop-types';

import {
  List,
  ListItem,
  Toggle,
  Subheader
} from 'material-ui';

import {
  ActionPowerSettingsNew,
  ImageTransform,
  ContentAdd
} from 'material-ui/svg-icons';

import './General.css';

const STATUS_OFF = 0;
const STATUS_RUNNING = 1;
const STATUS_STARTING = 2;
const STATUS_RESTARTING = 3;

const ServiceInfo = ({address, status}) => (
  <span className="service__info">
    ● {address}
    <br/>
    ● status:
    <b style={{
      color: {
        [STATUS_OFF]: 'inherit',
        [STATUS_RUNNING]: 'green',
        [STATUS_STARTING]: 'orange',
        [STATUS_RESTARTING]: 'orange'
      }[status]
    }}>
      {status === STATUS_OFF && 'off'}
      {status === STATUS_RUNNING && 'running'}
      {status === STATUS_STARTING && 'starting'}
      {status === STATUS_RESTARTING && 'restarting'}
    </b>
  </span>
);

const ServiceControl = ({status, onToggle}) => (
  <div className="service__control">
    <Toggle
      disabled={status === STATUS_RESTARTING}
      toggled={status === STATUS_RUNNING}
      onToggle={onToggle}
    />
  </div>
);

export class General extends Component {

  static propTypes = {
    config: PropTypes.object.isRequired,
    appStatus: PropTypes.number.isRequired,
    pacStatus: PropTypes.number.isRequired,
    onOpenClientDialog: PropTypes.func,
    onOpenPacDialog: PropTypes.func,
    onOpenServerDialog: PropTypes.func,
    onToggleClientService: PropTypes.func,
    onTogglePacService: PropTypes.func
  };

  render() {
    const {
      config,
      appStatus,
      pacStatus,
      onOpenClientDialog,
      onOpenPacDialog,
      onOpenServerDialog,
      onToggleClientService,
      onTogglePacService
    } = this.props;

    // Quick Fix: touch propagation
    const onTouchTap = (e, callback) => {
      if (e.target.nodeName !== 'INPUT' && typeof callback === 'function') {
        callback();
      }
    };

    return (
      <List>
        <Subheader>General</Subheader>
        <ListItem
          leftIcon={<ActionPowerSettingsNew/>}
          primaryText="BLINKSOCKS CLIENT"
          secondaryText={<ServiceInfo address={`${config.host}:${config.port}`} status={appStatus}/>}
          secondaryTextLines={2}
          rightIconButton={<ServiceControl status={appStatus} onToggle={onToggleClientService}/>}
          onTouchTap={(e) => onTouchTap(e, onOpenClientDialog)}
        />
        <ListItem
          leftIcon={<ImageTransform/>}
          primaryText="PAC SERVICE"
          secondaryText={<ServiceInfo address={config.pac} status={pacStatus}/>}
          secondaryTextLines={2}
          rightIconButton={<ServiceControl status={pacStatus} onToggle={onTogglePacService}/>}
          onTouchTap={(e) => onTouchTap(e, onOpenPacDialog)}
        />
        <ListItem
          leftIcon={<ContentAdd/>}
          primaryText="ADD A SERVER"
          secondaryText="Add blinksocks/shadowsocks server"
          onTouchTap={(e) => onTouchTap(e, onOpenServerDialog)}
        />
      </List>
    );
  }

}
