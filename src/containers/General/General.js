import React, {Component} from 'react';
import PropTypes from 'prop-types';
import QrCode from 'qrcode-reader';

import {
  IconButton,
  List,
  ListItem,
  Toggle,
  Subheader
} from 'material-ui';

import {
  ImageCropFree,
  ActionPowerSettingsNew,
  ImageTransform,
  ContentAdd
} from 'material-ui/svg-icons';

import {toast, takeScreenShot} from '../../helpers';

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
    onTogglePacService: PropTypes.func,
    onScannedQRCode: PropTypes.func
  };

  static defaultProps = {
    onOpenClientDialog: () => {
    },
    onOpenPacDialog: () => {
    },
    onOpenServerDialog: () => {
    },
    onToggleClientService: () => {
    },
    onTogglePacService: () => {
    },
    onScannedQRCode: (/* text */) => {
    }
  };

  state = {
    scanning: false
  };

  constructor(props) {
    super(props);
    this.onScanQRCode = this.onScanQRCode.bind(this);
  }

  async onScanQRCode() {
    try {
      this.setState({scanning: true});
      const reader = new QrCode();
      reader.callback = (err, data) => {
        if (err) {
          toast('Cannot find QR code!<br/>Try to <b>zoom-in</b> and put it to the <b>center</b> of the screen.');
        } else {
          this.props.onScannedQRCode(data.result);
        }
        this.setState({scanning: false});
      };
      reader.decode(await takeScreenShot());
    } catch (err) {
      toast(err.message);
      this.setState({scanning: false});
    }
  }

  render() {
    const {config, appStatus, pacStatus} = this.props;
    const {onOpenClientDialog, onOpenPacDialog, onOpenServerDialog} = this.props;
    const {onToggleClientService, onTogglePacService} = this.props;
    const {scanning} = this.state;

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
          secondaryText={
            <ServiceInfo
              address={config.pac_type === 0 ? `http://${config.pac_host}:${config.pac_port}` : config.pac_remote_url}
              status={pacStatus}
            />
          }
          secondaryTextLines={2}
          rightIconButton={<ServiceControl status={pacStatus} onToggle={onTogglePacService}/>}
          onTouchTap={(e) => onTouchTap(e, onOpenPacDialog)}
        />
        <ListItem
          leftIcon={<ContentAdd/>}
          primaryText="ADD A SERVER"
          secondaryText="Add blinksocks/shadowsocks server"
          rightIconButton={
            <IconButton
              tooltip={scanning ? '' : 'Scan QR code from screen'}
              tooltipPosition="top-left"
              disabled={scanning}
              onTouchTap={this.onScanQRCode}>
              <ImageCropFree/>
            </IconButton>
          }
          onTouchTap={(e) => onTouchTap(e, onOpenServerDialog)}
        />
      </List>
    );
  }

}
